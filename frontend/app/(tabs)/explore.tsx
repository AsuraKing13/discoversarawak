import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { getAttractions } from '../../services/api';
import { Attraction, ClusterType } from '../../types';

const CLUSTER_COLORS: { [key: string]: string } = {
  Culture: '#8B5CF6',
  Adventure: '#EF4444',
  Nature: '#10B981',
  Foods: '#F59E0B',
  Festivals: '#EC4899',
  Homestays: '#3B82F6',
};

const CLUSTER_TYPES: ClusterType[] = ['All', 'Culture', 'Adventure', 'Nature', 'Foods', 'Festivals', 'Homestays'];

export default function ExploreScreen() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<ClusterType>('All');

  useEffect(() => {
    loadAttractions();
  }, [selectedCluster]);

  const loadAttractions = async () => {
    setLoading(true);
    try {
      const data = await getAttractions(
        selectedCluster === 'All' ? undefined : selectedCluster
      );
      setAttractions(data);
    } catch (error) {
      console.error('Error loading attractions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAttractionCard = ({ item }: { item: Attraction }) => {
    const category = item.categories[0];
    const color = category ? CLUSTER_COLORS[category] || '#6B7280' : '#6B7280';

    return (
      <TouchableOpacity style={styles.attractionCard}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.attractionImage} />
        ) : (
          <View style={[styles.attractionImagePlaceholder, { backgroundColor: color + '20' }]}>
            <MaterialCommunityIcons name="map-marker" size={48} color={color} />
          </View>
        )}
        
        <View style={styles.attractionContent}>
          <Text style={styles.attractionTitle} numberOfLines={2}>
            {item.name}
          </Text>

          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color="#9CA3AF" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          )}

          <View style={styles.categoryContainer}>
            {item.categories.map((cat) => (
              <View
                key={cat}
                style={[
                  styles.categoryBadge,
                  { backgroundColor: CLUSTER_COLORS[cat] || '#6B7280' },
                ]}
              >
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading attractions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Sarawak</Text>
        <Text style={styles.headerSubtitle}>
          {attractions.length} attractions
        </Text>
      </View>

      <FlatList
        data={CLUSTER_TYPES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedCluster === item && styles.filterButtonActive,
              { borderColor: CLUSTER_COLORS[item] || '#6B7280' },
            ]}
            onPress={() => setSelectedCluster(item)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCluster === item && styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterContainer}
      />

      <FlatList
        data={attractions}
        renderItem={renderAttractionCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="map-marker-off" size={64} color="#6B7280" />
            <Text style={styles.emptyText}>No attractions found</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#1F2937',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  filterContainer: {
    padding: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    backgroundColor: '#1F2937',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  attractionCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    width: '48%',
  },
  attractionImage: {
    width: '100%',
    height: 120,
  },
  attractionImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attractionContent: {
    padding: 12,
  },
  attractionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});