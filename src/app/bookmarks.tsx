import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, View, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Bookmark, BookmarkOff } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PaperCard } from '@/components/paper-card';
import { getBookmarks, toggleBookmark } from '@/lib/supabase';
import { Paper } from '@/lib/mockData';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';

export default function BookmarksScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [bookmarks, setBookmarks] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarkedPapers = useCallback(async () => {
    try {
      setLoading(true);
      const bookmarked = await getBookmarks();
      setBookmarks(bookmarked);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBookmarkedPapers();
    }, [fetchBookmarkedPapers])
  );

  const handleRemoveBookmark = async (paperId: string) => {
    await toggleBookmark(paperId);
    // Optimistically remove from UI
    setBookmarks(prev => prev.filter(p => p.id !== paperId));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Bookmarks
          </ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            Your saved research publications
          </ThemedText>
        </View>

        {/* Bookmarks List */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.text} />
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <PaperCard
                paper={item}
                isBookmarked={true} // Since it's in Bookmarks screen, they are all bookmarked
                onToggleBookmark={() => handleRemoveBookmark(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <BookmarkOff size={48} color={colors.textSecondary} style={styles.emptyIcon} />
                <ThemedText type="default" style={{ fontWeight: '600' }}>No Bookmarks Saved</ThemedText>
                <ThemedText type="small" style={styles.emptySubtitle}>
                  Papers you bookmark will appear here for offline reading and quick access.
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 2,
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 96,
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
