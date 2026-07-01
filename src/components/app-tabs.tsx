import { Stack } from 'expo-router';
import React from 'react';

export default function AppTabs() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="pages/Home" />
      <Stack.Screen name="pages/Details_Info/OrderDetails" />
    </Stack>
  );
}
