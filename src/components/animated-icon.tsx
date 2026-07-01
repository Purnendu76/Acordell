import React, { useState, useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe, runOnJS, useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ThemedText } from './themed-text';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;


export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  
  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.7);
  const logoTranslateY = useSharedValue(25);
  
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(15);
  
  const progressScale = useSharedValue(0);
  
  const containerScale = useSharedValue(1);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Logo & Glow Fade-in
    logoOpacity.value = withTiming(1, { 
      duration: 1000, 
      easing: Easing.bezier(0.16, 1, 0.3, 1) 
    });
    logoScale.value = withTiming(1, { 
      duration: 1200, 
      easing: Easing.bezier(0.16, 1, 0.3, 1) 
    });
    logoTranslateY.value = withTiming(0, { 
      duration: 1000, 
      easing: Easing.bezier(0.16, 1, 0.3, 1) 
    });

    glowOpacity.value = withTiming(0.2, { duration: 1200 });
    glowScale.value = withTiming(1.4, { 
      duration: 1800, 
      easing: Easing.bezier(0.16, 1, 0.3, 1) 
    });

    // 2. Subtitle & Progress Bar Fade-in
    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    subtitleTranslateY.value = withDelay(400, withTiming(0, { 
      duration: 800, 
      easing: Easing.bezier(0.16, 1, 0.3, 1) 
    }));

    progressScale.value = withDelay(600, withTiming(1, { 
      duration: 1200, 
      easing: Easing.bezier(0.2, 0.8, 0.2, 1) 
    }));

    // 3. Exit animation
    containerOpacity.value = withDelay(
      2200,
      withTiming(0, { 
        duration: 500, 
        easing: Easing.bezier(0.33, 1, 0.68, 1) 
      }, (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
        }
      })
    );
    containerScale.value = withDelay(
      2200,
      withTiming(1.08, { 
        duration: 500, 
        easing: Easing.bezier(0.33, 1, 0.68, 1) 
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { translateY: logoTranslateY.value }
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progressScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.splashContainer, containerStyle]}>
      {/* Soft Radial Ambient Glow */}
      <Animated.View style={[styles.glowBall, glowStyle]} />

      <View style={styles.contentWrapper}>
        {/* Animated Brand Logo */}
        <Animated.View style={logoStyle}>
          <Image
            source={require('../../assets/logo/Acordell-Hor-icon-1536x746.png')}
            style={styles.splashLogo}
            contentFit="contain"
          />
        </Animated.View>

        {/* Brand Tagline */}
        <Animated.View style={[styles.taglineWrapper, subtitleStyle]}>
          <ThemedText style={styles.tagline}>PREMIUM QUALITY PRODUCTS</ThemedText>
        </Animated.View>

        {/* Minimalist Progress Loader */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, progressStyle]} />
        </View>
      </View>

      {/* Footer Branding */}
      <Animated.View style={[styles.footer, subtitleStyle]}>
        <ThemedText style={styles.footerText}>SECURE SHOPPING</ThemedText>
      </Animated.View>
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
          <Image style={styles.glow} source={require('../../assets/images/logo-glow.png')} />
        </Animated.View>
  
        <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
        <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
          <Image style={styles.image} source={require('../../assets/logo/site-logo.png')} />
        </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0a0b10',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  splashLogo: {
    width: 260,
    height: 120,
    maxWidth: '85%',
  },
  glowBall: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#818cf8',
    opacity: 0.15,
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  taglineWrapper: {
    marginTop: 12,
  },
  tagline: {
    fontSize: 10,
    letterSpacing: 4,
    color: '#94a3b8',
    fontWeight: '600',
    opacity: 0.8,
  },
  progressTrack: {
    width: 140,
    height: 2,
    backgroundColor: '#161824',
    borderRadius: 1,
    marginTop: 36,
    overflow: 'hidden',
  },
  progressBar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#818cf8',
    borderRadius: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    zIndex: 2,
  },
  footerText: {
    fontSize: 9,
    letterSpacing: 3,
    color: '#475569',
    fontWeight: '700',
  },
});
