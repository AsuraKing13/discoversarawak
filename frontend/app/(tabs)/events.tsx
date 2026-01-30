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
import { Ionicons } from '@expo/vector-icons';
import { getEvents } from '../../services/api';
import { Event } from '../../types';

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const eventsData = await getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEvents = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return events.filter((event) =>
          event.start_date ? new Date(event.start_date) >= now : true
        );
      case 'past':
        return events.filter((event) =>
          event.start_date ? new Date(event.start_date) < now : false
        );
      default:
        return events;
    }
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const startDate = item.start_date ? new Date(item.start_date) : null;
    const isUpcoming = startDate && startDate >= new Date();

    return (
      <TouchableOpacity style={styles.eventCard}>
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.eventImage} />
        )}
        
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={[styles.eventBadge, isUpcoming ? styles.upcomingBadge : styles.pastBadge]}>
              <Text style={styles.badgeText}>{isUpcoming ? 'UPCOMING' : 'PAST'}</Text>
            </View>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag" size={12} color="#F59E0B" />
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>

          <Text style={styles.eventTitle}>{item.title}</Text>

          {startDate && (
            <View style={styles.dateContainer}>
              <Ionicons name="calendar" size={16} color="#9CA3AF" />
              <Text style={styles.dateText}>
                {startDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}

          {item.location_name && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color="#9CA3AF" />
              <Text style={styles.locationText}>{item.location_name}</Text>
            </View>
          )}

          {item.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({events.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'past' && styles.filterButtonActive]}
          onPress={() => setFilter('past')}
        >
          <Text style={[styles.filterText, filter === 'past' && styles.filterTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        }
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 150,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  eventBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  upcomingBadge: {
    backgroundColor: '#10B98120',
  },
  pastBadge: {
    backgroundColor: '#6B728020',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  eventDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
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
