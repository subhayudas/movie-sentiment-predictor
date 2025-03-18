import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// This is a proxy API route for development
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // In development, proxy to local Flask server
    // In production, this route won't be used (direct API calls)
    const response = await axios.post('http://localhost:5000/analyze', data);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in sentiment analysis API route:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}