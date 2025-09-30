import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
// const API_BASE_URL = 'https://primaspot-backend.onrender.com/api';

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

  // Try to fetch cached data first; if missing, trigger scrape and re-fetch
  getOrScrape: async (username: string): Promise<ApiResponse> => {
    // 1) Try GET cached
    try {
      const getRes = await api.get(`/influencers/${username}`);
      return getRes.data as ApiResponse;
    } catch (err) {
      // continue to scrape if 404
      if (axios.isAxiosError(err) && err.response && err.response.status !== 404) {
        // non-404 errors should surface
        throw new Error(err.response.data?.message || 'Failed to fetch influencer data');
      }
    }

    // 2) Trigger scrape (POST)
    let postData: ApiResponse | null = null;
    try {
      const postRes = await api.post(`/influencers/${username}`);
      postData = postRes.data as ApiResponse;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // If backend returned cached on error, it may still be 200 with data
          throw new Error(err.response.data?.message || 'Failed to scrape influencer data');
        }
        if (err.request) {
          throw new Error('Unable to connect to the server. Please check if the backend is running.');
        }
      }
      throw new Error('An unexpected error occurred while scraping influencer data');
    }

    // 3) Prefer GET again to ensure we have the saved format
    try {
      const getRes2 = await api.get(`/influencers/${username}`);
      return getRes2.data as ApiResponse;
    } catch {
      // fallback to whatever POST returned
      if (postData) return postData;
      throw new Error('Failed to retrieve influencer data after scraping');
    }
  },

  // Force a fresh scrape regardless of cache, then fetch the saved doc
  forceScrape: async (username: string): Promise<ApiResponse> => {
    // 1) Trigger scrape (POST)
    try {
      await api.post(`/influencers/${username}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // The backend may return cached data on scrape failure, still proceed to GET
          // but surface a helpful message if needed to the caller if they choose.
        } else if (err.request) {
          throw new Error('Unable to connect to the server. Please check if the backend is running.');
        }
      }
    }

    // 2) GET the latest saved document
    const getRes = await api.get(`/influencers/${username}`);
    return getRes.data as ApiResponse;
  },
};

export default api;
