'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaFileUpload, FaSpinner } from 'react-icons/fa';
import { analyzeSentiment } from '../api/sentimentService';

interface BatchAnalysisProps {
  onBatchComplete: (results: BatchResult[]) => void;
}

export interface BatchResult {
  id: string;
  movieTitle: string;
  review: string;
  sentiment: string;
  confidence: number;
  timestamp: Date;
}

export default function BatchAnalysis({ onBatchComplete }: BatchAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const processCSV = async (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    
    // Find the indices of the review and movie title columns
    const reviewIndex = headers.findIndex(h => 
      h.toLowerCase().includes('review') || h.toLowerCase().includes('text'));
    const titleIndex = headers.findIndex(h => 
      h.toLowerCase().includes('title') || h.toLowerCase().includes('movie'));
    
    if (reviewIndex === -1) {
      throw new Error('Could not find a review column in the CSV file');
    }
    
    // Process each line (skip header)
    const results: BatchResult[] = [];
    const dataLines = lines.slice(1).filter(line => line.trim() !== '');
    
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const values = line.split(',');
      
      if (values.length <= reviewIndex) continue;
      
      const review = values[reviewIndex].trim();
      const movieTitle = titleIndex !== -1 && values.length > titleIndex 
        ? values[titleIndex].trim() 
        : `Review #${i+1}`;
      
      if (review) {
        try {
          // Update progress
          setProgress(Math.round((i / dataLines.length) * 100));
          
          // Call API for sentiment analysis
          const result = await analyzeSentiment({ 
            review, 
            movieTitle 
          });
          
          results.push({
            id: uuidv4(),
            movieTitle,
            review,
            sentiment: result.sentiment,
            confidence: result.confidence,
            timestamp: new Date()
          });
        } catch (error) {
          console.error(`Error analyzing review: ${review}`, error);
        }
      }
    }
    
    return results;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a CSV file');
      return;
    }
    
    setIsLoading(true);
    setProgress(0);
    
    try {
      const text = await file.text();
      const results = await processCSV(text);
      
      if (results.length === 0) {
        setError('No valid reviews found in the file');
      } else {
        onBatchComplete(results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred processing the file');
      console.error(err);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-indigo-900/30 backdrop-blur-sm border border-indigo-500/20 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Batch Analysis</h2>
      <p className="text-gray-300 mb-6">
        Upload a CSV file with movie reviews to analyze multiple reviews at once.
        The file should include columns for reviews and optionally movie titles.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/20 text-red-200 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="flex flex-col items-center px-4 py-6 bg-indigo-900/50 text-indigo-300 rounded-lg border-2 border-dashed border-indigo-500/30 cursor-pointer hover:bg-indigo-900/60 transition-colors">
            <FaFileUpload className="text-3xl mb-2" />
            <span className="text-sm font-medium mb-1">
              {file ? file.name : 'Select a CSV file'}
            </span>
            <span className="text-xs text-indigo-400">
              CSV format with review text column
            </span>
            <input 
              type="file" 
              className="hidden" 
              accept=".csv" 
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
        </div>
        
        {isLoading && (
          <div className="mb-4">
            <div className="w-full bg-indigo-900/50 rounded-full h-2.5">
              <div 
                className="h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-indigo-300 mt-2">
              Processing... {progress}%
            </p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || !file}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Processing Batch
            </>
          ) : (
            'Analyze Batch'
          )}
        </button>
      </form>
    </div>
  );
}