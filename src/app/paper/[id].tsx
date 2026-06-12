import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, Alert, Clipboard, useColorScheme, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ArrowLeft, Bookmark, ExternalLink, Calendar, MapPin, Share2, Clipboard as CopyIcon, Check, Download } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getPaperById, toggleBookmark, isPaperBookmarked, isValidPdfUrl } from '@/lib/supabase';
import { Paper } from '@/lib/mockData';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';

export default function PaperDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [paper, setPaper] = useState<Paper | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedBib, setCopiedBib] = useState(false);
  const [copiedApa, setCopiedApa] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadPaperDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getPaperById(id);
      if (data) {
        setPaper(data);
        const bookmarked = await isPaperBookmarked(id);
        setIsBookmarked(bookmarked);
      }
    } catch (error) {
      console.error('Failed to load paper details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPaperDetails();
  }, [loadPaperDetails]);

  const handleToggleBookmark = async () => {
    if (!paper) return;
    const added = await toggleBookmark(paper.id);
    setIsBookmarked(added);
  };

  const handleOpenPDF = async () => {
    if (!paper?.pdf_url) return;
    // Validate URL protocol before opening to prevent javascript:/data: injection
    if (!isValidPdfUrl(paper.pdf_url)) {
      Alert.alert('Invalid URL', 'This document has an invalid or unsafe URL and cannot be opened.');
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(paper.pdf_url);
    } catch (error) {
      Alert.alert('Error', 'Could not open PDF viewer.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!paper?.pdf_url) return;
    if (!isValidPdfUrl(paper.pdf_url)) {
      Alert.alert('Invalid URL', 'This document has an invalid or unsafe URL and cannot be downloaded.');
      return;
    }

    try {
      setDownloading(true);
      // Create a safe filename from the paper title
      const safeName = paper.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').substring(0, 50);
      const fileName = `${safeName}.pdf`;

      // Use the SDK 56 DownloadTask API
      const destFile = new FileSystem.File(FileSystem.Paths.document, fileName);
      const task = new FileSystem.DownloadTask(paper.pdf_url, destFile);
      const downloadedFile = await task.downloadAsync();

      if (!downloadedFile) {
        Alert.alert('Download Failed', 'Could not download the PDF. Please try again.');
        return;
      }

      // Share/save the downloaded file
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(downloadedFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Save ${paper.title}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Downloaded', 'PDF saved successfully.');
      }
    } catch (error) {
      Alert.alert('Download Error', 'Failed to download the PDF. Please check your connection and try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!paper) return;
    try {
      await Share.share({
        title: paper.title,
        message: `Check out this research paper: "${paper.title}"\nRead here: ${paper.pdf_url}`,
      });
    } catch (error: any) {
      console.error('Error sharing:', error);
    }
  };

  // Generate Citations
  const getBibTeX = () => {
    if (!paper) return '';
    const leadAuthor = paper.authors[0] || 'author';
    const citeKey = (leadAuthor.split(' ').pop() || 'author').toLowerCase() + paper.publish_year;
    const authorsStr = paper.authors.join(' and ');
    return `@article{${citeKey},\n  title={${paper.title}},\n  author={${authorsStr}},\n  journal={${paper.venue}},\n  year={${paper.publish_year}}\n}`;
  };

  const getAPA = () => {
    if (!paper) return '';
    const authorsStr = paper.authors.map((a, i) => {
      const parts = a.split(' ');
      const lastName = parts.pop();
      const initials = parts.map(p => p[0] + '.').join(' ');
      return `${lastName}, ${initials}`;
    });

    let authorList = '';
    if (authorsStr.length === 1) authorList = authorsStr[0];
    else if (authorsStr.length === 2) authorList = `${authorsStr[0]} & ${authorsStr[1]}`;
    else authorList = authorsStr.slice(0, -1).join(', ') + `, & ${authorsStr[authorsStr.length - 1]}`;

    return `${authorList} (${paper.publish_year}). ${paper.title}. ${paper.venue}.`;
  };

  const copyToClipboard = (text: string, type: 'bib' | 'apa') => {
    Clipboard.setString(text);
    if (type === 'bib') {
      setCopiedBib(true);
      setTimeout(() => setCopiedBib(false), 2000);
    } else {
      setCopiedApa(true);
      setTimeout(() => setCopiedApa(false), 2000);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.text} />
        <ThemedText type="small" style={{ marginTop: Spacing.two, opacity: 0.6 }}>
          Loading paper details...
        </ThemedText>
      </ThemedView>
    );
  }

  if (!paper) {
    return (
      <ThemedView style={styles.loaderContainer}>
        <ThemedText type="default" style={{ fontWeight: '600' }}>Paper Not Found</ThemedText>
        <Pressable 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }} 
          style={styles.backButton}
        >
          <ThemedText type="smallBold" style={{ color: '#3B82F6' }}>
            Go Back
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }} 
            style={styles.iconButton}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <View style={styles.navBarActions}>
            <Pressable onPress={handleShare} style={styles.iconButton}>
              <Share2 size={20} color={colors.text} />
            </Pressable>
            <Pressable onPress={handleToggleBookmark} style={styles.iconButton}>
              <Bookmark
                size={20}
                color={isBookmarked ? '#F59E0B' : colors.text}
                fill={isBookmarked ? '#F59E0B' : 'none'}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Category Chip */}
          <View style={styles.categoryBadge}>
            <ThemedText type="smallBold" style={styles.categoryText}>
              {paper.category}
            </ThemedText>
          </View>

          {/* Title */}
          <ThemedText type="title" style={styles.title}>
            {paper.title}
          </ThemedText>

          {/* Authors */}
          <ThemedText type="default" style={[styles.authors, { fontWeight: '600' }]}>
            {paper.authors.join(', ')}
          </ThemedText>

          {/* Meta Information */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={colors.textSecondary} />
              <ThemedText type="small" style={styles.metaText}>
                {paper.venue}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={14} color={colors.textSecondary} />
              <ThemedText type="small" style={styles.metaText}>
                {paper.publish_year}
              </ThemedText>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            <Pressable onPress={handleOpenPDF} style={[styles.actionButton, styles.primaryActionButton]}>
              <ExternalLink size={16} color="#ffffff" />
              <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                Read PDF
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleDownloadPDF}
              disabled={downloading}
              style={[styles.actionButton, styles.downloadActionButton, { borderColor: colors.text }]}
            >
              {downloading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Download size={16} color={colors.text} />
                  <ThemedText type="smallBold">
                    Download PDF
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>

          {/* Abstract Section */}
          <View style={styles.section}>
            <ThemedText type="default" style={[styles.sectionTitle, { fontWeight: '700' }]}>
              Abstract
            </ThemedText>
            <ThemedText type="default" style={styles.abstractText}>
              {paper.abstract}
            </ThemedText>
          </View>

          {/* Citations Section */}
          <View style={styles.section}>
            <ThemedText type="default" style={[styles.sectionTitle, { fontWeight: '700' }]}>
              Cite this Publication
            </ThemedText>
            
            {/* APA Citation */}
            <ThemedView type="backgroundElement" style={styles.citationBox}>
              <View style={styles.citationHeader}>
                <ThemedText type="smallBold" style={styles.citationFormatName}>APA FORMAT</ThemedText>
                <Pressable
                  onPress={() => copyToClipboard(getAPA(), 'apa')}
                  style={styles.copyButton}
                >
                  {copiedApa ? (
                    <>
                      <Check size={14} color="#10B981" />
                      <ThemedText type="small" style={{ color: '#10B981', fontWeight: 'bold' }}>Copied</ThemedText>
                    </>
                  ) : (
                    <>
                      <CopyIcon size={14} color={colors.textSecondary} />
                      <ThemedText type="small" style={{ color: colors.textSecondary }}>Copy</ThemedText>
                    </>
                  )}
                </Pressable>
              </View>
              <ThemedText type="small" style={styles.citationContent}>
                {getAPA()}
              </ThemedText>
            </ThemedView>

            {/* BibTeX Citation */}
            <ThemedView type="backgroundElement" style={[styles.citationBox, { marginTop: Spacing.two }]}>
              <View style={styles.citationHeader}>
                <ThemedText type="smallBold" style={styles.citationFormatName}>BIBTEX FORMAT</ThemedText>
                <Pressable
                  onPress={() => copyToClipboard(getBibTeX(), 'bib')}
                  style={styles.copyButton}
                >
                  {copiedBib ? (
                    <>
                      <Check size={14} color="#10B981" />
                      <ThemedText type="small" style={{ color: '#10B981', fontWeight: 'bold' }}>Copied</ThemedText>
                    </>
                  ) : (
                    <>
                      <CopyIcon size={14} color={colors.textSecondary} />
                      <ThemedText type="small" style={{ color: colors.textSecondary }}>Copy</ThemedText>
                    </>
                  )}
                </Pressable>
              </View>
              <ThemedText type="code" style={styles.bibtexCode}>
                {getBibTeX()}
              </ThemedText>
            </ThemedView>
          </View>
        </ScrollView>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginTop: Spacing.three,
    padding: Spacing.two,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.08)',
  },
  navBarActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  iconButton: {
    padding: Spacing.two,
    borderRadius: 10,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six * 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: Spacing.one / 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
    marginBottom: Spacing.two,
  },
  categoryText: {
    color: '#3B82F6',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  authors: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: Spacing.three,
    lineHeight: 20,
  },
  metaRow: {
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  metaText: {
    fontSize: 13,
    opacity: 0.7,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionButton: {
    backgroundColor: '#3B82F6',
  },
  downloadActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  section: {
    marginTop: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.08)',
    paddingTop: Spacing.three,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  abstractText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.85,
  },
  citationBox: {
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  citationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  citationFormatName: {
    fontSize: 10,
    letterSpacing: 0.5,
    opacity: 0.5,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  citationContent: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  bibtexCode: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
});
