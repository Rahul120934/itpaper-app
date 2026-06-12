import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, ScrollView, Pressable, View, ActivityIndicator, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, Link } from 'expo-router';
import { Database, AlertTriangle, Cpu, HelpCircle } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PaperCard } from '@/components/paper-card';
import { getPapers, isSupabaseConfigured, toggleBookmark, isPaperBookmarked } from '@/lib/supabase';
import { CATEGORIES, Paper } from '@/lib/mockData';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [papers, setPapers] = useState<Paper[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPapers('', selectedCategory);
      setPapers(data);

      // Fetch bookmark statuses
      const bookmarkStatus: Record<string, boolean> = {};
      for (const paper of data) {
        bookmarkStatus[paper.id] = await isPaperBookmarked(paper.id);
      }
      setBookmarkedIds(bookmarkStatus);
    } catch (error) {
      console.error('Failed to load papers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  // Refetch data when screen comes into focus to ensure bookmarks and changes are updated
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleBookmark = async (paperId: string) => {
    const isAdded = await toggleBookmark(paperId);
    setBookmarkedIds(prev => ({
      ...prev,
      [paperId]: isAdded
    }));
  };

  const renderCategoryChip = ({ item }: { item: string }) => {
    const isSelected = selectedCategory === item;
    return (
      <Pressable
        onPress={() => setSelectedCategory(item)}
        style={[
          styles.chip,
          {
            backgroundColor: isSelected
              ? colors.text
              : colors.backgroundElement,
          },
        ]}
      >
        <ThemedText
          type="smallBold"
          style={{
            color: isSelected ? colors.background : colors.text,
          }}
        >
          {item}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.appName}>
              ExamVault
            </ThemedText>
            <ThemedText type="small" style={styles.subtitle}>
              Browse & read computer science papers
            </ThemedText>
          </View>

        </View>

        {/* Horizontal Category Selector */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategoryChip}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Paper Feed */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.text} />
            <ThemedText type="small" style={styles.loaderText}>
              Fetching latest publications...
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={papers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <PaperCard
                paper={item}
                isBookmarked={!!bookmarkedIds[item.id]}
                onToggleBookmark={() => handleToggleBookmark(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.text}
                colors={[colors.text]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <HelpCircle size={48} color={colors.textSecondary} style={styles.emptyIcon} />
                <ThemedText type="default" style={{ fontWeight: '600' }}>No Papers Found</ThemedText>
                <ThemedText type="small" style={styles.emptySubtitle}>
                  Try selecting a different category or refreshing the feed.
                </ThemedText>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 2,
  },
  statusBadgeWrapper: {
    alignSelf: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoriesContainer: {
    marginBottom: Spacing.two,
  },
  categoriesList: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  loaderText: {
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: Spacing.four,
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: Spacing.three,
    opacity: 0.5,
  },
  emptySubtitle: {
    opacity: 0.6,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
});
