// Types for Sarawak Tourism Platform

export interface Attraction {
  id: string;
  name: string;
  location?: string;
  description?: string;
  categories: string[];
  latitude?: number;
  longitude?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  image_url?: string;
  organizer?: string;
  created_at: string;
  updated_at: string;
}

export interface VisitorAnalytics {
  year: number;
  month: number;
  country: string;
  visitor_type: string;
  count: number;
}

export interface PublicHoliday {
  date: string;
  name: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  attraction_id: string;
  created_at: string;
}

// Cluster types
export type ClusterType = 'Culture' | 'Adventure' | 'Nature' | 'Foods' | 'Festivals' | 'Homestays' | 'All';

// Map marker type
export type MarkerType = 'attraction' | 'event';

export interface MapMarker {
  id: string;
  type: MarkerType;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  category?: string;
  categories?: string[];
  image_url?: string;
  start_date?: string;
  end_date?: string;
}
