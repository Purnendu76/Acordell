import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function AccountScreen() {
  return (
    <ThemedView style={styles.container}>
      <MaterialCommunityIcons name="account-outline" size={64} color="#818cf8" />
      <ThemedText type="subtitle" style={styles.title}>Your Account</ThemedText>
      <ThemedText style={styles.description}>
        Log in to track your orders, manage delivery addresses, and configure preferences.
      </ThemedText>
      <View style={styles.buttonContainer}>
        <ThemedView type="backgroundSelected" style={styles.button}>
          <ThemedText style={styles.buttonText}>Log In / Sign Up</ThemedText>
        </ThemedView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#ffffff',
    marginTop: 16,
  },
  description: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 24,
    width: '100%',
    maxWidth: 200,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#161824',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
