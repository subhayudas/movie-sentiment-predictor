'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
interface ReviewWithResults {
  id: string;
  movieTitle?: string;
  sentiment: string;
  confidence: number;
}

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SentimentChartProps {
  reviewHistory: ReviewWithResults[];
}

export default function SentimentChart({ reviewHistory }: SentimentChartProps) {
  const [sentimentCounts, setSentimentCounts] = useState({ positive: 0, negative: 0, neutral: 0 });
  const [confidenceData, setConfidenceData] = useState<number[]>([]);
  const [movieTitles, setMovieTitles] = useState<string[]>([]);

  useEffect(() => {
    if (reviewHistory.length === 0) return;

    // Calculate sentiment counts
    const counts = reviewHistory.reduce(
      (acc, review) => {
        const sentiment = review.sentiment.toLowerCase();
        if (sentiment === 'positive') acc.positive += 1;
        else if (sentiment === 'negative') acc.negative += 1;
        else acc.neutral += 1;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    // Extract confidence values and movie titles for the bar chart
    // Only use the last 5 reviews for the bar chart to avoid overcrowding
    const recentReviews = [...reviewHistory].reverse().slice(0, 5).reverse();
    const confidences = recentReviews.map(review => Math.round(review.confidence * 100));
    const titles = recentReviews.map(review => review.movieTitle || `Review ${review.id.slice(0, 4)}`);

    setSentimentCounts(counts);
    setConfidenceData(confidences);
    setMovieTitles(titles);
  }, [reviewHistory]);

  // Pie chart data for sentiment distribution
  const pieData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [sentimentCounts.positive, sentimentCounts.negative, sentimentCounts.neutral],
        backgroundColor: ['rgba(147, 51, 234, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(99, 102, 241, 0.7)'],
        borderColor: ['#9333EA', '#EF4444', '#6366F1'],
        borderWidth: 1,
      },
    ],
  };

  // Bar chart data for confidence scores
  const barData = {
    labels: movieTitles,
    datasets: [
      {
        label: 'Confidence Score (%)',
        data: confidenceData,
        backgroundColor: 'rgba(147, 51, 234, 0.7)',
        borderColor: '#9333EA',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Confidence Scores by Review',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Confidence (%)',
        },
      },
    },
  };

  if (reviewHistory.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No data available yet. Submit a review to see charts.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Sentiment Analysis Charts</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Sentiment Distribution</h3>
          <div className="h-64">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Confidence by Review</h3>
          <div className="h-64">
            <Bar data={barData} options={{ ...barOptions, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
}