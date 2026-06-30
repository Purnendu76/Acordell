import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import axios from 'axios';
import { router } from 'expo-router';

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
  // No manual background handler registration needed
}

export async function initializeNotifications() {
  // Only request push tokens on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device.');
    return;
  }

  // Request notification permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied.');
    return;
  }

  // Get Expo Push Token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    const token = tokenData.data;
    console.log('Expo Push Token:', token);

    // Register the token with the n8n webhook → Supabase push_tokens table
    try {
      await axios.post('https://n8n.srv917960.hstgr.cloud/webhook/register-token-accordell', {
        token: token,
        platform: Platform.OS,
      });
      console.log('Expo Push Token registered successfully with webhook.');
    } catch (webhookErr) {
      console.error('Failed to register push token with webhook:', webhookErr);
    }
  } catch (err) {
    console.error('Error getting Expo Push Token:', err);
  }

  // Handle notification taps (when user taps a notification to open the app)
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    const orderId = data?.orderId;
    if (orderId) {
      console.log('Notification tapped — navigating to order:', orderId);
      setTimeout(() => {
        router.push({
          pathname: '/pages/Details_Info/OrderDetails',
          params: { id: String(orderId) },
        });
      }, 300);
    }
  });
}
