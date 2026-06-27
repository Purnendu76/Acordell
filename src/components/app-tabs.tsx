import { Tabs } from 'expo-router';
import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route: any, index: number) => {
        // Skip index and explore routes in the custom tab bar rendering 
        if (route.name === 'index' || route.name === 'explore') {
          return null;
        }

        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let label = '';
        let iconName = '';

        switch (route.name) {
          case 'pages/Home':
            label = 'Home';
            iconName = isFocused ? 'home' : 'home-outline';
            break;
          case 'pages/Shop':
            label = 'Shop';
            iconName = isFocused ? 'cake-variant' : 'cake-variant-outline';
            break;
          case 'pages/ContectUs':
            label = 'Contact Us';
            iconName = isFocused ? 'message-text' : 'message-text-outline';
            break;
          case 'pages/Account':
            label = 'Account';
            iconName = isFocused ? 'account' : 'account-outline';
            break;
          default:
            label = route.name;
            iconName = 'help-circle-outline';
        }

        const activeColor = '#818cf8'; // Indigo/blue matching the screenshot
        const inactiveColor = '#94a3b8'; // Slate grey

        const iconColor = isFocused ? activeColor : inactiveColor;
        const textColor = isFocused ? activeColor : inactiveColor;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            android_ripple={{ color: '#161824', borderless: true }}
          >
            <MaterialCommunityIcons
              name={iconName as any}
              size={24}
              color={iconColor}
            />
            <ThemedText style={[styles.tabLabel, { color: textColor }]}>
              {label}
            </ThemedText>
            {isFocused && <View style={styles.dot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="pages/Home" />
      <Tabs.Screen name="pages/Shop" />
      <Tabs.Screen name="pages/ContectUs" />
      <Tabs.Screen name="pages/Account" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0a0b10', // Dark background matching the screenshot
    borderTopWidth: 1,
    borderTopColor: '#161824',
    paddingTop: 8,
    height: Platform.OS === 'web' ? 70 : 80,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#818cf8',
    marginTop: 4,
  },
});
