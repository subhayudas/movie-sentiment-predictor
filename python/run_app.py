import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow warnings

import tensorflow as tf
import joblib
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences
import gradio as gr
import sys
import matplotlib.pyplot as plt
import numpy as np
from wordcloud import WordCloud
import re
from collections import Counter
import time

import matplotlib.cm as cm
from matplotlib.patches import Circle, Wedge, Rectangle

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

# Store analysis history
analysis_history = []

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

def generate_wordcloud(text):
    """Generate word cloud from text"""
    cleaned_text = clean_text(text)
    if not cleaned_text.strip():
        # If text is empty after cleaning, return a simple message
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.text(0.5, 0.5, "Not enough meaningful words to generate a word cloud", 
                ha='center', va='center', fontsize=12)
        ax.axis('off')
        return fig
    
    # Generate word cloud
    wordcloud = WordCloud(width=800, height=400, 
                         background_color='white', 
                         max_words=100,
                         colormap='viridis',
                         contour_width=1, 
                         contour_color='steelblue').generate(cleaned_text)
    
    # Display the word cloud
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.imshow(wordcloud, interpolation='bilinear')
    ax.axis('off')
    ax.set_title('Key Words in Review')
    return fig

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
        return "No specific key phrases identified."
    
    return ", ".join(key_phrases)

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

def create_radar_chart(aspect_scores):
    """Create a radar chart for sentiment aspects"""
    # Prepare data
    categories = list(aspect_scores.keys())
    values = list(aspect_scores.values())
    
    # Number of variables
    N = len(categories)
    
    # Create angles for each category
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += angles[:1]  # Close the loop
    
    # Add the values for the last point to close the loop
    values += values[:1]
    
    # Create figure
    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
    
    # Draw the chart
    ax.plot(angles, values, linewidth=2, linestyle='solid', color='#1967D2')
    ax.fill(angles, values, color='#1967D2', alpha=0.4)
    
    # Add category labels
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, size=12)
    
    # Add value labels at each point
    for angle, value, category in zip(angles[:-1], values[:-1], categories):
        ax.text(angle, value + 0.1, f"{value:.2f}", 
                horizontalalignment='center', size=10, 
                bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.8))
    
    # Set y-axis limits
    ax.set_ylim(0, 1)
    ax.set_yticks([0.2, 0.4, 0.6, 0.8, 1.0])
    ax.set_yticklabels(['0.2', '0.4', '0.6', '0.8', '1.0'], color="grey", size=10)
    
    # Add title
    plt.title('Sentiment Analysis by Aspect', size=15, y=1.1)
    
    return fig

def create_gauge_chart(sentiment_score):
    """Create a gauge chart for sentiment score"""
    fig, ax = plt.subplots(figsize=(8, 4), subplot_kw=dict(polar=False))
    
    # Hide axis
    ax.set_axis_off()
    
    # Define gauge properties
    gauge_height = 0.35
    gauge_width = 0.8
    center_x = 0.5
    center_y = 0.5
    
    # Create background arc (gray)
    background = Wedge((center_x, center_y), gauge_width, 180, 0, width=gauge_height, 
                      facecolor='#EEEEEE', edgecolor='gray', linewidth=1)
    ax.add_patch(background)
    
    # Create colored arc based on sentiment score
    angle = 180 - 180 * sentiment_score
    
    # Define color gradient based on sentiment score
    if sentiment_score < 0.45:
        color = '#FF6B6B'  # Red for negative
        sentiment_label = "NEGATIVE"
    elif sentiment_score < 0.55:
        color = '#FFCC00'  # Yellow for neutral
        sentiment_label = "NEUTRAL"
    else:
        color = '#4CAF50'  # Green for positive
        sentiment_label = "POSITIVE"
    
    # Create foreground arc (colored)
    foreground = Wedge((center_x, center_y), gauge_width, 180, angle, width=gauge_height, 
                      facecolor=color, edgecolor='gray', linewidth=1)
    ax.add_patch(foreground)
    
    # Add score text
    ax.text(center_x, center_y - 0.15, f"{sentiment_score:.2f}", 
            ha='center', va='center', fontsize=24, fontweight='bold', color=color)
    
    # Add sentiment label
    ax.text(center_x, center_y + 0.15, sentiment_label, 
            ha='center', va='center', fontsize=18, fontweight='bold', color=color)
    
    # Add gauge labels
    ax.text(center_x - gauge_width - 0.05, center_y, "0.0", 
            ha='right', va='center', fontsize=12, color='gray')
    ax.text(center_x, center_y - gauge_width - 0.05, "0.5", 
            ha='center', va='top', fontsize=12, color='gray')
    ax.text(center_x + gauge_width + 0.05, center_y, "1.0", 
            ha='left', va='center', fontsize=12, color='gray')
    
    # Add title
    ax.text(center_x, center_y - gauge_width - 0.2, "Sentiment Confidence", 
            ha='center', va='center', fontsize=14, fontweight='bold')
    
    # Set limits
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    
    return fig

