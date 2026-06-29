import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const hideTimeoutRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(setToast)(null);
      }
    });
  }, [translateY, opacity]);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const type = options?.type || 'success';
    const duration = options?.duration || 3000;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    setToast({ message, type });

    // Reset values first
    translateY.value = -100;
    opacity.value = 0;

    // Animate in
    const targetY = Math.max(insets.top, 12);
    translateY.value = withTiming(targetY, { duration: 350 });
    opacity.value = withTiming(1, { duration: 350 });

    // Set timeout to hide
    hideTimeoutRef.current = setTimeout(() => {
      hideToast();
    }, duration);
  }, [insets.top, translateY, opacity, hideToast]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View style={[styles.toastContainer, animatedStyle]}>
          <Pressable style={styles.toastContent} onPress={hideToast}>
            <View style={[styles.iconContainer, styles[toast.type]]}>
              <MaterialCommunityIcons 
                name={
                  toast.type === 'success' ? 'check-circle' :
                  toast.type === 'error' ? 'alert-circle' :
                  toast.type === 'warning' ? 'alert' : 'information'
                } 
                size={20} 
                color={
                  toast.type === 'success' ? '#10b981' :
                  toast.type === 'error' ? '#ef4444' :
                  toast.type === 'warning' ? '#fbbf24' : '#818cf8'
                } 
              />
            </View>
            <Text style={styles.toastMessage}>{toast.message}</Text>
            <MaterialCommunityIcons name="close" size={16} color="#94a3b8" style={styles.closeIcon} />
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161824',
    borderWidth: 1,
    borderColor: '#1e2133',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
    ...Platform.select({
      web: {
        maxWidth: 400,
      },
    }),
  },
  iconContainer: {
    marginRight: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  warning: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  info: {
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
  },
  toastMessage: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  closeIcon: {
    marginLeft: 8,
  },
});
