import axios from 'axios';

// Define the response interface
export interface SentimentResponse {
  sentiment: string;
  confidence: number;
  key_phrases?: string[];
  aspect_analysis?: Record<string, {
    score: number;
    keywords: string[];
  }>;
  method?: string;
  error?: string;
}

// Define the request interface
export interface SentimentRequest {
  review: string;
  movieTitle?: string;
  lightweight?: boolean;
}

// Get API URLs from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const FALLBACK_API_URL = process.env.NEXT_PUBLIC_API_FALLBACK_URL || '';

/**
 * Analyzes sentiment of a review with automatic fallback
 */
export async function analyzeSentiment(data: SentimentRequest): Promise<SentimentResponse> {
  // Try the main API endpoint first
  try {
    console.log('Attempting to use primary API endpoint...');
    const response = await axios.post(API_URL, data, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000 // 15 second timeout
    });
    
    console.log('Primary API response received');
    return response.data;
  } catch (error) {
    console.error('Primary API failed:', error);
    
    // If main API fails and fallback URL is available, try the fallback
    if (FALLBACK_API_URL && FALLBACK_API_URL !== API_URL) {
      console.log('Attempting to use fallback API endpoint...');
      try {
        const fallbackResponse = await axios.post(FALLBACK_API_URL, data, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 // 10 second timeout for fallback
        });
        
        console.log('Fallback API response received');
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        throw new Error('Both primary and fallback API endpoints failed');
      }
    }
    
    // If no fallback URL or fallback failed, rethrow the original error
    throw error;
  }
}

/**
 * Directly uses the lightweight analysis endpoint
 */
export async function analyzeSentimentLightweight(data: SentimentRequest): Promise<SentimentResponse> {
  if (!FALLBACK_API_URL) {
    throw new Error('Fallback API URL not configured');
  }
  
  const response = await axios.post(FALLBACK_API_URL, {
    ...data,
    lightweight: true
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  return response.data;
}