import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  venue: string;
  publish_year: number;
  pdf_url: string;
  category: string;
  created_at: string;
}


export const CATEGORIES = [
  'All',
  'Artificial Intelligence',
  'Image Processing',
  'Cloud Computing',
  'Data Mining',
  'Technical Writing',
  'Other'
];

const BOOKMARKS_STORAGE_KEY = '@examvault_local_bookmarks';

export async function getLocalBookmarks(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn('[getLocalBookmarks] Failed to read bookmarks from storage.');
    return [];
  }
}

export async function toggleLocalBookmark(paperId: string): Promise<boolean> {
  try {
    const current = await getLocalBookmarks();
    let updated: string[];
    let added = false;
    if (current.includes(paperId)) {
      updated = current.filter(id => id !== paperId);
    } else {
      updated = [...current, paperId];
      added = true;
    }
    await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
    return added;
  } catch (error) {
    console.warn('[toggleLocalBookmark] Failed to update bookmarks in storage.');
    return false;
  }
}
