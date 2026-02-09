import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://discover-sarawak.preview.emergentagent.com';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  loading: boolean;
  login: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('session_token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setSessionToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        await verifySession(storedToken);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      await clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const verifySession = async (token: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Update user data if needed
      if (response.data) {
        setUser(response.data);
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Session verification failed:', error);
      await clearAuth();
    }
  };

  const login = async (sessionId: string) => {
    try {
      setLoading(true);
      
      // Exchange session_id for session_token and user data
      const response = await axios.post(`${BACKEND_URL}/api/auth/session`, null, {
        params: { session_id: sessionId },
      });

      const { id, email, name, picture, session_token } = response.data;

      const userData: User = {
        user_id: id,
        email,
        name,
        picture,
      };

      // Save to state
      setUser(userData);
      setSessionToken(session_token);

      // Save to storage
      await AsyncStorage.setItem('session_token', session_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        // Call backend logout
        await axios.post(
          `${BACKEND_URL}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
          }
        );
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      await clearAuth();
    }
  };

  const clearAuth = async () => {
    setUser(null);
    setSessionToken(null);
    await AsyncStorage.removeItem('session_token');
    await AsyncStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    sessionToken,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!sessionToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
