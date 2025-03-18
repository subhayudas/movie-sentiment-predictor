import os
# Set environment variables before any other imports
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow warnings
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'
os.environ['PYTHONUNBUFFERED'] = '1'
# Add TensorFlow memory optimization
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'  # Prevent TF from allocating all GPU memory
os.environ['TF_GPU_ALLOCATOR'] = 'cuda_malloc_async'  # Use async memory allocator

# Try importing numpy first with specific error handling
try:
    import numpy as np
    print(f"NumPy version: {np.__version__}")
except ImportError as e:
    print(f"Error importing NumPy: {e}")
    # Try to reinstall numpy at runtime if needed
    import sys
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--force-reinstall", "numpy==1.23.5"])
    import numpy as np
    print(f"Reinstalled NumPy version: {np.__version__}")

# Now import other dependencies with better error handling
try:
    import tensorflow as tf
    print(f"TensorFlow version: {tf.__version__}")
    
    # Configure TensorFlow to use less memory
    physical_devices = tf.config.list_physical_devices('GPU')
    if physical_devices:
        for device in physical_devices:
            tf.config.experimental.set_memory_growth(device, True)
    
    # Limit TensorFlow to use only necessary memory
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_virtual_device_configuration(
                    gpu,
                    [tf.config.experimental.VirtualDeviceConfiguration(memory_limit=1024)]
                )
        except RuntimeError as e:
            print(f"Virtual device configuration error: {e}")
    
    import joblib
    import pickle
    from tensorflow.keras.preprocessing.sequence import pad_sequences
    import re
    from collections import Counter
    import json
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    import gc  # For garbage collection
except ImportError as e:
    print(f"Error importing dependencies: {e}")
    raise

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
            # Add more comprehensive remapping for keras.src
            elif module.startswith('keras.src.'):
                # Replace keras.src with tensorflow.keras
                module = 'tensorflow.keras' + module[9:]
        
        return super().find_class(module, name)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure CORS for production and development
CORS(app, origins=[
    "https://movie-sentiment-predictor.vercel.app",
    "http://localhost:3000"
])

# Define paths to model and tokenizer files
MODEL_PATH = os.path.join(os.path.dirname(__file__), "python", "model.h5")
TOKENIZER_PATH = os.path.join(os.path.dirname(__file__), "python", "tokenizer.pkl")

# Global variables for model and tokenizer
model = None
tokenizer = None

# Lazy loading function for model - only load when needed
def get_model():
    global model
    if model is None:
        try:
            # First attempt: try loading with standard method
            model = tf.keras.models.load_model(MODEL_PATH)
            print("Model loaded successfully from", MODEL_PATH)
        except ValueError as e:
            # Second attempt: use custom object scope to ignore incompatible parameters
            print(f"Using compatibility mode to load model... Error: {e}")
            
            # Custom LSTM layer that ignores the time_major parameter
            class CompatibleLSTM(tf.keras.layers.LSTM):
                def __init__(self, *args, **kwargs):
                    # Remove incompatible parameters
                    if 'time_major' in kwargs:
                        del kwargs['time_major']
                    super().__init__(*args, **kwargs)
            
            # Load with custom objects
            model = tf.keras.models.load_model(
                MODEL_PATH, 
                custom_objects={'LSTM': CompatibleLSTM}
            )
            print("Model loaded with compatibility mode from", MODEL_PATH)
        except Exception as e:
            print(f"Failed to load model: {e}")
            return None
    return model

# Lazy loading function for tokenizer
def get_tokenizer():
    global tokenizer
    if tokenizer is None:
        try:
            tokenizer = joblib.load(TOKENIZER_PATH)
            print("Tokenizer loaded successfully from", TOKENIZER_PATH)
        except Exception as e:
            print(f"Using compatibility mode to load tokenizer... Error: {e}")
            try:
                # Try to load with custom unpickler
                with open(TOKENIZER_PATH, 'rb') as f:
                    tokenizer = CustomUnpickler(f).load()
                print("Tokenizer loaded with custom unpickler from", TOKENIZER_PATH)
            except Exception as e2:
                print(f"Failed to load tokenizer with custom unpickler: {e2}")
                # As a last resort, recreate a basic tokenizer
                try:
                    from tensorflow.keras.preprocessing.text import Tokenizer
                    print("Creating a new tokenizer. This may not match the original exactly.")
                    tokenizer = Tokenizer(num_words=5000)
                except Exception as e3:
                    print(f"Failed to create new tokenizer: {e3}")
                    return None
    return tokenizer

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
        'Plot & Story': ['plot', 'story', 'script', 'screenplay', 'narrative', 'writing', 'written', 'storyline'],
        'Visual Elements': ['visual', 'effects', 'cinematography', 'beautiful', 'stunning', 'cgi', 'scene', 'scenes'],
        'Direction': ['director', 'directed', 'direction', 'filmmaker', 'vision', 'pacing', 'editing']
    }
    
    # Calculate aspect scores
    aspect_scores = {}
    for aspect, keywords in aspects.items():
        # Count how many aspect keywords appear in the text
        matches = sum(1 for word in words if word in keywords)
        if matches > 0:
            # Adjust the aspect score based on the overall sentiment
            # This is a simple approach - could be more sophisticated
            aspect_scores[aspect] = {
                'score': sentiment_score,
                'keywords': [word for word in words if word in keywords][:3]  # Top 3 matching keywords
            }
    
    # If no aspects were found, return a default message
    if not aspect_scores:
        return {'General': {'score': sentiment_score, 'keywords': []}}
    
    return aspect_scores

