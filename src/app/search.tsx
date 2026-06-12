import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, FlatList, TextInput, Pressable, View, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Search as SearchIcon, X, SlidersHorizontal, BookOpen } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PaperCard } from '@/components/paper-card';
import { getPapers, toggleBookmark, isPaperBookmarked } from '@/lib/supabase';
import { CATEGORIES, Paper } from '@/lib/mockData';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';

export default function SearchScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const performSearch = useCallback(async () => {
    try {
      setLoading(true);
      const results = await getPapers(query, selectedCategory);
      setPapers(results);

      // Get bookmark states
      const bookmarkStatus: Record<string, boolean> = {};
      for (const paper of results) {
        bookmarkStatus[paper.id] = await isPaperBookmarked(paper.id);
      }
      setBookmarkedIds(bookmarkStatus);
    } catch (error) {
      console.error('Failed search:', error);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory]);

  // Run search when query or category changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      performSearch();
    }, 300); // Debounce typing by 300ms

    return () => clearTimeout(delayDebounce);
  }, [query, selectedCategory, performSearch]);

  // Synchronize bookmark states when coming back to the screen
  useFocusEffect(
    useCallback(() => {
      performSearch();
    }, [performSearch])
  );

  const handleToggleBookmark = async (paperId: string) => {
    const isAdded = await toggleBookmark(paperId);
    setBookmarkedIds(prev => ({
      ...prev,
      [paperId]: isAdded
    }));
  };

  const clearSearch = () => {
    setQuery('');
  };

  const renderCategoryFilter = ({ item }: { item: string }) => {
    const isSelected = selectedCategory === item;
    return (
      <Pressable
        onPress={() => setSelectedCategory(item)}
        style={[
          styles.filterChip,
          {
            backgroundColor: isSelected ? colors.text : colors.backgroundSelected,
            borderColor: isSelected ? colors.text : 'rgba(128, 128, 128, 0.2)',
          },
        ]}
      >
        <ThemedText
          type="small"
          style={{
            color: isSelected ? colors.background : colors.text,
            fontWeight: isSelected ? '700' : '400',
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
        {/* Search Input Bar */}
        <View style={styles.searchHeader}>
          <View style={[styles.searchBarContainer, { backgroundColor: colors.backgroundElement }]}>
            <SearchIcon size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Search by title, abstract, authors..."
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={clearSearch} style={styles.clearButton}>
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
          
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            style={[
              styles.filterToggle,
              { backgroundColor: showFilters ? colors.text : colors.backgroundElement }
            ]}
          >
            <SlidersHorizontal
              size={20}
              color={showFilters ? colors.background : colors.text}
            />
          </Pressable>
        </View>

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <View style={styles.filterSection}>
            <ThemedText type="smallBold" style={styles.filterTitle}>
              Filter by Category
            </ThemedText>
            <FlatList
              data={CATEGORIES}
              renderItem={renderCategoryFilter}
              keyExtractor={item => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsContainer}
            />
          </View>
        )}

        {/* Results Info */}
        <View style={styles.resultsSummary}>
          <ThemedText type="small" style={styles.resultsSummaryText}>
            {loading ? 'Searching...' : `${papers.length} paper${papers.length === 1 ? '' : 's'} found`}
          </ThemedText>
        </View>

        {/* Results Feed */}
        {loading && papers.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.text} />
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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <BookOpen size={48} color={colors.textSecondary} style={styles.emptyIcon} />
                <ThemedText type="default" style={{ fontWeight: '600' }}>No papers match your search</ThemedText>
                <ThemedText type="small" style={styles.emptySubtitle}>
                  Try adjusting keywords or selecting a different category.
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
  },
  searchIcon: {
    marginRight: Spacing.one,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  clearButton: {
    padding: Spacing.one,
  },
  filterToggle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSection: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  filterTitle: {
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  filterChipsContainer: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  resultsSummary: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  resultsSummaryText: {
    fontSize: 12,
    opacity: 0.5,
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
