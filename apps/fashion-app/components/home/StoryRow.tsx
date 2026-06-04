import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';
import type { Story } from '@/types';

interface StoryRowProps {
  stories: Story[];
}

const STORY_SIZE = 70;

export function StoryRow({ stories }: StoryRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {stories.map((story) => (
        <StoryItem key={story.id} story={story} />
      ))}
    </ScrollView>
  );
}

function StoryItem({ story }: { story: Story }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.storyItem} activeOpacity={0.9}>
      <Animated.View style={animStyle}>
        {/* Gradient ring */}
        <LinearGradient
          colors={story.hasNew ? [COLORS.primary, '#9B59B6', '#3B82F6'] : [COLORS.border, COLORS.border]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ring}
        >
          <View style={styles.ringInner}>
            <Image
              source={{ uri: story.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
        </LinearGradient>
        <Text style={styles.username} numberOfLines={1}>
          {story.username}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.base,
    gap: 12,
    paddingVertical: 4,
  },
  storyItem: {
    alignItems: 'center',
    gap: 6,
  },
  ring: {
    width: STORY_SIZE + 4,
    height: STORY_SIZE + 4,
    borderRadius: (STORY_SIZE + 4) / 2,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    backgroundColor: COLORS.background,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: STORY_SIZE - 4,
    height: STORY_SIZE - 4,
    borderRadius: (STORY_SIZE - 4) / 2,
  },
  username: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    maxWidth: STORY_SIZE + 8,
    textAlign: 'center',
  },
});
