import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function ContactUsScreen() {
  return (
    <ThemedView style={styles.container}>
      <MaterialCommunityIcons name="message-text-outline" size={64} color="#818cf8" />
      <ThemedText type="subtitle" style={styles.title}>Contact Acrodell</ThemedText>
      <ThemedText style={styles.description}>
        Have questions or want to place a custom order? Reach out to us:
      </ThemedText>
      <View style={styles.contactDetails}>
        <ThemedText style={styles.contactItem}>📧 email: contact@acrodell.com</ThemedText>
        <ThemedText style={styles.contactItem}>📞 phone: +1 (234) 567-890</ThemedText>
        <ThemedText style={styles.contactItem}>📍 address: 123 Baker Street, Sweet City</ThemedText>
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
  contactDetails: {
    marginTop: 24,
    gap: 8,
    alignItems: 'flex-start',
  },
  contactItem: {
    color: '#ffffff',
    fontSize: 14,
  },
});
