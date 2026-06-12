import React from 'react';
import { View, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Link } from 'expo-router';
import { Bookmark, Calendar, MapPin } from 'lucide-react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { Paper } from '@/lib/mockData';

interface PaperCardProps {
  paper: Paper;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export function PaperCard({ paper, isBookmarked, onToggleBookmark }: PaperCardProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const formattedAuthors = paper.authors.slice(0, 3).join(', ') + (paper.authors.length > 3 ? ' et al.' : '');

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Link href={`/paper/${paper.id}`} asChild>
        <Pressable style={styles.pressable}>
          <View style={styles.header}>
            <View style={styles.categoryBadge}>
              <ThemedText type="smallBold" style={styles.categoryText}>
                {paper.category}
              </ThemedText>
            </View>
            <Pressable 
              onPress={(e) => {
                e.stopPropagation();
                onToggleBookmark();
              }}
              style={({ pressed }) => [
                styles.bookmarkButton,
                { backgroundColor: isBookmarked ? colors.backgroundSelected : 'transparent' },
                pressed && { opacity: 0.7 }
              ]}
            >
              <Bookmark
                size={18}
                color={isBookmarked ? '#F59E0B' : colors.textSecondary}
                fill={isBookmarked ? '#F59E0B' : 'none'}
              />
            </Pressable>
          </View>

          <ThemedText type="default" style={[styles.title, { fontWeight: '600' }]} numberOfLines={2}>
            {paper.title}
          </ThemedText>

          <ThemedText type="small" style={styles.authors} numberOfLines={1}>
            {formattedAuthors}
          </ThemedText>

          <ThemedText type="small" style={styles.abstract} numberOfLines={3}>
            {paper.abstract}
          </ThemedText>

          <View style={styles.footer}>
            <View style={styles.metaItem}>
              <MapPin size={12} color={colors.textSecondary} />
              <ThemedText type="small" style={styles.metaText} numberOfLines={1}>
                {paper.venue}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={12} color={colors.textSecondary} />
              <ThemedText type="small" style={styles.metaText}>
                {paper.publish_year}
              </ThemedText>
            </View>
          </View>
        </Pressable>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  pressable: {
    padding: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  categoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: Spacing.one / 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
  },
  categoryText: {
    color: '#3B82F6',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookmarkButton: {
    padding: Spacing.one,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: Spacing.one,
  },
  authors: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
    marginBottom: Spacing.two,
  },
  abstract: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
    marginBottom: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.08)',
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one / 2,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 11,
    opacity: 0.7,
  },
});
