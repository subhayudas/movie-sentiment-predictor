'use client';

import { useState } from 'react';
import { FaPlus, FaTrash, FaExchangeAlt } from 'react-icons/fa';
import { analyzeSentiment, ReviewSubmission } from '../api/sentimentService';

interface ComparisonItem {
  id: string;
  movieTitle: string;
  review: string;
  sentiment?: string;
  confidence?: number;
}

export default function ComparativeAnalysis() {
  const [items, setItems] = useState<ComparisonItem[]>([
    { id: '1', movieTitle: '', review: '' },
    { id: '2', movieTitle: '', review: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ComparisonItem[]>([]);

  const handleAddItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      movieTitle: '', 
      review: '' 
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 2) {
      setError('You need at least two items for comparison');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: 'movieTitle' | 'review', value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleCompare = async () => {
    // Validate inputs
    const emptyFields = items.some(item => !item.review.trim());
    if (emptyFields) {
      setError('All review fields are required');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults([]);

    try {
      const analysisPromises = items.map(async (item) => {
        const result = await analyzeSentiment({
          review: item.review,
          movieTitle: item.movieTitle
        });

        return {
          ...item,
          sentiment: result.sentiment,
          confidence: result.confidence
        };
      });

      const analysisResults = await Promise.all(analysisPromises);
      setResults(analysisResults);
    } catch (err) {
      setError('An error occurred during analysis. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return 'bg-gray-200';
    
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      case 'neutral': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-indigo-900/30 backdrop-blur-sm border border-indigo-500/20 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Comparative Analysis</h2>
      <p className="text-gray-300 mb-6">
        Compare sentiment across multiple reviews to identify patterns and differences.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/20 text-red-200 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-4 mb-6">
        {items.map((item, index) => (
          <div key={item.id} className="p-4 bg-indigo-900/50 rounded-lg border border-indigo-500/30">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-medium">Review {index + 1}</h3>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="text-indigo-300 hover:text-red-400 transition-colors"
                aria-label="Remove item"
              >
                <FaTrash />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <input
                  type="text"
                  value={item.movieTitle}
                  onChange={(e) => handleItemChange(item.id, 'movieTitle', e.target.value)}
                  placeholder="Movie title (optional)"
                  className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                />
              </div>
              <div className="md:col-span-3">
                <textarea
                  value={item.review}
                  onChange={(e) => handleItemChange(item.id, 'review', e.target.value)}
                  placeholder="Enter review text"
                  rows={2}
                  className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={handleAddItem}
          className="w-full py-2 border-2 border-dashed border-indigo-500/30 rounded-lg text-indigo-300 hover:bg-indigo-900/40 transition-colors flex items-center justify-center"
        >
          <FaPlus className="mr-2" />
          Add Another Review
        </button>
      </div>
      
      <button
        type="button"
        onClick={handleCompare}
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 flex items-center justify-center"
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </span>
        ) : (
          <span className="flex items-center">
            <FaExchangeAlt className="mr-2" />
            Compare Reviews
          </span>
        )}
      </button>
      
      {results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-white">Comparison Results</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-indigo-500/30">
                  <th className="px-4 py-2 text-indigo-300">Movie</th>
                  <th className="px-4 py-2 text-indigo-300">Sentiment</th>
                  <th className="px-4 py-2 text-indigo-300">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={result.id} className={index % 2 === 0 ? 'bg-indigo-900/20' : 'bg-indigo-900/10'}>
                    <td className="px-4 py-3 text-white">
                      {result.movieTitle || `Review ${index + 1}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${getSentimentColor(result.sentiment)}`}></span>
                        <span className="text-white">{result.sentiment}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">
                      {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Visual comparison */}
          <div className="mt-8 p-4 bg-indigo-900/30 rounded-lg">
            <h4 className="text-lg font-medium mb-4 text-white">Visual Comparison</h4>
            <div className="flex flex-col space-y-4">
              {results.map((result) => (
                <div key={result.id} className="flex flex-col">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-indigo-200">
                      {result.movieTitle || `Review ${results.indexOf(result) + 1}`}
                    </span>
                    <span className="text-sm text-indigo-200">
                      {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-indigo-900/50 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-4 rounded-full ${getSentimentColor(result.sentiment)}`}
                      style={{ width: `${result.confidence ? result.confidence * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-right mt-1 text-indigo-300">
                    {result.sentiment}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Summary */}
          <div className="mt-6 p-4 bg-indigo-900/30 rounded-lg">
            <h4 className="text-lg font-medium mb-2 text-white">Summary</h4>
            <p className="text-indigo-200">
              {(() => {
                const sentiments = results.map(r => r.sentiment?.toLowerCase());
                const positiveCount = sentiments.filter(s => s === 'positive').length;
                const negativeCount = sentiments.filter(s => s === 'negative').length;
                const neutralCount = sentiments.filter(s => s === 'neutral').length;
                
                if (positiveCount === results.length) {
                  return 'All reviews are positive.';
                } else if (negativeCount === results.length) {
                  return 'All reviews are negative.';
                } else if (neutralCount === results.length) {
                  return 'All reviews are neutral.';
                } else {
                  return `Mixed sentiment: ${positiveCount} positive, ${negativeCount} negative, and ${neutralCount} neutral reviews.`;
                }
              })()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}