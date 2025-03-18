// This file contains the API service for sentiment analysis

import axios from 'axios';

export interface ReviewSubmission {
  review: string;
  movieTitle?: string;
}

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

// Add the ReviewWithResults interface export
export interface ReviewWithResults {
  id: string;
  review?: string;
  movieTitle?: string;
  sentiment: string;
  confidence: number;
  timestamp: Date;
}

// Determine the API URL based on environment
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://imdb-sentiment-api.onrender.com/analyze' // Replace with your actual production API URL
  : '/api/analyze-sentiment';

/**
 * Analyzes the sentiment of a movie review
 * @param data The review submission data
 * @returns Promise with sentiment analysis results
 */
export async function analyzeSentiment(data: ReviewSubmission): Promise<SentimentResponse> {
  try {
    // Set a timeout to prevent hanging if API is unreachable
    const response = await axios.post(API_URL, data, { 
      timeout: 5000 // 5 second timeout
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    
    // Fall back to mock data if the API is not available (in any environment)
    console.warn('API unavailable. Using mock data for sentiment analysis');
    return mockAnalyzeSentiment(data);
  }
}

// Mock implementation for when API is unavailable
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

// Add this interface to your existing interfaces
export interface AggregatedRating {
  id: string;
  movieTitle: string;
  aggregateScore: number;
  reviewCount: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  timestamp: Date;
}

// Add this function to store ratings
// Replace line 160 with a more specific type
export function saveAggregatedRating(data: {
  movieTitle: string;
  aggregateScore: number;
  reviews: ReviewWithResults[];  // Changed from any[] to ReviewWithResults[]
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}): AggregatedRating {
  // Create a new rating object
  const newRating: AggregatedRating = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    movieTitle: data.movieTitle,
    aggregateScore: data.aggregateScore,
    reviewCount: data.reviews.length,
    sentimentDistribution: data.sentimentDistribution,
    timestamp: new Date()
  };
  
  // In a real app, you would save this to a database or API
  // For now, we'll just store it in localStorage
  try {
    const existingRatings = localStorage.getItem('aggregatedRatings');
    const ratings = existingRatings ? JSON.parse(existingRatings) : [];
    ratings.push(newRating);
    localStorage.setItem('aggregatedRatings', JSON.stringify(ratings));
  } catch (error) {
    console.error('Error saving rating to localStorage:', error);
  }
  
  return newRating;
}

// Add this function to retrieve ratings
export function getAggregatedRatings(): AggregatedRating[] {
  try {
    const existingRatings = localStorage.getItem('aggregatedRatings');
    return existingRatings ? JSON.parse(existingRatings) : [];
  } catch (error) {
    console.error('Error retrieving ratings from localStorage:', error);
    return [];
  }
}

// Get a specific rating by ID
export function getAggregatedRatingById(id: string): AggregatedRating | null {
  try {
    const ratings = getAggregatedRatings();
    return ratings.find(rating => rating.id === id) || null;
  } catch (error) {
    console.error('Error retrieving rating by ID:', error);
    return null;
  }
}

// Delete a rating by ID
export function deleteAggregatedRating(id: string): boolean {
  try {
    const ratings = getAggregatedRatings();
    const filteredRatings = ratings.filter(rating => rating.id !== id);
    
    if (filteredRatings.length === ratings.length) {
      return false; // No rating was removed
    }
    
    localStorage.setItem('aggregatedRatings', JSON.stringify(filteredRatings));
    return true;
  } catch (error) {
    console.error('Error deleting rating:', error);
    return false;
  }
}