def generate_enhanced_wordcloud(text, sentiment):
    """Generate an enhanced word cloud from text"""
    cleaned_text = clean_text(text)
    if not cleaned_text.strip():
        # If text is empty after cleaning, return a simple message
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.text(0.5, 0.5, "Not enough meaningful words to generate a word cloud", 
                ha='center', va='center', fontsize=12)
        ax.axis('off')
        return fig
    
    # Define color map based on sentiment
    if sentiment == "positive":
        colormap = cm.get_cmap('YlGn')  # Yellow-Green for positive
        background_color = '#F0FFF0'  # Light green background
    else:
        colormap = cm.get_cmap('OrRd')  # Orange-Red for negative
        background_color = '#FFF0F0'  # Light red background
    
    # Generate word cloud with custom settings
    wordcloud = WordCloud(
        width=800, 
        height=400,
        background_color=background_color,
        max_words=100,
        colormap=colormap,
        contour_width=1,
        contour_color='steelblue',
        prefer_horizontal=0.9,
        relative_scaling=0.7,
        min_font_size=10,
        max_font_size=80,
        random_state=42
    ).generate(cleaned_text)
    
    # Display the word cloud
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.imshow(wordcloud, interpolation='bilinear')
    ax.axis('off')
    
    # Add a title with sentiment information
    title = f"Key Words in {'Positive' if sentiment == 'positive' else 'Negative'} Review"
    ax.set_title(title, fontsize=16, pad=20)
    
    # Add a subtle border
    for spine in ax.spines.values():
        spine.set_visible(True)
        spine.set_color('lightgray')
    
    return fig

