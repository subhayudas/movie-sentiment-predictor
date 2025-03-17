'use client';

import { useState } from 'react';
import { ReviewSubmission } from '../api/sentimentService';

interface ReviewFormProps {
  onSubmit: (data: ReviewSubmission) => Promise<void>;
  isLoading: boolean;
}

export default function ReviewForm({ onSubmit, isLoading }: ReviewFormProps) {
  const [review, setReview] = useState('');
  const [movieTitle, setMovieTitle] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!review.trim()) {
      setError('Please enter a review');
      return;
    }
    
    try {
      await onSubmit({ review, movieTitle });
      // Don't clear the form here - we'll do it after successful analysis in the parent component
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Analyze Movie Review Sentiment</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="movieTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Movie Title (Optional)
          </label>
          <input
            type="text"
            id="movieTitle"
            value={movieTitle}
            onChange={(e) => setMovieTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter movie title"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="review" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Review *
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={5}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter your movie review here..."
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
      </form>
    </div>
  );
}