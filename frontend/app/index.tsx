import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the map tab which is the main screen
  return <Redirect href="/(tabs)/map" />;
}
