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
  Platform,
  TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';
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
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttractions, setFilteredAttractions] = useState<Attraction[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadData();
  }, [selectedCluster]);

  useEffect(() => {
    // Filter attractions and events based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredAttractions(
        attractions.filter((a) =>
          a.name.toLowerCase().includes(query) ||
          a.location?.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query)
        )
      );
      setFilteredEvents(
        events.filter((e) =>
          e.title.toLowerCase().includes(query) ||
          e.location_name?.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredAttractions(attractions);
      setFilteredEvents(events);
    }
  }, [searchQuery, attractions, events]);

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

  const generateMapHTML = () => {
    const markers = [];
    
    // Add filtered attractions
    filteredAttractions.forEach((attraction) => {
      if (attraction.latitude && attraction.longitude) {
        const color = attraction.categories[0]
          ? CLUSTER_COLORS[attraction.categories[0]] || CLUSTER_COLORS.All
          : CLUSTER_COLORS.All;
        
        markers.push({
          lat: attraction.latitude,
          lng: attraction.longitude,
          title: attraction.name,
          description: attraction.location || '',
          color: color,
          type: 'attraction'
        });
      }
    });

    // Add filtered events
    if (showEvents) {
      filteredEvents.forEach((event) => {
        if (event.latitude && event.longitude) {
          markers.push({
            lat: event.latitude,
            lng: event.longitude,
            title: event.title,
            description: event.location_name || '',
            color: '#FBBF24',
            type: 'event'
          });
        }
      });
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .marker-cluster-small { background-color: rgba(16, 185, 129, 0.6); }
        .marker-cluster-small div { background-color: rgba(16, 185, 129, 0.8); }
        .marker-cluster-medium { background-color: rgba(239, 68, 68, 0.6); }
        .marker-cluster-medium div { background-color: rgba(239, 68, 68, 0.8); }
        .marker-cluster-large { background-color: rgba(139, 92, 246, 0.6); }
        .marker-cluster-large div { background-color: rgba(139, 92, 246, 0.8); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([1.5535, 110.3593], 10);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        // Create marker cluster group
        var markers = L.markerClusterGroup({
          maxClusterRadius: 60,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true
        });

        var markerData = ${JSON.stringify(markers)};
        
        markerData.forEach(function(marker) {
          var icon;
          if (marker.type === 'event') {
            icon = L.divIcon({
              className: 'custom-marker',
              html: '<div style="background-color: ' + marker.color + '; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><span style="color: white; font-size: 16px;">★</span></div>',
              iconSize: [30, 30]
            });
          } else {
            icon = L.divIcon({
              className: 'custom-marker',
              html: '<div style="background-color: ' + marker.color + '; width: 30px; height: 30px; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><span style="color: white; font-size: 14px;">■</span></div>',
              iconSize: [30, 30]
            });
          }
          
          var leafletMarker = L.marker([marker.lat, marker.lng], {icon: icon})
            .bindPopup('<b>' + marker.title + '</b><br>' + marker.description);
          
          markers.addLayer(leafletMarker);
        });
        
        map.addLayer(markers);
      </script>
    </body>
    </html>
    `;
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
          {filteredAttractions.length} attractions {showEvents && `• ${filteredEvents.length} events`}
        </Text>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search attractions, events, locations..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.controlsContainer}>
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

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'map' && styles.viewToggleButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={20} color={viewMode === 'map' ? '#fff' : '#9CA3AF'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'grid' && styles.viewToggleButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons name="grid" size={20} color={viewMode === 'grid' ? '#fff' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={generateMapHTML()}
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="Sarawak Tourism Map"
            />
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: generateMapHTML() }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
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
      ) : (
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
        </View>
      )}

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
  controlsContainer: {
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  filterContainer: {
    flex: 1,
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
  viewToggle: {
    flexDirection: 'row',
    marginRight: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 4,
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: '#10B981',
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
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
