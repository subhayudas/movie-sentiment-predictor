'use client';

import { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt, FaTrash, FaChartPie } from 'react-icons/fa';
import { getAggregatedRatings, deleteAggregatedRating, AggregatedRating } from '../api/sentimentService';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function SavedRatings() {
  const [ratings, setRatings] = useState<AggregatedRating[]>([]);
  const [selectedRating, setSelectedRating] = useState<AggregatedRating | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Load ratings from localStorage
    const loadRatings = () => {
      const savedRatings = getAggregatedRatings();
      setRatings(savedRatings);
    };

    loadRatings();
    
    // Set up event listener for storage changes
    const handleStorageChange = () => {
      loadRatings();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this rating?')) {
      const success = deleteAggregatedRating(id);
      if (success) {
        setRatings(ratings.filter(rating => rating.id !== id));
        if (selectedRating?.id === id) {
          setSelectedRating(null);
          setShowModal(false);
        }
      }
    }
  };

  const handleViewDetails = (rating: AggregatedRating) => {
    setSelectedRating(rating);
    setShowModal(true);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = (rating % 2) >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-400" />);
      }
    }
    
    return stars;
  };

  const formatDate = (date: Date) => {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Prepare chart data for the selected rating
  const getPieData = (rating: AggregatedRating) => {
    return {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [
        {
          data: [
            rating.sentimentDistribution.positive,
            rating.sentimentDistribution.negative,
            rating.sentimentDistribution.neutral
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)', // Green for positive
            'rgba(239, 68, 68, 0.8)', // Red for negative
            'rgba(99, 102, 241, 0.8)', // Indigo for neutral
          ],
          borderColor: ['#22c55e', '#ef4444', '#6366f1'],
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm border border-indigo-500/30 rounded-lg shadow-xl p-6 mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">Saved Movie Ratings</h2>
      
      {ratings.length === 0 ? (
        <div className="text-center py-8 text-indigo-300">
          <p>No saved ratings yet. Use the Movie Rating Aggregator to create ratings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ratings.map(rating => (
            <div 
              key={rating.id}
              onClick={() => handleViewDetails(rating)}
              className="bg-indigo-900/40 border border-indigo-500/30 rounded-lg p-4 cursor-pointer hover:bg-indigo-800/40 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-white text-lg mb-1">{rating.movieTitle}</h3>
                  <div className="flex items-center mb-2">
                    <div className="flex mr-2">
                      {renderStars(rating.aggregateScore)}
                    </div>
                    <span className="text-lg font-bold text-white">
                      {rating.aggregateScore.toFixed(1)}
                    </span>
                    <span className="text-indigo-300 ml-1">/10</span>
                  </div>
                  <div className="text-xs text-indigo-300">
                    <span>{rating.reviewCount} reviews</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(rating.timestamp)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(rating.id, e)}
                  className="text-indigo-300 hover:text-red-400 transition-colors p-1"
                >
                  <FaTrash />
                </button>
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <div className="text-xs text-indigo-300">
                  <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 rounded mr-1">
                    {rating.sentimentDistribution.positive} positive
                  </span>
                  <span className="inline-block px-2 py-1 bg-red-500/20 text-red-400 rounded mr-1">
                    {rating.sentimentDistribution.negative} negative
                  </span>
                  {rating.sentimentDistribution.neutral > 0 && (
                    <span className="inline-block px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded">
                      {rating.sentimentDistribution.neutral} neutral
                    </span>
                  )}
                </div>
                <button className="text-indigo-300 hover:text-white transition-colors">
                  <FaChartPie />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Details Modal */}
      {showModal && selectedRating && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-indigo-900 border border-indigo-500/30 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-white">{selectedRating.movieTitle}</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-indigo-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center mb-1">
                    <div className="flex mr-2">
                      {renderStars(selectedRating.aggregateScore)}
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {selectedRating.aggregateScore.toFixed(1)}
                    </span>
                    <span className="text-indigo-300 ml-1">/10</span>
                  </div>
                  <p className="text-indigo-300 text-sm">
                    Based on {selectedRating.reviewCount} review{selectedRating.reviewCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-indigo-300 text-sm">
                    Created on {formatDate(selectedRating.timestamp)}
                  </p>
                </div>
                
                <div className="w-40 h-40">
                  <Pie data={getPieData(selectedRating)} options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          color: 'rgba(255, 255, 255, 0.7)',
                          font: {
                            size: 12
                          }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw as number;
                            const total = (context.dataset.data as number[]).reduce((a, b) => (a as number) + (b as number), 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }} />
                </div>
              </div>
              
              <div className="bg-indigo-950/50 border border-indigo-500/20 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-white mb-2">Sentiment Distribution</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-green-900/30 border border-green-500/30 rounded p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {selectedRating.sentimentDistribution.positive}
                    </div>
                    <div className="text-xs text-green-300">Positive</div>
                  </div>
                  <div className="bg-red-900/30 border border-red-500/30 rounded p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {selectedRating.sentimentDistribution.negative}
                    </div>
                    <div className="text-xs text-red-300">Negative</div>
                  </div>
                  <div className="bg-indigo-900/30 border border-indigo-500/30 rounded p-3 text-center">
                    <div className="text-2xl font-bold text-indigo-400">
                      {selectedRating.sentimentDistribution.neutral}
                    </div>
                    <div className="text-xs text-indigo-300">Neutral</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}