# Define global constants
MAX_SEQUENCE_LENGTH = 200  # Adjust based on your model's requirements

# Add a lightweight fallback analyzer that doesn't use the full model
def lightweight_analyze(text):
    """A lightweight sentiment analysis that doesn't use the full model"""
    # Simple word-based sentiment analysis
    positive_words = {'good', 'great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 
                     'awesome', 'fantastic', 'enjoyed', 'favorite', 'perfect', 'brilliant',
                     'superb', 'outstanding', 'masterpiece', 'beautiful', 'recommend'}
    
    negative_words = {'bad', 'worst', 'terrible', 'awful', 'boring', 'waste', 'poor', 
                     'disappointing', 'horrible', 'hate', 'stupid', 'ridiculous', 'worse',
                     'dull', 'mediocre', 'fails', 'avoid', 'mess', 'disaster'}
    
    # Clean and tokenize text
    cleaned_text = clean_text(text)
    words = cleaned_text.split()
    
    # Count positive and negative words
    positive_count = sum(1 for word in words if word in positive_words)
    negative_count = sum(1 for word in words if word in negative_words)
    
    # Calculate sentiment score
    total_count = positive_count + negative_count
    if total_count == 0:
        sentiment_score = 0.5  # Neutral if no sentiment words found
    else:
        sentiment_score = positive_count / total_count
    
    # Determine sentiment label
    if sentiment_score > 0.66:
        sentiment = 'positive'
    elif sentiment_score < 0.33:
        sentiment = 'negative'
    else:
        sentiment = 'neutral'
    
    return {
        'sentiment': sentiment,
        'confidence': sentiment_score,
        'key_phrases': extract_key_phrases(text, sentiment),
        'aspect_analysis': analyze_sentiment_aspects(text, sentiment_score),
        'method': 'lightweight'
    }

# Add a parameter to the analyze route to allow fallback mode
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        # Get the review data from the request
        data = request.json
        review_text = data.get('review', '')
        movie_title = data.get('movieTitle', '')
        use_lightweight = data.get('lightweight', False)
        
        if not review_text:
            return jsonify({'error': 'Review text is required'}), 400
        
        # Use lightweight analysis if requested or if we're having memory issues
        if use_lightweight:
            return jsonify(lightweight_analyze(review_text))
        
        # Try to use the full model
        try:
            # Lazy load model and tokenizer only when needed
            model = get_model()
            tokenizer = get_tokenizer()
            
            if not model or not tokenizer:
                print("Model or tokenizer not available, falling back to lightweight analysis")
                return jsonify(lightweight_analyze(review_text))
            
            # Tokenize and pad the sequence
            sequences = tokenizer.texts_to_sequences([review_text])
            padded_sequences = pad_sequences(sequences, maxlen=MAX_SEQUENCE_LENGTH)
            
            # Make prediction with reduced verbosity
            prediction = model.predict(padded_sequences, verbose=0)[0]
            
            # Interpret the prediction
            sentiment_score = float(prediction[0])  # Assuming first output is sentiment score
            
            # Determine sentiment label
            if sentiment_score > 0.66:
                sentiment = 'positive'
            elif sentiment_score < 0.33:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
                
            # Extract key phrases
            key_phrases = extract_key_phrases(review_text, sentiment)
            
            # Analyze aspects
            aspect_analysis = analyze_sentiment_aspects(review_text, sentiment_score)
            
            # Return the results
            return jsonify({
                'sentiment': sentiment,
                'confidence': sentiment_score,
                'key_phrases': key_phrases,
                'aspect_analysis': aspect_analysis,
                'method': 'full_model'
            })
        
        except Exception as e:
            print(f"Error using full model, falling back to lightweight analysis: {e}")
            return jsonify(lightweight_analyze(review_text))
            
    except Exception as e:
        print(f"Error analyzing sentiment: {e}")
        # Fallback to a simpler analysis method if everything fails
        return jsonify({
            'sentiment': 'neutral',
            'confidence': 0.5,
            'key_phrases': ['Error in analysis'],
            'aspect_analysis': {},
            'error': str(e),
            'method': 'error_fallback'
        }), 500
    finally:
        # Force garbage collection to free memory
        gc.collect()

# Add a new endpoint for lightweight analysis only
@app.route('/analyze/lightweight', methods=['POST'])
def analyze_lightweight():
    try:
        data = request.json
        review_text = data.get('review', '')
        
        if not review_text:
            return jsonify({'error': 'Review text is required'}), 400
            
        return jsonify(lightweight_analyze(review_text))
    except Exception as e:
        print(f"Error in lightweight analysis: {e}")
        return jsonify({
            'sentiment': 'neutral',
            'confidence': 0.5,
            'key_phrases': ['Error in analysis'],
            'aspect_analysis': {},
            'error': str(e)
        }), 500

# Simple health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok', 
        'model_loaded': model is not None, 
        'tokenizer_loaded': tokenizer is not None,
        'memory_info': {
            'gc_count': gc.get_count(),
            'gc_threshold': gc.get_threshold()
        }
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)