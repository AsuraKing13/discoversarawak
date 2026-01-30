import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { getAttractions, getEvents } from '../../services/api';
import { Attraction, Event, ClusterType, MapMarker } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

// Sarawak coordinates (center of Kuching)
const INITIAL_REGION = {
  latitude: 1.5535,
  longitude: 110.3593,
  latitudeDelta: 2.5,
  longitudeDelta: 2.5,
};

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
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadData();
  }, [selectedCluster]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load attractions
      const attractionsData = await getAttractions(
        selectedCluster === 'All' ? undefined : selectedCluster
      );
      
      // Filter out attractions without coordinates
      const validAttractions = attractionsData.filter(
        (a) => a.latitude && a.longitude
      );
      
      setAttractions(validAttractions);

      // Load events
      const eventsData = await getEvents();
      const validEvents = eventsData.filter((e) => e.latitude && e.longitude);
      setEvents(validEvents);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (marker: MapMarker) => {
    setSelectedMarker(marker);
    setShowDetails(true);
  };

  const handleClusterPress = (cluster: ClusterType) => {
    setSelectedCluster(cluster);
  };

  const renderMarkers = () => {
    const markers: JSX.Element[] = [];

    // Add attraction markers (square pins)
    attractions.forEach((attraction) => {
      if (!attraction.latitude || !attraction.longitude) return;

      const markerData: MapMarker = {
        id: attraction.id,
        type: 'attraction',
        title: attraction.name,
        description: attraction.description,
        latitude: attraction.latitude,
        longitude: attraction.longitude,
        categories: attraction.categories,
        image_url: attraction.image_url,
      };

      const color = attraction.categories[0]
        ? CLUSTER_COLORS[attraction.categories[0]] || CLUSTER_COLORS.All
        : CLUSTER_COLORS.All;

      markers.push(
        <Marker
          key={`attraction-${attraction.id}`}
          coordinate={{
            latitude: attraction.latitude,
            longitude: attraction.longitude,
          }}
          title={attraction.name}
          description={attraction.location}
          onPress={() => handleMarkerPress(markerData)}
        >
          <View style={[styles.markerSquare, { backgroundColor: color }]}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#fff" />
          </View>
        </Marker>
      );
    });

    // Add event markers (star pins)
    if (showEvents) {
      events.forEach((event) => {
        if (!event.latitude || !event.longitude) return;

        const markerData: MapMarker = {
          id: event.id,
          type: 'event',
          title: event.title,
          description: event.description,
          latitude: event.latitude,
          longitude: event.longitude,
          category: event.category,
          image_url: event.image_url,
          start_date: event.start_date,
          end_date: event.end_date,
        };

        markers.push(
          <Marker
            key={`event-${event.id}`}
            coordinate={{
              latitude: event.latitude,
              longitude: event.longitude,
            }}
            title={event.title}
            description={event.location_name}
            onPress={() => handleMarkerPress(markerData)}
          >
            <View style={styles.markerStar}>
              <Ionicons name="star" size={24} color="#FBBF24" />
            </View>
          </Marker>
        );
      });
    }

    return markers;
  };

  const renderClusterFilters = () => {
    return (
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
            onPress={() => handleClusterPress(cluster)}
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
    );
  };

  const renderDetailsModal = () => {
    if (!selectedMarker) return null;

    const isEvent = selectedMarker.type === 'event';

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
              {selectedMarker.image_url && (
                <Image
                  source={{ uri: selectedMarker.image_url }}
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

                <Text style={styles.modalTitle}>{selectedMarker.title}</Text>

                {selectedMarker.categories && selectedMarker.categories.length > 0 && (
                  <View style={styles.categoryContainer}>
                    {selectedMarker.categories.map((cat) => (
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

                {selectedMarker.description && (
                  <Text style={styles.modalDescription}>{selectedMarker.description}</Text>
                )}

                {isEvent && selectedMarker.start_date && (
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.dateText}>
                      {new Date(selectedMarker.start_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {selectedMarker.end_date &&
                        selectedMarker.end_date !== selectedMarker.start_date &&
                        ` - ${new Date(selectedMarker.end_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}`}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.favoriteButton}>
                  <Ionicons name="heart-outline" size={20} color="#EF4444" />
                  <Text style={styles.favoriteButtonText}>Add to Favorites</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Sarawak</Text>
        <Text style={styles.headerSubtitle}>
          {attractions.length} attractions {showEvents && `• ${events.length} events`}
        </Text>
      </View>

      {renderClusterFilters()}

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading attractions...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={INITIAL_REGION}
            provider={PROVIDER_GOOGLE}
            showsUserLocation
            showsMyLocationButton
          >
            {renderMarkers()}
          </MapView>
        )}

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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
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
  markerSquare: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerStar: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: height * 0.8,
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
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  favoriteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
