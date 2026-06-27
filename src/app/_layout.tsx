import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ThemedText } from '@/components/themed-text';
import React from 'react';

function GlobalHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.logoWrapper}>
        <Image
          source={require('@/assets/logo/site-logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>
      <View style={styles.rightIconsContainer}>
        <Pressable style={styles.iconButton}>
          <MaterialCommunityIcons name="account-outline" size={20} color="#94a3b8" />
        </Pressable>
        <Pressable style={styles.iconButton}>
          <MaterialCommunityIcons name="heart-outline" size={20} color="#94a3b8" />
        </Pressable>
        <Pressable style={[styles.iconButton, styles.cartIconWrapper]}>
          <MaterialCommunityIcons name="cart-outline" size={20} color="#94a3b8" />
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>8</ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <View style={styles.appContainer}>
        <GlobalHeader />
        <AppTabs />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#0a0b10', // Consistent dark background
  },
  headerContainer: {
    backgroundColor: '#0a0b10',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#161824',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoWrapper: {
    backgroundColor: '#ffffff', // Stands out beautifully in dark mode
    borderRadius: 6,
    padding: 2,
  },
  logo: {
    width: 28,
    height: 28,
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 2,
  },
  cartIconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0a0b10',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 10,
  },
});
