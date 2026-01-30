import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="heart-outline" size={64} color="#6B7280" />
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptyText}>
          Save your favorite attractions and events to see them here
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});