import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const EMERGENT_AUTH_URL = 'https://demobackend.emergentagent.com/auth/v1/env/oauth';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // Build redirect URL
      const redirectUrl = Linking.createURL('/');
      const authUrl = `${EMERGENT_AUTH_URL}?provider=google&redirect=${encodeURIComponent(redirectUrl)}`;

      // Open OAuth flow
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success') {
        // Extract session_id from URL
        const url = result.url;
        const sessionId = extractSessionId(url);

        if (sessionId) {
          // Exchange session_id for session_token
          await login(sessionId);
          
          // Navigate to main app
          router.replace('/(tabs)/map');
        } else {
          Alert.alert('Login Failed', 'Could not extract session information.');
        }
      } else if (result.type === 'cancel') {
        console.log('Login cancelled by user');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const extractSessionId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('session_id');
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  };

  const handleSkip = () => {
    // Allow users to continue without login
    router.replace('/(tabs)/map');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="map-marker-multiple" size={80} color="#10B981" />
          <Text style={styles.title}>Discover Sarawak</Text>
          <Text style={styles.subtitle}>Your Personal Travel Companion</Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="map" size={24} color="#10B981" />
            <Text style={styles.featureText}>Explore 100+ attractions</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="calendar" size={24} color="#10B981" />
            <Text style={styles.featureText}>Discover cultural events</Text>
          </View>
          <View style={styles.feature}>
            <MaterialCommunityIcons name="routes" size={24} color="#10B981" />
            <Text style={styles.featureText}>AI-powered trip planning</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="heart" size={24} color="#10B981" />
            <Text style={styles.featureText}>Save your favorites</Text>
          </View>
        </View>

        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>Sign in to get started</Text>
          
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={24} color="#000" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  featuresContainer: {
    marginVertical: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#D1D5DB',
    marginLeft: 16,
  },
  authContainer: {
    width: '100%',
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecoration: 'underline',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
