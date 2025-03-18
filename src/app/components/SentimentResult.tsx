'use client';

import { SentimentResponse } from '../api/sentimentService';
import { FaSmile, FaFrown, FaMeh, FaTag, FaFilm, FaTheaterMasks, FaBook, FaVideo, FaDirections } from 'react-icons/fa';

interface SentimentResultProps {
  result: SentimentResponse | null;
  movieTitle?: string;
}

export default function SentimentResult({ result, movieTitle }: SentimentResultProps) {
  if (!result) return null;

  const { sentiment, confidence, key_phrases, aspect_analysis } = result;
  const confidencePercentage = Math.round(confidence * 100);
  
  // Determine color and icon based on sentiment
  const getSentimentColor = () => {
    switch (sentiment) {
      case 'positive':
        return 'bg-purple-100 border-purple-500 text-purple-700';
      case 'negative':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'neutral':
        return 'bg-indigo-100 border-indigo-500 text-indigo-700';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'positive':
        return <FaSmile className="text-purple-500 text-4xl" />;
      case 'negative':
        return <FaFrown className="text-red-500 text-4xl" />;
      case 'neutral':
        return <FaMeh className="text-indigo-500 text-4xl" />;
      default:
        return null;
    }
  };
  
  // Get icon for aspect categories
  const getAspectIcon = (aspect: string) => {
    switch (aspect) {
      case 'Emotional Impact':
        return <FaTheaterMasks className="text-purple-500" />;
      case 'Acting Quality':
        return <FaFilm className="text-indigo-500" />;
      case 'Plot & Story':
        return <FaBook className="text-violet-500" />;
      case 'Visual Elements':
        return <FaVideo className="text-fuchsia-500" />;
      case 'Direction':
        return <FaDirections className="text-pink-500" />;
      default:
        return <FaTag className="text-gray-500" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Sentiment Analysis Result
        {movieTitle && <span className="block text-lg mt-1">for &quot;{movieTitle}&quot;</span>}
      </h2>
      
      <div className={`p-6 rounded-lg border ${getSentimentColor()} flex items-center justify-between mb-6`}>
        <div className="flex items-center">
          <div className="mr-4">
            {getSentimentIcon()}
          </div>
          <div>
            <h3 className="text-xl font-bold capitalize">{sentiment}</h3>
            <p className="text-sm">Confidence: {confidencePercentage}%</p>
          </div>
        </div>
        
        <div className="w-24 h-24 relative">
          <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-600">
            <div 
              className={`absolute top-0 left-0 flex items-center justify-center w-full h-full text-lg font-bold`}
            >
              {confidencePercentage}%
            </div>
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={sentiment === 'positive' ? '#10B981' : sentiment === 'negative' ? '#EF4444' : '#3B82F6'}
                strokeWidth="3"
                strokeDasharray={`${confidencePercentage}, 100`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Key Phrases Section */}
      {key_phrases && key_phrases.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Key Phrases</h3>
          <div className="flex flex-wrap gap-2">
            {key_phrases.map((phrase, index) => (
              <span 
                key={index} 
                className={`px-3 py-1 rounded-full text-sm ${sentiment === 'positive' ? 'bg-purple-100 text-purple-800' : 
                  sentiment === 'negative' ? 'bg-red-100 text-red-800' : 'bg-indigo-100 text-indigo-800'}`}
              >
                {phrase}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Aspect Analysis Section */}
      {aspect_analysis && Object.keys(aspect_analysis).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Aspect Analysis</h3>
          <div className="space-y-3">
            {Object.entries(aspect_analysis).map(([aspect, data]) => {
              const aspectScore = Math.round(data.score * 100);
              return (
                <div key={aspect} className="border rounded-lg p-3 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    {getAspectIcon(aspect)}
                    <h4 className="font-medium text-gray-800 dark:text-white">{aspect}</h4>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
                    <div 
                      className={`h-2.5 rounded-full ${sentiment === 'positive' ? 'bg-green-500' : 
                        sentiment === 'negative' ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{ width: `${aspectScore}%` }}
                    ></div>
                  </div>
                  
                  {data.keywords && data.keywords.length > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Keywords: {data.keywords.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}