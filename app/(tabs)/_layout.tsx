import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, FONT_SIZES, SHADOWS } from '@/constants/theme';
import { useCartStore } from '@/stores/useCartStore';

const TABS = [
  { name: 'index', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { name: 'search', label: 'Search', icon: 'search', iconOutline: 'search-outline' },
  { name: 'chat', label: 'Aria AI', icon: 'sparkles', iconOutline: 'sparkles-outline' },
  { name: 'cart', label: 'Cart', icon: 'bag', iconOutline: 'bag-outline' },
  { name: 'profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
] as const;

export default function TabLayout() {
  const { totalItems } = useCartStore();
  const cartCount = totalItems();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
      }}
      tabBar={(props) => <CustomTabBar {...props} cartCount={cartCount} />}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.icon : tab.iconOutline}
                size={tab.name === 'chat' ? 22 : 20}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

function CustomTabBar({ state, descriptors, navigation, cartCount }: any) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const tab = TABS[index];

        return (
          <TabBarItem
            key={route.key}
            tab={tab}
            focused={focused}
            cartCount={tab.name === 'cart' ? cartCount : 0}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
          />
        );
      })}
    </View>
  );
}

function TabBarItem({
  tab,
  focused,
  onPress,
  cartCount,
}: {
  tab: (typeof TABS)[number];
  focused: boolean;
  onPress: () => void;
  cartCount: number;
}) {
  const scale = useSharedValue(1);
  const dotScale = useSharedValue(focused ? 1 : 0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  React.useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.1, { damping: 8, stiffness: 300 }, () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      });
      dotScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    } else {
      dotScale.value = withSpring(0, { damping: 10, stiffness: 300 });
    }
  }, [focused]);

  const isAI = tab.name === 'chat';

  return (
    <Animated.View style={[styles.tabItem, animStyle]}>
      <View
        onTouchEnd={onPress}
        style={[styles.tabContent, isAI && styles.tabAI, focused && isAI && styles.tabAIActive]}
      >
        <Ionicons
          name={focused ? tab.icon : tab.iconOutline}
          size={isAI ? 22 : 20}
          color={focused ? (isAI ? '#fff' : COLORS.primary) : isAI ? COLORS.foreground : COLORS.muted}
        />
        {tab.name === 'cart' && cartCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
          </View>
        )}
      </View>
      {!isAI && (
        <Animated.View style={[styles.dot, dotStyle]} />
      )}
      {focused && (
        <Text style={styles.label}>{tab.label}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 10,
    paddingHorizontal: 8,
    ...SHADOWS.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabContent: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  tabAI: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabAIActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  label: {
    fontSize: 9,
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 8,
    color: '#fff',
    fontFamily: FONTS.bold,
  },
});
