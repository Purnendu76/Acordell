import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

const PUSH_TOKEN_REGISTERED_KEY = 'push_token_registered';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Set up the Android notification channel for order alerts
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('order-alerts', {
    name: 'Order Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#818cf8',
    sound: 'mixkit_happy_bells_notification_937.wav',
  });
}

export function registerBackgroundNotifications() {
  // expo-notifications handles background notifications automatically
}

const WEBHOOK_URL =
  'https://n8n.srv917960.hstgr.cloud/webhook/register-tokens';

/**
 * Registers the Expo push token with the n8n webhook.
 * Retries up to 3 times with back-off on failure.
 */
async function registerTokenWithWebhook(token: string, platform: string) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await axios.post(
        WEBHOOK_URL,
        { token, platform },
        { timeout: 15000, headers: { 'Content-Type': 'application/json' } },
      );
      console.log('[PushToken] Token registered successfully.');
      return true;
    } catch (err: any) {
      console.error(`[PushToken] Attempt ${attempt} failed:`, err?.message);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }
  return false;
}

/**
 * Called on every app open. Only sets up the notification tap listener.
 * Token registration is handled separately and runs only once.
 */
export async function initializeNotifications() {
  // Always set up the tap listener so notification taps work
  setupNotificationTapListener();

  // Only attempt token registration on physical devices
  if (!Device.isDevice) return;

  // If token was already registered, do nothing more
  const alreadyRegistered = await AsyncStorage.getItem(PUSH_TOKEN_REGISTERED_KEY);
  if (alreadyRegistered === 'true') return;

  // Check if user has already granted permission (e.g. from the system prompt)
  // Do NOT request permission here — let the OS handle the first-time prompt
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    // Permission not granted yet — request it once
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') return; // User denied — stop here
  }

  // User allowed notifications — get token and register once
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      '6fd88a4f-1249-4ec0-9b91-5d091b5c63e1';

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    console.log('[PushToken] Token:', token);

    const success = await registerTokenWithWebhook(token, Platform.OS);
    if (success) {
      await AsyncStorage.setItem(PUSH_TOKEN_REGISTERED_KEY, 'true');
      console.log('[PushToken] Done — will not run again.');
    }
  } catch (err: any) {
    console.error('[PushToken] Error:', err?.message || err);
  }
}

function setupNotificationTapListener() {
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    const orderId = data?.orderId ?? data?.order_id;
    const productId = data?.productId ?? data?.product_id;

    if (orderId) {
      setTimeout(() => {
        router.push({
          pathname: '/pages/Details_Info/OrderDetails',
          params: { id: String(orderId) },
        });
      }, 300);
    } else if (productId) {
      setTimeout(() => {
        router.push({
          pathname: '/pages/Products',
          params: { productId: String(productId) },
        });
      }, 300);
    }
  });
}
