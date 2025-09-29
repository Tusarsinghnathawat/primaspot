import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8000/api';
const API_BASE_URL = 'https://primaspot-backend.onrender.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for scraping
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for API responses
export interface InfluencerPost {
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  tags?: string[];
  vibe?: string;
}

export interface InfluencerData {
  _id: string;
  username: string;
  fullName: string;
  profilePictureUrl: string;
  bio: string;
  followers: number;
  following: number;
  postsCount: number;
  avgLikes: number;
  avgComments: number;
  engagementRate: number;
  posts: InfluencerPost[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse {
  message: string;
  data: InfluencerData;
}

// API service functions
export const influencerApi = {
  // Scrape and save influencer data
  scrapeInfluencer: async (username: string): Promise<ApiResponse> => {
    try {
      const response = await api.post(`/influencers/${username}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          throw new Error(error.response.data.message || 'Failed to scrape influencer data');
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Unable to connect to the server. Please check if the backend is running.');
        }
      }
      throw new Error('An unexpected error occurred while scraping influencer data');
    }
  },

  // Get influencer data (if we add a GET endpoint later)
  getInfluencer: async (username: string): Promise<InfluencerData> => {
    try {
      const response = await api.get(`/influencers/${username}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data.message || 'Failed to fetch influencer data');
        } else if (error.request) {
          throw new Error('Unable to connect to the server. Please check if the backend is running.');
        }
      }
      throw new Error('An unexpected error occurred while fetching influencer data');
    }
  },
};

export default api;
