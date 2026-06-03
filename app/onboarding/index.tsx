import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: '✦',
    gradient: ['#E91E8C', '#9B59B6'],
    title: 'Discover Your\nSignature Style',
    subtitle: 'AI-curated fashion that understands your unique taste, body type, and budget — all in one place.',
    accentColor: '#E91E8C',
  },
  {
    id: '2',
    icon: '◈',
    gradient: ['#9B59B6', '#3B82F6'],
    title: 'AI-Powered\nPersonal Stylist',
    subtitle: 'Meet Aria — your 24/7 fashion AI. Get real outfit advice, visual search, and style inspiration instantly.',
    accentColor: '#9B59B6',
  },
  {
    id: '3',
    icon: '⟡',
    gradient: ['#3B82F6', '#22C55E'],
    title: 'Seamless\nLuxury Shopping',
    subtitle: 'From discovery to doorstep in seconds. Smart size recommendations, one-tap checkout, and curated drops.',
    accentColor: '#3B82F6',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setOnboarded } = useAuthStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const progress = useSharedValue(0);

  const handleViewableChange = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) {
      const idx = viewableItems[0].index ?? 0;
      setActiveIndex(idx);
      progress.value = withTiming(idx, { duration: 300 });
    }
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOnboarded();
    router.replace('/quiz');
  };

  const handleSkip = () => {
    setOnboarded();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableChange}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SlideItem slide={item} index={index} progress={progress} />
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <DotIndicator key={i} index={i} progress={progress} />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.cta} onPress={handleNext} activeOpacity={0.85}>
          <View style={styles.ctaInner}>
            <Text style={styles.ctaText}>
              {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SlideItem({
  slide,
  index,
  progress,
}: {
  slide: (typeof SLIDES)[0];
  index: number;
  progress: Animated.SharedValue<number>;
}) {
  const iconStyle = useAnimatedStyle(() => {
    const inputRange = [index - 1, index, index + 1];
    const scale = interpolate(progress.value, inputRange, [0.6, 1, 0.6], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    const rotate = interpolate(progress.value, inputRange, [-30, 0, 30], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }, { rotate: `${rotate}deg` }] };
  });

  const textStyle = useAnimatedStyle(() => {
    const inputRange = [index - 1, index, index + 1];
    const opacity = interpolate(progress.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(progress.value, inputRange, [40, 0, -40], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Decorative orb */}
      <View style={[styles.orb, { backgroundColor: `${slide.accentColor}15` }]} />
      <View style={[styles.orbSmall, { backgroundColor: `${slide.accentColor}08` }]} />

      {/* Icon */}
      <Animated.View style={[styles.iconContainer, { backgroundColor: `${slide.accentColor}20` }, iconStyle]}>
        <Text style={[styles.icon, { color: slide.accentColor }]}>{slide.icon}</Text>
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

function DotIndicator({ index, progress }: { index: number; progress: Animated.SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const inputRange = [index - 1, index, index + 1];
    const width = interpolate(progress.value, inputRange, [6, 24, 6], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
    return { width, opacity };
  });

  return (
    <Animated.View style={[styles.dot, { backgroundColor: COLORS.primary }, style]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface2,
  },
  skipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    fontFamily: FONTS.medium,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['4xl'],
  },
  orb: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    top: -SCREEN_WIDTH * 0.2,
    right: -SCREEN_WIDTH * 0.2,
  },
  orbSmall: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: SCREEN_WIDTH * 0.25,
    bottom: SCREEN_WIDTH * 0.1,
    left: -SCREEN_WIDTH * 0.1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING['3xl'],
  },
  icon: {
    fontSize: 56,
  },
  textBlock: {
    alignItems: 'center',
    gap: 16,
  },
  slideTitle: {
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.foreground,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    lineHeight: 42,
  },
  slideSubtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['2xl'],
    gap: SPACING.xl,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  cta: {
    width: '100%',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  ctaText: {
    fontSize: FONT_SIZES.md,
    color: '#fff',
    fontFamily: FONTS.bold,
  },
});
