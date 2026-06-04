import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useStyleProfileStore } from '@/stores/useStyleProfileStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';
import type { BodyType, StyleType, ColorPalette, BudgetRange } from '@/types';
import { BRANDS } from '@/constants/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QUESTIONS = [
  {
    id: 'bodyType',
    step: 1,
    title: 'What\'s your\nbody shape?',
    subtitle: 'We\'ll recommend the most flattering cuts for you',
    type: 'single',
    options: [
      { value: 'hourglass', label: 'Hourglass', emoji: '⌛', desc: 'Balanced bust & hips' },
      { value: 'pear', label: 'Pear', emoji: '🍐', desc: 'Wider hips than bust' },
      { value: 'apple', label: 'Apple', emoji: '🍎', desc: 'Fuller midsection' },
      { value: 'rectangle', label: 'Rectangle', emoji: '▭', desc: 'Similar measurements' },
      { value: 'inverted-triangle', label: 'Inverted Triangle', emoji: '▽', desc: 'Broader shoulders' },
    ],
  },
  {
    id: 'style',
    step: 2,
    title: 'Your style\nvibe?',
    subtitle: 'Pick all that resonate with you',
    type: 'multi',
    options: [
      { value: 'casual', label: 'Casual', emoji: '👕' },
      { value: 'minimalist', label: 'Minimalist', emoji: '◻' },
      { value: 'streetwear', label: 'Streetwear', emoji: '🧢' },
      { value: 'formal', label: 'Formal', emoji: '👔' },
      { value: 'bohemian', label: 'Bohemian', emoji: '🌸' },
      { value: 'vintage', label: 'Vintage', emoji: '📻' },
      { value: 'romantic', label: 'Romantic', emoji: '🌹' },
      { value: 'athleisure', label: 'Athleisure', emoji: '🏃' },
    ],
  },
  {
    id: 'palette',
    step: 3,
    title: 'Favourite\ncolor palette?',
    subtitle: 'This shapes your AI style feed',
    type: 'single',
    options: [
      { value: 'neutral', label: 'Neutrals', emoji: '🤍', desc: 'Beige, white, grey, black' },
      { value: 'warm', label: 'Warm Tones', emoji: '🧡', desc: 'Rust, terracotta, amber' },
      { value: 'cool', label: 'Cool Tones', emoji: '💙', desc: 'Blue, lavender, sage' },
      { value: 'bold', label: 'Bold & Bright', emoji: '🌈', desc: 'Vivid, statement colors' },
      { value: 'pastel', label: 'Pastels', emoji: '🌸', desc: 'Soft, dreamy hues' },
      { value: 'earthy', label: 'Earthy', emoji: '🌿', desc: 'Olive, brown, forest' },
    ],
  },
  {
    id: 'budget',
    step: 4,
    title: 'Your style\nbudget?',
    subtitle: 'We\'ll curate picks that match your spend',
    type: 'single',
    options: [
      { value: 'budget', label: 'Budget Savvy', emoji: '💰', desc: 'Under $50 per item' },
      { value: 'mid-range', label: 'Mid-Range', emoji: '💳', desc: '$50–$200 per item' },
      { value: 'premium', label: 'Premium', emoji: '✨', desc: '$200–$500 per item' },
      { value: 'luxury', label: 'Luxury', emoji: '👑', desc: '$500+ per item' },
    ],
  },
  {
    id: 'brands',
    step: 5,
    title: 'Favourite\nbrands?',
    subtitle: 'Select your go-to labels',
    type: 'multi-brands',
    options: BRANDS.slice(0, 12).map((b) => ({ value: b, label: b, emoji: '🏷' })),
  },
];

export default function QuizScreen() {
  const router = useRouter();
  const { setBodyType, toggleStyle, setColorPalette, setBudgetRange, toggleBrand, completeQuiz, profile } = useStyleProfileStore();
  const { setQuizCompleted } = useAuthStore();
  const [step, setStep] = useState(0);
  const [multiSelected, setMultiSelected] = useState<Record<string, string[]>>({});

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const cardScale = useSharedValue(1);

  const question = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  const animateNext = (forward = true) => {
    opacity.value = withTiming(0, { duration: 200 });
    translateX.value = withTiming(forward ? -50 : 50, { duration: 200 }, () => {
      runOnJS(setStep)(forward ? step + 1 : Math.max(0, step - 1));
      translateX.value = forward ? 50 : -50;
      opacity.value = withTiming(1, { duration: 300 });
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
    });
  };

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: cardScale.value }],
  }));

  const handleSelect = async (value: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = question;

    if (q.type === 'single') {
      if (q.id === 'bodyType') setBodyType(value as BodyType);
      else if (q.id === 'palette') setColorPalette(value as ColorPalette);
      else if (q.id === 'budget') setBudgetRange(value as BudgetRange);
      setTimeout(() => animateNext(), 300);
    } else {
      // multi select — toggle
      setMultiSelected((prev) => {
        const current = prev[q.id] ?? [];
        return {
          ...prev,
          [q.id]: current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value],
        };
      });
    }
  };

  const handleContinue = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const q = question;
    const selected = multiSelected[q.id] ?? [];

    if (q.id === 'style') selected.forEach((s) => toggleStyle(s as StyleType));
    if (q.id === 'brands') selected.forEach((b) => toggleBrand(b));

    if (isLast) {
      completeQuiz();
      setQuizCompleted();
      router.replace('/(tabs)');
    } else {
      animateNext();
    }
  };

  const isSelected = (value: string) => {
    if (question.type === 'single') return false; // handled per option press
    return (multiSelected[question.id] ?? []).includes(value);
  };

  const progress = ((step + 1) / QUESTIONS.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {step > 0 && (
          <TouchableOpacity onPress={() => animateNext(false)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.foreground} />
          </TouchableOpacity>
        )}
        <View style={styles.progressContainer}>
          <View style={styles.progressBg}>
            <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{step + 1} / {QUESTIONS.length}</Text>
        </View>
      </View>

      {/* Question */}
      <Animated.View style={[styles.questionBlock, cardAnimStyle]}>
        <Text style={styles.stepLabel}>STEP {question.step}</Text>
        <Text style={styles.title}>{question.title}</Text>
        <Text style={styles.subtitle}>{question.subtitle}</Text>
      </Animated.View>

      {/* Options */}
      <ScrollView
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {question.options.map((opt) => {
          const selected = isSelected(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => handleSelect(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
                {'desc' in opt && opt.desc && (
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                )}
              </View>
              {selected && (
                <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Multi-select Continue */}
      {(question.type === 'multi' || question.type === 'multi-brands') && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.continueText}>
              {isLast ? 'Finish & Explore ✦' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: { flex: 1, gap: 6 },
  progressBg: {
    height: 4,
    backgroundColor: COLORS.surface2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.medium },
  questionBlock: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.lg,
    gap: 8,
  },
  stepLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.foreground,
    fontFamily: FONTS.bold,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  optionsContainer: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING['3xl'],
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  optionEmoji: { fontSize: 24 },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: FONT_SIZES.base,
    color: COLORS.foreground,
    fontFamily: FONTS.semiBold,
  },
  optionLabelSelected: { color: COLORS.primary },
  optionDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    gap: 8,
  },
  continueText: { fontSize: FONT_SIZES.md, color: '#fff', fontFamily: FONTS.bold },
});
