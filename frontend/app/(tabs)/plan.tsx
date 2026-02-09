import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { generateItinerary } from '../../services/api';

const INTERESTS = ['Culture', 'Adventure', 'Nature', 'Foods', 'Festivals'];
const DURATIONS = [
  { label: '1 Day', value: 1 },
  { label: '3 Days', value: 3 },
  { label: '5 Days', value: 5 },
  { label: '1 Week', value: 7 },
];
const BUDGETS = [
  { label: 'Low', value: 'low', desc: 'Budget-friendly' },
  { label: 'Medium', value: 'medium', desc: 'Balanced' },
  { label: 'High', value: 'high', desc: 'Premium' },
];

const CLUSTER_COLORS: { [key: string]: string } = {
  Culture: '#8B5CF6',
  Adventure: '#EF4444',
  Nature: '#10B981',
  Foods: '#F59E0B',
  Festivals: '#EC4899',
};

export default function PlanTripScreen() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(3);
  const [selectedBudget, setSelectedBudget] = useState<string>('medium');
  const [generating, setGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleGenerateItinerary = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Select Interests', 'Please select at least one interest to continue.');
      return;
    }

    setGenerating(true);
    setGeneratedItinerary(null);

    try {
      const result = await generateItinerary(
        selectedInterests,
        selectedDuration,
        selectedBudget
      );
      
      setGeneratedItinerary(result.itinerary);
      setShowResultsModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate itinerary. Please try again.');
      console.error('Error generating itinerary:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCloseModal = () => {
    setShowResultsModal(false);
  };

  const handleNewItinerary = () => {
    setShowResultsModal(false);
    setGeneratedItinerary(null);
    setSelectedInterests([]);
    setSelectedDuration(3);
    setSelectedBudget('medium');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContainer}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="routes" size={40} color="#10B981" />
          <Text style={styles.headerTitle}>AI Planner</Text>
          <Text style={styles.headerSubtitle}>
            Let AI create a personalized itinerary for you
          </Text>
        </View>

        {/* Interests Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="heart" size={20} color="#10B981" /> What interests you?
          </Text>
          <Text style={styles.sectionDesc}>Select one or more interests</Text>
          
          <View style={styles.interestsGrid}>
            {INTERESTS.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestCard,
                  selectedInterests.includes(interest) && styles.interestCardActive,
                  {
                    borderColor: CLUSTER_COLORS[interest] || '#6B7280',
                    backgroundColor: selectedInterests.includes(interest)
                      ? `${CLUSTER_COLORS[interest]}20`
                      : '#1F2937',
                  },
                ]}
                onPress={() => toggleInterest(interest)}
              >
                {selectedInterests.includes(interest) && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={CLUSTER_COLORS[interest]}
                    style={styles.checkmark}
                  />
                )}
                <Text
                  style={[
                    styles.interestText,
                    selectedInterests.includes(interest) && {
                      color: CLUSTER_COLORS[interest],
                    },
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="calendar" size={20} color="#10B981" /> Trip Duration
          </Text>
          <Text style={styles.sectionDesc}>How long is your trip?</Text>
          
          <View style={styles.durationGrid}>
            {DURATIONS.map((duration) => (
              <TouchableOpacity
                key={duration.value}
                style={[
                  styles.durationCard,
                  selectedDuration === duration.value && styles.durationCardActive,
                ]}
                onPress={() => setSelectedDuration(duration.value)}
              >
                <Text
                  style={[
                    styles.durationText,
                    selectedDuration === duration.value && styles.durationTextActive,
                  ]}
                >
                  {duration.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="wallet" size={20} color="#10B981" /> Budget Level
          </Text>
          <Text style={styles.sectionDesc}>What's your budget?</Text>
          
          <View style={styles.budgetContainer}>
            {BUDGETS.map((budget) => (
              <TouchableOpacity
                key={budget.value}
                style={[
                  styles.budgetCard,
                  selectedBudget === budget.value && styles.budgetCardActive,
                ]}
                onPress={() => setSelectedBudget(budget.value)}
              >
                <Text
                  style={[
                    styles.budgetLabel,
                    selectedBudget === budget.value && styles.budgetLabelActive,
                  ]}
                >
                  {budget.label}
                </Text>
                <Text style={styles.budgetDesc}>{budget.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerateItinerary}
          disabled={generating}
        >
          {generating ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="magic-staff" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Generate Itinerary</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Results Modal */}
      <Modal
        visible={showResultsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalHeaderContent}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              <Text style={styles.modalTitle}>Your Personalized Itinerary</Text>
              <Text style={styles.modalSubtitle}>
                {selectedDuration} day{selectedDuration > 1 ? 's' : ''} • {selectedBudget} budget
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.itineraryCard}>
              <Text style={styles.itineraryText}>{generatedItinerary}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="create" size={20} color="#10B981" />
                <Text style={styles.modalActionButtonText}>Edit Preferences</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalActionButtonPrimary]}
                onPress={handleNewItinerary}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={[styles.modalActionButtonText, { color: '#fff' }]}>
                  Plan New Trip
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  interestCardActive: {
    borderWidth: 2,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  interestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#374151',
  },
  durationCardActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  durationTextActive: {
    color: '#fff',
  },
  budgetContainer: {
    gap: 12,
  },
  budgetCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#374151',
  },
  budgetCardActive: {
    backgroundColor: '#10B98120',
    borderColor: '#10B981',
  },
  budgetLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  budgetLabelActive: {
    color: '#10B981',
  },
  budgetDesc: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  generateButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalHeader: {
    backgroundColor: '#1F2937',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  modalHeaderContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  itineraryCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  itineraryText: {
    fontSize: 16,
    color: '#E5E7EB',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  modalActionButtonPrimary: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  modalActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});