def create_word_frequency_chart(text, sentiment):
    """Create a bar chart of most frequent positive and negative words"""
    cleaned_text = clean_text(text)
    words = cleaned_text.split()
    
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
    
    # Count word frequencies
    word_counts = Counter(words)
    
    # Get positive, negative, and neutral word counts
    pos_word_counts = {word: count for word, count in word_counts.items() if word in positive_words}
    neg_word_counts = {word: count for word, count in word_counts.items() if word in negative_words}
    neu_word_counts = {word: count for word, count in word_counts.items() if word in neutral_words}
    
    # Sort by frequency
    pos_words = sorted(pos_word_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    neg_words = sorted(neg_word_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    neu_words = sorted(neu_word_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    
    # If no words found, add placeholder
    if not pos_words:
        pos_words = [("(none found)", 0)]
    if not neg_words:
        neg_words = [("(none found)", 0)]
    if not neu_words:
        neu_words = [("(none found)", 0)]
    
    # Create figure
    fig, ax = plt.subplots(figsize=(10, 8))
    
    # Plot positive words
    pos_labels = [word for word, _ in pos_words]
    pos_values = [count for _, count in pos_words]
    pos_bars = ax.barh([f"+ {label}" for label in pos_labels], pos_values, color='#4CAF50', alpha=0.7, height=0.4)
    
    # Plot neutral words
    neu_labels = [word for word, _ in neu_words]
    neu_values = [count for _, count in neu_words]
    neu_bars = ax.barh([f"= {label}" for label in neu_labels], neu_values, color='#FFCC00', alpha=0.7, height=0.4)
    
    # Plot negative words
    neg_labels = [word for word, _ in neg_words]
    neg_values = [count for _, count in neg_words]
    neg_bars = ax.barh([f"- {label}" for label in neg_labels], neg_values, color='#FF6B6B', alpha=0.7, height=0.4)
    
    # Add count labels
    for bars in [pos_bars, neu_bars, neg_bars]:
        for bar in bars:
            width = bar.get_width()
            if width > 0:
                ax.text(width + 0.1, bar.get_y() + bar.get_height()/2, f"{int(width)}", 
                        va='center', fontsize=10)
    
    # Set title and labels
    ax.set_title('Frequency of Sentiment Words', fontsize=14)
    ax.set_xlabel('Count', fontsize=12)
    
    # Adjust layout
    plt.tight_layout()
    
    return fig

def predictive_system(review):
    """Analyze sentiment of a movie review"""
    global analysis_history
    
    # Check if review is empty
    if not review or not review.strip():
        return "Please enter a review to analyze.", None, None, None, None, None, "No review provided.", []
    
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
    
    # Create radar chart for sentiment aspects
    radar_fig = create_radar_chart(aspect_scores)
    
    # Create gauge chart for sentiment confidence
    gauge_fig = create_gauge_chart(confidence)
    
    # Generate enhanced word cloud
    wordcloud_fig = generate_enhanced_wordcloud(review, sentiment)
    
    # Create word frequency chart
    word_freq_fig = create_word_frequency_chart(review, sentiment)
    
    # Extract key phrases
    key_phrases = extract_key_phrases(review, sentiment)
    
    # Add to history (limit to last 5 entries)
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    short_review = review[:50] + "..." if len(review) > 50 else review
    history_entry = f"[{timestamp}] {short_review} → {sentiment.upper()} ({confidence:.2f})"
    analysis_history.insert(0, history_entry)
    analysis_history = analysis_history[:5]  # Keep only the last 5 entries
    
    # Detailed analysis text
    detailed_analysis = f"""
## Sentiment Analysis Results

**Overall Sentiment:** {sentiment.upper()}

**Confidence Score:** {confidence:.2f}

**Key Phrases:** {key_phrases}

**Aspect Analysis:**
- Emotional Impact: {aspect_scores['Emotional Impact']:.2f}
- Acting Quality: {aspect_scores['Acting Quality']:.2f}
- Plot & Story: {aspect_scores['Plot & Story']:.2f}
- Visual Appeal: {aspect_scores['Visual Appeal']:.2f}
- Entertainment Value: {aspect_scores['Entertainment Value']:.2f}

**Analysis Summary:** 
This review expresses a {sentiment} sentiment toward the movie with {confidence:.2f} confidence.
"""
    
    return sentiment, gauge_fig, radar_fig, wordcloud_fig, word_freq_fig, detailed_analysis, analysis_history

# Create custom CSS for better styling
css = """
.gradio-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.sentiment-positive {
    color: #4CAF50;
    font-weight: bold;
}
.sentiment-negative {
    color: #FF6B6B;
    font-weight: bold;
}
.history-block {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 10px;
    background-color: #f9f9f9;
}
"""

# Create Gradio interface
with gr.Blocks(css=css, theme=gr.themes.Soft()) as app:
    gr.Markdown("# 🎬 IMDB Movie Review Sentiment Analysis")
    gr.Markdown("Enter a movie review to analyze its sentiment. The model will determine if the review is positive or negative.")
    
    with gr.Row():
        with gr.Column(scale=2):
            review_input = gr.Textbox(
                label="Movie Review",
                placeholder="Type or paste a movie review here...",
                lines=5
            )
            
            with gr.Row():
                submit_btn = gr.Button("Analyze Sentiment", variant="primary")
                clear_btn = gr.Button("Clear", variant="secondary")
            
            gr.Markdown("### Try these examples:")
            with gr.Row():
                example1_btn = gr.Button("Positive Example")
                example2_btn = gr.Button("Negative Example")
                example3_btn = gr.Button("Mixed Example")
        
        with gr.Column(scale=3):
            sentiment_output = gr.Textbox(label="Sentiment")
            
            with gr.Tabs():
                with gr.TabItem("Gauge Meter"):
                    gauge_plot = gr.Plot(label="Sentiment Gauge")
                
                with gr.TabItem("Aspect Analysis"):
                    radar_plot = gr.Plot(label="Sentiment Aspects")
                
                with gr.TabItem("Word Cloud"):
                    wordcloud_plot = gr.Plot(label="Word Cloud")
                
                with gr.TabItem("Word Frequency"):
                    word_freq_plot = gr.Plot(label="Sentiment Word Frequency")
                
                with gr.TabItem("Detailed Analysis"):
                    detailed_output = gr.Markdown()
                
                with gr.TabItem("Analysis History"):
                    history_output = gr.Dataframe(
                        headers=["Previous Analyses"],
                        datatype=["str"],
                        col_count=(1, "fixed"),
                        label="Recent Analyses"
                    )
    
    # Set up event handlers
    submit_btn.click(
        predictive_system,
        inputs=review_input,
        outputs=[sentiment_output, gauge_plot, radar_plot, wordcloud_plot, word_freq_plot, detailed_output, history_output]
    )
    
    clear_btn.click(
        lambda: ("", None, None, None, None, "", []),
        inputs=None,
        outputs=[review_input, gauge_plot, radar_plot, wordcloud_plot, word_freq_plot, detailed_output, history_output]
    )
    
    # Example reviews
    positive_example = "I absolutely loved this movie! The acting was superb and the plot kept me engaged throughout. The cinematography was breathtaking and the musical score perfectly complemented the emotional scenes. Definitely one of the best films I've seen this year, and I would highly recommend it to anyone who appreciates thoughtful storytelling."
    
    negative_example = "This movie was a complete waste of time and money. The plot made no sense, the characters were poorly developed, and the acting was terrible. The special effects looked cheap and the dialogue was cringe-worthy. I found myself checking my watch repeatedly, waiting for it to end. Save yourself the disappointment and skip this one."
    
    mixed_example = "The movie had some good moments and the lead actor gave a decent performance, but overall it fell short of my expectations. The first half was engaging but the story lost its way in the second half. Some scenes were beautifully shot, while others felt rushed. It's not terrible, but I wouldn't go out of my way to recommend it."
    
    example1_btn.click(lambda: positive_example, outputs=review_input)
    example2_btn.click(lambda: negative_example, outputs=review_input)
    example3_btn.click(lambda: mixed_example, outputs=review_input)

# Launch the app
app.launch()