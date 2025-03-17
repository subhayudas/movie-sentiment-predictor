import { NextRequest, NextResponse } from 'next/server';
import { mockAnalyzeSentiment, ReviewSubmission } from '../sentimentService';
import axios from 'axios';

// Flask API URL - update this to match your Flask server address
const FLASK_API_URL = 'http://localhost:5000/analyze';

/**
 * API route handler for sentiment analysis
 * This endpoint receives review data and returns sentiment analysis results
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const reviewData: ReviewSubmission = await request.json();
    
    // Validate the request data
    if (!reviewData.review || reviewData.review.trim() === '') {
      return NextResponse.json(
        { error: 'Review text is required' },
        { status: 400 }
      );
    }
    
    // Process the sentiment analysis
    // Try to use the Flask API first, fall back to mock if it fails
    try {
      // Call the Flask API
      const response = await axios.post(FLASK_API_URL, reviewData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000 // 5 second timeout
      });
      
      // Return the analysis results from Flask
      return NextResponse.json(response.data);
    } catch (apiError) {
      console.warn('Flask API error, falling back to mock:', apiError);
      // Fall back to mock function if Flask API is unavailable
      const result = await mockAnalyzeSentiment(reviewData);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error in sentiment analysis API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}