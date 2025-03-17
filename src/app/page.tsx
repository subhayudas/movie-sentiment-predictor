'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import ReviewForm from './components/ReviewForm';
import SentimentResult from './components/SentimentResult';
import SentimentChart from './components/SentimentChart';
import { analyzeSentiment, ReviewSubmission, SentimentResponse, ReviewWithResults } from './api/sentimentService';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SentimentResponse | null>(null);
  const [currentMovieTitle, setCurrentMovieTitle] = useState<string>('');
  const [reviewHistory, setReviewHistory] = useState<ReviewWithResults[]>([]);
  
  // Load review history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('reviewHistory');
    if (savedHistory) {
      try {
        // Parse the saved history and convert string dates back to Date objects
        const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setReviewHistory(parsedHistory);
      } catch (error) {
        console.error('Error loading review history:', error);
      }
    }
  }, []);

  // Save review history to localStorage whenever it changes
  useEffect(() => {
    if (reviewHistory.length > 0) {
      localStorage.setItem('reviewHistory', JSON.stringify(reviewHistory));
    }
  }, [reviewHistory]);

  const handleSubmitReview = async (data: ReviewSubmission) => {
    setIsLoading(true);
    setResult(null);
    setCurrentMovieTitle(data.movieTitle || '');
    
    try {
      // Call the sentiment analysis API
      const sentimentResult = await analyzeSentiment(data);
      setResult(sentimentResult);
      
      // Add the result to history
      const reviewWithResult: ReviewWithResults = {
        ...data,
        sentiment: sentimentResult.sentiment,
        confidence: sentimentResult.confidence,
        timestamp: new Date(),
        id: uuidv4()
      };
      
      setReviewHistory(prev => [reviewWithResult, ...prev]);
      
      // Clear the form after successful submission
      // This is handled in the parent component to ensure proper state management
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <header className="mb-12 text-center">
        <div className="flex justify-center mb-4">
          <Image 
            src="/next.svg" 
            alt="Movie Sentiment Analysis" 
            width={180} 
            height={37} 
            className="dark:invert"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Movie Sentiment Analysis
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Analyze the sentiment of movie reviews using AI
        </p>
      </header>

      <main className="max-w-7xl mx-auto space-y-12">
        <section>
          <ReviewForm onSubmit={handleSubmitReview} isLoading={isLoading} />
        </section>

        {result && (
          <section>
            <SentimentResult result={result} movieTitle={currentMovieTitle} />
          </section>
        )}

        <section>
          <SentimentChart reviewHistory={reviewHistory} />
        </section>
      </main>

      <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} Movie Sentiment Analysis. All rights reserved.</p>
      </footer>
    </div>
  );
}
