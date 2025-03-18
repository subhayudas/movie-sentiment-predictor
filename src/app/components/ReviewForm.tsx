'use client';

import { useState, useEffect } from 'react';
import { ReviewSubmission } from '../api/sentimentService';

interface ReviewFormProps {
  onSubmit: (data: ReviewSubmission) => Promise<void>;
  isLoading: boolean;
}

export default function ReviewForm({ onSubmit, isLoading }: ReviewFormProps) {
  const [review, setReview] = useState('');
  const [movieTitle, setMovieTitle] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Reset form when submission is successful
  useEffect(() => {
    if (submitted && !isLoading) {
      setReview('');
      setMovieTitle('');
      setSubmitted(false);
    }
  }, [isLoading, submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!review.trim()) {
      setError('Please enter a review');
      return;
    }
    
    try {
      setSubmitted(true);
      await onSubmit({ review, movieTitle });
      // Form will be cleared in the useEffect when isLoading becomes false
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error(err);
      setSubmitted(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-indigo-900/30 backdrop-blur-sm border border-indigo-500/20 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Analyze Movie Review Sentiment</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/20 text-red-200 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="movieTitle" className="block text-sm font-medium text-gray-300 mb-1">
            Movie Title (Optional)
          </label>
          <input
            type="text"
            id="movieTitle"
            value={movieTitle}
            onChange={(e) => setMovieTitle(e.target.value)}
            className="w-full px-4 py-2 bg-indigo-900/50 border border-indigo-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
            placeholder="Enter movie title"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="review" className="block text-sm font-medium text-gray-300 mb-1">
            Your Review *
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={5}
            className="w-full px-4 py-2 bg-indigo-900/50 border border-indigo-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
            placeholder="Enter your movie review here..."
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
      </form>
    </div>
  );
}