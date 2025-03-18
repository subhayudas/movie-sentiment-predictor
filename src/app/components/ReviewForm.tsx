'use client';

import { useState, useEffect, useRef } from 'react';
import { ReviewSubmission } from '../api/sentimentService';
import { FaSpinner, FaEraser, FaPaperPlane } from 'react-icons/fa';

interface ReviewFormProps {
  onSubmit: (data: ReviewSubmission) => Promise<void>;
  isLoading: boolean;
}

export default function ReviewForm({ onSubmit, isLoading }: ReviewFormProps) {
  const [review, setReview] = useState('');
  const [movieTitle, setMovieTitle] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form when submission is successful
  useEffect(() => {
    if (submitted && !isLoading) {
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
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error(err);
      setSubmitted(false);
    }
  };

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setReview(value);
    setCharCount(value.length);
  };

  const clearForm = () => {
    setReview('');
    setMovieTitle('');
    setError('');
    setCharCount(0);
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  // Determine character count color
  const getCharCountColor = () => {
    if (charCount === 0) return 'text-white/50';
    if (charCount < 20) return 'text-red-400';
    if (charCount < 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="w-full bg-indigo-900/30 backdrop-blur-sm border border-indigo-500/20 rounded-lg shadow-md p-6">
      <form id="review-form" ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/20 text-red-200 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        <div>
          <label htmlFor="movieTitle" className="block text-sm font-medium text-white/90 mb-1">
            Movie Title (optional)
          </label>
          <input
            type="text"
            id="movieTitle"
            name="movieTitle"
            value={movieTitle}
            onChange={(e) => setMovieTitle(e.target.value)}
            placeholder="Enter movie title"
            className="w-full px-4 py-2 bg-indigo-950/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-white placeholder-white/40 transition-all"
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="review" className="block text-sm font-medium text-white/90">
              Review Text
            </label>
            <span className={`text-xs ${getCharCountColor()}`}>
              {charCount} characters
              {charCount > 0 && (
                charCount < 20 
                  ? ' (too short)' 
                  : charCount < 50 
                    ? ' (could be longer)' 
                    : ' (good length)'
              )}
            </span>
          </div>
          <textarea
            id="review"
            name="review"
            value={review}
            onChange={handleReviewChange}
            placeholder="Enter your movie review here..."
            rows={5}
            className="w-full px-4 py-2 bg-indigo-950/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-white placeholder-white/40 transition-all"
            required
          />
        </div>
        
        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={clearForm}
            className="px-4 py-2 bg-indigo-900/50 hover:bg-indigo-800/50 text-white/80 hover:text-white rounded-lg transition-colors flex items-center"
            disabled={isLoading}
          >
            <FaEraser className="mr-2" />
            Clear
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <FaPaperPlane className="mr-2" />
                Analyze Sentiment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}