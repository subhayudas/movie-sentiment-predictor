import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow warnings

import tensorflow as tf
import joblib
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
import re
from collections import Counter
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Create a custom unpickler to handle module remapping
class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        # Remap old keras module paths to new ones
        if module.startswith('keras.'):
            # Try different module path variations
            if module == 'keras.preprocessing.text':
                module = 'tensorflow.keras.preprocessing.text'
            elif module == 'keras.src.preprocessing.text':
                module = 'tensorflow.keras.preprocessing.text'
            elif module == 'keras.src.preprocessing':
                module = 'tensorflow.keras.preprocessing'
        
        return super().find_class(module, name)

# Load the model and tokenizer with custom object scope to handle compatibility
try:
    # First attempt: try loading with standard method
    model = tf.keras.models.load_model("model.h5")
except ValueError as e:
    # Second attempt: use custom object scope to ignore incompatible parameters
    print("Using compatibility mode to load model...")
    
    # Custom LSTM layer that ignores the time_major parameter
    class CompatibleLSTM(tf.keras.layers.LSTM):
        def __init__(self, *args, **kwargs):
            # Remove incompatible parameters
            if 'time_major' in kwargs:
                del kwargs['time_major']
            super().__init__(*args, **kwargs)
    
    # Load with custom objects
    model = tf.keras.models.load_model(
        "model.h5", 
        custom_objects={'LSTM': CompatibleLSTM}
    )

# Load tokenizer with error handling
try:
    tokenizer = joblib.load("tokenizer.pkl")
except Exception as e:
    print(f"Using compatibility mode to load tokenizer... Error: {e}")
    try:
        # Try to load with custom unpickler
        with open("tokenizer.pkl", 'rb') as f:
            tokenizer = CustomUnpickler(f).load()
    except Exception as e2:
        print(f"Failed to load tokenizer with custom unpickler: {e2}")
        # As a last resort, recreate a basic tokenizer
        from tensorflow.keras.preprocessing.text import Tokenizer
        print("Creating a new tokenizer. This may not match the original exactly.")
        tokenizer = Tokenizer(num_words=5000)

def clean_text(text):
    """Clean and preprocess text for word cloud"""
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text.lower())
    # Remove common English stopwords
    stopwords = {'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 
                'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
                'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
                'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
                'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
                'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
                'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's',
                't', 'can', 'will', 'just', 'don', 'should', 'now', 'movie', 'film', 'watch'}
    return ' '.join(word for word in text.split() if word not in stopwords)

def extract_key_phrases(text, sentiment):
    """Extract key phrases that contribute to sentiment"""
    cleaned_text = clean_text(text)
    words = cleaned_text.split()
    
    # Get word counts
    word_counts = Counter(words)
    
    # Positive and negative sentiment words
    positive_words = {'good', 'great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 
                     'awesome', 'fantastic', 'enjoyed', 'favorite', 'perfect', 'brilliant',
                     'superb', 'outstanding', 'masterpiece', 'beautiful', 'recommend'}
    
    negative_words = {'bad', 'worst', 'terrible', 'awful', 'boring', 'waste', 'poor', 
                     'disappointing', 'horrible', 'hate', 'stupid', 'ridiculous', 'worse',
                     'dull', 'mediocre', 'fails', 'avoid', 'mess', 'disaster'}
    
    neutral_words = {'okay', 'average', 'decent', 'fine', 'alright', 'fair', 'moderate',
                    'passable', 'acceptable', 'ordinary', 'standard', 'middle', 'mixed',
                    'balanced', 'neutral', 'so-so', 'neither', 'somewhat'}
    
    # Find matching sentiment words
    if sentiment == "positive":
        target_words = positive_words
    elif sentiment == "negative":
        target_words = negative_words
    else:  # neutral
        target_words = neutral_words
        
    found_words = [word for word in words if word in target_words]
    
    # Get most common words (excluding stopwords)
    common_words = [word for word, count in word_counts.most_common(10)]
    
    # Combine results
    key_phrases = list(set(found_words + common_words))[:5]
    
    if not key_phrases:
        return ["No specific key phrases identified."]
    
    return key_phrases

def analyze_sentiment_aspects(text, sentiment_score):
    """Analyze different aspects of sentiment in the text"""
    # Clean the text
    cleaned_text = clean_text(text)
    words = cleaned_text.split()
    
    # Define aspect categories and their associated words
    aspects = {
        'Emotional Impact': ['emotional', 'moving', 'touching', 'powerful', 'sad', 'happy', 'feel', 'felt', 'heart', 'tears'],
        'Acting Quality': ['acting', 'actor', 'actress', 'performance', 'cast', 'played', 'role', 'character'],
        'Plot & Story': ['plot', 'story', 'script', 'screenplay', 'narrative', 'twist', 'ending', 'predictable'],
        'Visual Appeal': ['visual', 'cinematography', 'beautiful', 'stunning', 'effects', 'cgi', 'scene', 'shot'],
        'Entertainment Value': ['entertaining', 'enjoyable', 'fun', 'boring', 'exciting', 'thrill', 'laugh', 'comedy']
    }
    
    # Calculate aspect scores
    aspect_scores = {}
    for aspect, aspect_words in aspects.items():
        # Count occurrences of aspect words
        aspect_word_count = sum(1 for word in words if word in aspect_words)
        
        # Base score on word presence and overall sentiment
        if aspect_word_count > 0:
            # Adjust score based on overall sentiment
            if sentiment_score > 0.5:  # Positive sentiment
                aspect_scores[aspect] = min(0.5 + aspect_word_count * 0.1, 1.0)
            else:  # Negative sentiment
                aspect_scores[aspect] = max(0.5 - aspect_word_count * 0.1, 0.0)
        else:
            # Default to neutral if no aspect words found
            aspect_scores[aspect] = 0.5
    
    return aspect_scores

def analyze_review(review):
    """Analyze sentiment of a movie review"""
    # Check if review is empty
    if not review or not review.strip():
        return {"error": "Please enter a review to analyze."}
    
    # Process the review
    sequences = tokenizer.texts_to_sequences([review])
    padded_sequence = pad_sequences(sequences, maxlen=200)
    prediction = model.predict(padded_sequence, verbose=0)
    confidence = float(prediction[0][0])
    
    # Updated sentiment classification to include neutral
    if confidence > 0.55:
        sentiment = "positive"
    elif confidence < 0.45:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    # Analyze sentiment aspects
    aspect_scores = analyze_sentiment_aspects(review, confidence)
    
    # Extract key phrases
    key_phrases = extract_key_phrases(review, sentiment)
    
    # Prepare response
    response = {
        "sentiment": sentiment,
        "confidence": confidence,
        "key_phrases": key_phrases,
        "aspect_scores": aspect_scores
    }
    
    return response

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    review = data.get('review', '')
    
    result = analyze_review(review)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)