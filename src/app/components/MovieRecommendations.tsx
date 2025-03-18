'use client';

import { useState } from 'react';
import { FaFilm, FaSearch, FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';

interface Movie {
  id: string;
  title: string;
  year: string;
  genre: string;
  rating: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  posterUrl: string;
}

// Mock data - in a real app, this would come from an API
const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'The Shawshank Redemption',
    year: '1994',
    genre: 'Drama',
    rating: 9.3,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg'
  },
  {
    id: '2',
    title: 'The Godfather',
    year: '1972',
    genre: 'Crime, Drama',
    rating: 9.2,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg'
  },
  {
    id: '3',
    title: 'The Dark Knight',
    year: '2008',
    genre: 'Action, Crime, Drama',
    rating: 9.0,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg'
  },
  {
    id: '4',
    title: 'Pulp Fiction',
    year: '1994',
    genre: 'Crime, Drama',
    rating: 8.9,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg'
  },
  {
    id: '5',
    title: 'Fight Club',
    year: '1999',
    genre: 'Drama',
    rating: 8.8,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg'
  }
];

export default function MovieRecommendations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('');
  
  const genres = Array.from(new Set(mockMovies.map(movie => movie.genre.split(', ')).flat()));
  
  const filteredMovies = mockMovies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === '' || movie.genre.includes(selectedGenre);
    const matchesSentiment = selectedSentiment === '' || movie.sentiment === selectedSentiment;
    
    return matchesSearch && matchesGenre && matchesSentiment;
  });
  
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 0.5;
    
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
  
  return (
    <div className="w-full max-w-6xl mx-auto bg-indigo-900/30 backdrop-blur-sm border border-indigo-500/20 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Movie Recommendations</h2>
      <p className="text-gray-300 mb-6">
        Discover movies based on sentiment analysis of audience reviews.
      </p>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-indigo-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search movies..."
              className="w-full pl-10 pr-4 py-2 bg-indigo-900/50 border border-indigo-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
            />
          </div>
        </div>
        
        <div className="w-full md:w-48">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            <option value="">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
        
        <div className="w-full md:w-48">
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value)}
            className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            <option value="">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMovies.map(movie => (
          <div key={movie.id} className="bg-indigo-900/40 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-indigo-500/20 hover:border-indigo-500/40">
            <div className="h-64 overflow-hidden">
              <img 
                src={movie.posterUrl} 
                alt={movie.title} 
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold text-white mb-1">{movie.title}</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-indigo-300 text-sm">{movie.year}</span>
                <span className="text-sm px-2 py-1 rounded-full bg-indigo-800 text-indigo-200">{movie.genre}</span>
              </div>
              <div className="flex items-center mb-3">
                {renderStars(movie.rating)}
                <span className="ml-2 text-indigo-300">{movie.rating.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  movie.sentiment === 'positive' ? 'bg-green-900/50 text-green-300' :
                  movie.sentiment === 'negative' ? 'bg-red-900/50 text-red-300' :
                  'bg-blue-900/50 text-blue-300'
                }`}>
                  {movie.sentiment.charAt(0).toUpperCase() + movie.sentiment.slice(1)} Reviews
                </span>
                <button className="text-indigo-300 hover:text-purple-400 transition-colors">
                  <FaFilm className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredMovies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-indigo-300 text-lg">No movies found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}