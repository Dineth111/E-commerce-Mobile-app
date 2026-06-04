import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '@/constants/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({ width = '100%', height = 16, borderRadius = RADIUS.md, style }: SkeletonLoaderProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: COLORS.surface3, opacity },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <SkeletonLoader height={200} borderRadius={RADIUS.lg} />
      <View style={{ padding: 10 }}>
        <SkeletonLoader height={12} width="60%" style={{ marginBottom: 6 }} />
        <SkeletonLoader height={14} width="85%" style={{ marginBottom: 6 }} />
        <SkeletonLoader height={12} width="40%" />
      </View>
    </View>
  );
}

export function ChatBubbleSkeleton() {
  return (
    <View style={{ marginVertical: 8, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <SkeletonLoader width={32} height={32} borderRadius={16} />
        <View style={{ gap: 6, flex: 1 }}>
          <SkeletonLoader height={14} width="80%" />
          <SkeletonLoader height={14} width="65%" />
          <SkeletonLoader height={14} width="50%" />
        </View>
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
});
