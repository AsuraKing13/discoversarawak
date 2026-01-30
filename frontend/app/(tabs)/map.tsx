import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { getAttractions, getEvents } from '../../services/api';
import { Attraction, Event, ClusterType, MapMarker } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';

// Cluster colors
const CLUSTER_COLORS: { [key: string]: string } = {
  Culture: '#8B5CF6',
  Adventure: '#EF4444',
  Nature: '#10B981',
  Foods: '#F59E0B',
  Festivals: '#EC4899',
  Homestays: '#3B82F6',
  All: '#6B7280',
};

const CLUSTER_TYPES: ClusterType[] = ['All', 'Culture', 'Adventure', 'Nature', 'Foods', 'Festivals', 'Homestays'];

export default function MapScreen() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<ClusterType>('All');
  const [showEvents, setShowEvents] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MapMarker | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCluster]);

  const loadData = async () => {
    setLoading(true);
    try {
      const attractionsData = await getAttractions(
        selectedCluster === 'All' ? undefined : selectedCluster
      );
      setAttractions(attractionsData);

      const eventsData = await getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: MapMarker) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  const renderAttractionCard = ({ item }: { item: Attraction }) => {
    const color = item.categories[0]
      ? CLUSTER_COLORS[item.categories[0]] || CLUSTER_COLORS.All
      : CLUSTER_COLORS.All;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          const markerData: MapMarker = {
            id: item.id,
            type: 'attraction',
            title: item.name,
            description: item.description,
            latitude: item.latitude || 0,
            longitude: item.longitude || 0,
            categories: item.categories,
            image_url: item.image_url,
          };
          handleItemPress(markerData);
        }}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: color + '20' }]}>
            <MaterialCommunityIcons name="map-marker" size={48} color={color} />
          </View>
        )}
        
        <View style={styles.cardContent}>
          <View style={[styles.markerIndicator, { backgroundColor: color }]}>
            <MaterialCommunityIcons name="square" size={12} color="#fff" />
          </View>
          
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>
          
          {item.location && (
            <View style={styles.cardLocation}>
              <Ionicons name="location" size={14} color="#9CA3AF" />
              <Text style={styles.cardLocationText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          )}
          
          <View style={styles.cardCategories}>
            {item.categories.slice(0, 2).map((cat) => (
              <View
                key={cat}
                style={[styles.cardCategoryBadge, { backgroundColor: CLUSTER_COLORS[cat] || '#6B7280' }]}
              >
                <Text style={styles.cardCategoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          const markerData: MapMarker = {
            id: item.id,
            type: 'event',
            title: item.title,
            description: item.description,
            latitude: item.latitude || 0,
            longitude: item.longitude || 0,
            category: item.category,
            image_url: item.image_url,
            start_date: item.start_date,
            end_date: item.end_date,
          };
          handleItemPress(markerData);
        }}
      >
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
        )}
        
        <View style={styles.cardContent}>
          <View style={[styles.markerIndicator, { backgroundColor: '#FBBF24' }]}>
            <Ionicons name="star" size={12} color="#fff" />
          </View>
          
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          {item.location_name && (
            <View style={styles.cardLocation}>
              <Ionicons name="location" size={14} color="#9CA3AF" />
              <Text style={styles.cardLocationText} numberOfLines={1}>
                {item.location_name}
              </Text>
            </View>
          )}
          
          {item.start_date && (
            <View style={styles.cardLocation}>
              <Ionicons name="calendar" size={14} color="#9CA3AF" />
              <Text style={styles.cardLocationText}>
                {new Date(item.start_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedItem) return null;

    const isEvent = selectedItem.type === 'event';

    return (
      <Modal
        visible={showDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetails(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>

            <ScrollView>
              {selectedItem.image_url && (
                <Image
                  source={{ uri: selectedItem.image_url }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.modalBody}>
                <View style={styles.markerTypeTag}>
                  {isEvent ? (
                    <Ionicons name="star" size={16} color="#FBBF24" />
                  ) : (
                    <MaterialCommunityIcons name="map-marker" size={16} color="#10B981" />
                  )}
                  <Text style={styles.markerTypeText}>
                    {isEvent ? 'EVENT' : 'ATTRACTION'}
                  </Text>
                </View>

                <Text style={styles.modalTitle}>{selectedItem.title}</Text>

                {selectedItem.categories && selectedItem.categories.length > 0 && (
                  <View style={styles.categoryContainer}>
                    {selectedItem.categories.map((cat) => (
                      <View
                        key={cat}
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: CLUSTER_COLORS[cat] || CLUSTER_COLORS.All },
                        ]}
                      >
                        <Text style={styles.categoryText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {selectedItem.description && (
                  <Text style={styles.modalDescription}>{selectedItem.description}</Text>
                )}

                {isEvent && selectedItem.start_date && (
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.dateText}>
                      {new Date(selectedItem.start_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading attractions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allItems = [
    ...attractions.map(a => ({ ...a, itemType: 'attraction' as const })),
    ...(showEvents ? events.map(e => ({ ...e, itemType: 'event' as const })) : [])
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Sarawak</Text>
        <Text style={styles.headerSubtitle}>
          {attractions.length} attractions {showEvents && `• ${events.length} events`}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {CLUSTER_TYPES.map((cluster) => (
          <TouchableOpacity
            key={cluster}
            style={[
              styles.filterButton,
              selectedCluster === cluster && styles.filterButtonActive,
              { borderColor: CLUSTER_COLORS[cluster] },
            ]}
            onPress={() => setSelectedCluster(cluster)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCluster === cluster && styles.filterTextActive,
              ]}
            >
              {cluster}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.listContainer}>
        <FlatList
          data={allItems}
          renderItem={({ item }) =>
            'itemType' in item && item.itemType === 'event'
              ? renderEventCard({ item: item as Event })
              : renderAttractionCard({ item: item as Attraction })
          }
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity
          style={styles.eventsToggle}
          onPress={() => setShowEvents(!showEvents)}
        >
          <Ionicons
            name={showEvents ? 'star' : 'star-outline'}
            size={20}
            color={showEvents ? '#FBBF24' : '#6B7280'}
          />
          <Text style={styles.eventsToggleText}>
            {showEvents ? 'Hide Events' : 'Show Events'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderDetailsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
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
    backgroundColor: '#1F2937',
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    backgroundColor: '#374151',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    width: '48%',
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 12,
  },
  markerIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    paddingRight: 28,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cardLocationText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  cardCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cardCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardCategoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  eventsToggle: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  eventsToggleText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalBody: {
    padding: 20,
  },
  markerTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  markerTypeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
});
