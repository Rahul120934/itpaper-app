import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Home, Search, Bookmark, User } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          paddingBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            bottom: 24,
            left: 16,
            right: 16,
            elevation: 4,
            backgroundColor: isDark ? 'rgba(21, 22, 25, 0.92)' : 'rgba(255, 255, 255, 0.92)',
            borderRadius: 20,
            height: 64,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            paddingTop: 8,
            paddingBottom: 8,
          },
          default: {
            backgroundColor: isDark ? '#151619' : '#ffffff',
            height: 64,
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            paddingTop: 8,
            paddingBottom: 8,
          }
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Search color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Bookmarks',
          tabBarIcon: ({ color, focused }) => (
            <Bookmark color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      
      {/* Hide the details screen from the tab bar */}
      <Tabs.Screen
        name="paper/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
