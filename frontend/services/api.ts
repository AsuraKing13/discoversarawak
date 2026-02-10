// API Service for Sarawak Tourism Platform
import axios from 'axios';
import { Attraction, Event, VisitorAnalytics, PublicHoliday, Favorite } from '../types';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://tourism-hub-12.preview.emergentagent.com';
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attractions API
export const getAttractions = async (category?: string, location?: string, limit: number = 1000): Promise<Attraction[]> => {
  try {
    const params: any = { limit };
    if (category && category !== 'All') params.category = category;
    if (location) params.location = location;
    
    const response = await api.get('/attractions', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching attractions:', error);
    return [];
  }
};

export const getAttraction = async (id: string): Promise<Attraction | null> => {
  try {
    const response = await api.get(`/attractions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attraction:', error);
    return null;
  }
};

// Events API
export const getEvents = async (
  category?: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
): Promise<Event[]> => {
  try {
    const params: any = { limit };
    if (category) params.category = category;
    if (startDate) params.start_date = startDate.toISOString();
    if (endDate) params.end_date = endDate.toISOString();
    
    const response = await api.get('/events', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const response = await api.get(`/events/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
};

// Analytics API
export const getAnalytics = async (
  year?: number,
  month?: number,
  country?: string,
  visitorType?: string
): Promise<VisitorAnalytics[]> => {
  try {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    if (country) params.country = country;
    if (visitorType) params.visitor_type = visitorType;
    
    const response = await api.get('/analytics', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return [];
  }
};

// Public Holidays API
export const getHolidays = async (year?: number): Promise<PublicHoliday[]> => {
  try {
    const params: any = {};
    if (year) params.year = year;
    
    const response = await api.get('/holidays', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return [];
  }
};

// Favorites API
export const addFavorite = async (userId: string, attractionId: string): Promise<Favorite | null> => {
  try {
    const response = await api.post('/favorites', {
      user_id: userId,
      attraction_id: attractionId,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding favorite:', error);
    return null;
  }
};

export const getUserFavorites = async (userId: string): Promise<Attraction[]> => {
  try {
    const response = await api.get(`/favorites/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
};

export const removeFavorite = async (userId: string, attractionId: string): Promise<boolean> => {
  try {
    await api.delete(`/favorites/${userId}/${attractionId}`);
    return true;
  } catch (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
};

// Health check
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking health:', error);
    return { status: 'unhealthy', error };
  }
};

// AI Itinerary Generator
export const generateItinerary = async (
  interests: string[],
  duration: number,
  budget: string,
  userId?: string
) => {
  try {
    const response = await api.post('/itinerary/generate', {
      interests,
      duration,
      budget,
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw error;
  }
};

export const getUserItineraries = async (userId: string) => {
  try {
    const response = await api.get(`/itinerary/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    return [];
  }
};
