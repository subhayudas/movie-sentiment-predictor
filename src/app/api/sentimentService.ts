import axios from 'axios';

// Define the response type from the sentiment analysis API
export interface SentimentResponse {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  key_phrases?: string[];
  aspect_analysis?: {
    [aspect: string]: {
      score: number;
      keywords: string[];
    };
  };
  error?: string;
}

// Define the review submission type
export interface ReviewSubmission {
  review: string;
  movieTitle?: string; // Optional movie title
}

// Define the review with results type for storing in history
export interface ReviewWithResults extends ReviewSubmission {
  sentiment: string;
  confidence: number;
  timestamp: Date;
  id: string;
}

// This URL should be updated to point to your actual sentiment analysis API
const API_URL = '/api/analyze-sentiment';

/**
 * Analyzes the sentiment of a movie review
 * @param reviewData The review data to analyze
 * @returns Promise with the sentiment analysis results
 */
export async function analyzeSentiment(reviewData: ReviewSubmission): Promise<SentimentResponse> {
  try {
    const response = await axios.post(API_URL, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw new Error('Failed to analyze sentiment. Please try again.');
  }
}

/**
 * Mock function to simulate API response for development
 * This can be used during development before connecting to the real API
 * @param reviewData The review data to analyze
 * @returns Promise with mock sentiment analysis results
 */
export async function mockAnalyzeSentiment(reviewData: ReviewSubmission): Promise<SentimentResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple sentiment analysis logic based on keywords
  const review = reviewData.review.toLowerCase();
  
  // Determine sentiment and confidence
  let sentiment: 'positive' | 'negative' | 'neutral';
  let confidence: number;
  
  if (review.includes('love') || review.includes('great') || review.includes('excellent') || review.includes('amazing')) {
    sentiment = 'positive';
    confidence = 0.85;
  } else if (review.includes('hate') || review.includes('terrible') || review.includes('awful') || review.includes('bad')) {
    sentiment = 'negative';
    confidence = 0.78;
  } else {
    sentiment = 'neutral';
    confidence = 0.65;
  }
  
  // Generate mock key phrases
  const keyPhrases: string[] = [];
  
  // Extract some words from the review as key phrases
  const words = review.split(/\s+/).filter(word => word.length > 3);
  const uniqueWords = [...new Set(words)];
  const selectedWords = uniqueWords.slice(0, Math.min(5, uniqueWords.length));
  
  if (selectedWords.length > 0) {
    keyPhrases.push(...selectedWords);
  } else {
    keyPhrases.push('No specific key phrases identified.');
  }
  
  // Generate mock aspect analysis
  const aspectAnalysis: {
    [aspect: string]: {
      score: number;
      keywords: string[];
    };
  } = {};
  
  // Check for aspects in the review
  if (review.includes('act') || review.includes('perform') || review.includes('character')) {
    aspectAnalysis['Acting Quality'] = {
      score: confidence,
      keywords: ['acting', 'performance', 'character'].filter(k => review.includes(k))
    };
  }
  
  if (review.includes('plot') || review.includes('story') || review.includes('script')) {
    aspectAnalysis['Plot & Story'] = {
      score: confidence,
      keywords: ['plot', 'story', 'script'].filter(k => review.includes(k))
    };
  }
  
  if (review.includes('visual') || review.includes('effect') || review.includes('scene')) {
    aspectAnalysis['Visual Elements'] = {
      score: confidence,
      keywords: ['visual', 'effects', 'scene'].filter(k => review.includes(k))
    };
  }
  
  // If no aspects were found, add a general one
  if (Object.keys(aspectAnalysis).length === 0) {
    aspectAnalysis['General'] = {
      score: confidence,
      keywords: []
    };
  }
  
  return { 
    sentiment, 
    confidence,
    key_phrases: keyPhrases,
    aspect_analysis: aspectAnalysis
  };
}

// Export a function that uses the mock or real API based on environment
export const submitReview = process.env.NODE_ENV === 'development' 
  ? mockAnalyzeSentiment 
  : analyzeSentiment;