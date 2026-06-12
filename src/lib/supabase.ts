import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Paper, getLocalBookmarks, toggleLocalBookmark } from './mockData';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate that URL is a legitimate HTTPS Supabase endpoint before creating the client
function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && isValidSupabaseUrl(supabaseUrl));

// Validate that a paper ID is a safe UUID-format string before using in queries
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// Validate URLs before opening externally (prevent javascript:, data:, etc.)
export function isValidPdfUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

// Sanitize error objects for logging — never log raw Supabase error objects
// which may contain internal query info, table schemas, or connection details.
function sanitizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Map user's existing Supabase "documents" schema to the app's "Paper" UI entity
export function mapDocumentToPaper(doc: any): Paper {
  // Extract publish year from name or keywords, fallback to uploaded_at year
  let year = new Date(doc.uploaded_at || Date.now()).getFullYear();
  
  if (doc.name) {
    const yearMatch = doc.name.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      year = parseInt(yearMatch[1], 10);
    }
  }
  
  if (year === new Date().getFullYear() && doc.keywords && Array.isArray(doc.keywords)) {
    for (const kw of doc.keywords) {
      if (/^\d{4}$/.test(kw)) {
        year = parseInt(kw, 10);
        break;
      }
    }
  }

  // Map keywords/name to category
  let category = 'Other';
  const nameLower = (doc.name || '').toLowerCase();
  const kwLower = (doc.keywords || []).map((k: string) => k.toLowerCase());
  
  const hasKeyword = (term: string) => 
    nameLower.includes(term) || kwLower.some((k: string) => k.includes(term));

  if (hasKeyword('twpe') || hasKeyword('ethics') || hasKeyword('technical writing')) {
    category = 'Technical Writing';
  } else if (hasKeyword('ipv') || hasKeyword('image processing') || hasKeyword('analytics')) {
    category = 'Image Processing';
  } else if (hasKeyword('ai') || hasKeyword('artificial intelligence')) {
    category = 'Artificial Intelligence';
  } else if (hasKeyword('cloud') || hasKeyword('cca') || hasKeyword('computing')) {
    category = 'Cloud Computing';
  } else if (hasKeyword('dmdw') || hasKeyword('mining') || hasKeyword('warehousing')) {
    category = 'Data Mining';
  }

  // Format file size
  const sizeMb = doc.file_size ? (doc.file_size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown Size';

  return {
    id: doc.id,
    title: doc.name || 'Untitled Document',
    authors: ['Semester Exam Paper'],
    abstract: doc.description || 'No description provided for this paper.',
    venue: `${doc.file_name || 'Document'} (${sizeMb})`,
    publish_year: year,
    pdf_url: doc.pdf_url || '',
    category: category,
    created_at: doc.uploaded_at || new Date().toISOString(),
  };
}

// Unified Data Access API
export async function getPapers(searchQuery = '', category = 'All'): Promise<Paper[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    // Fetch all documents from public.documents table
    const { data, error } = await supabase.from('documents').select('*');
    if (error) throw error;
    
    // Map documents to Paper UI models
    const mapped = (data || []).map(mapDocumentToPaper);
    
    // Filter locally for fast and dynamic search
    return filterPapers(mapped, searchQuery, category);
  } catch (error) {
    console.warn('[getPapers] Supabase fetch failed:', sanitizeError(error));
    return [];
  }
}

function filterPapers(papers: Paper[], searchQuery: string, category: string): Paper[] {
  let filtered = [...papers];
  if (category !== 'All') {
    filtered = filtered.filter(p => p.category === category);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        p.venue.toLowerCase().includes(q)
    );
  }
  return filtered;
}

export async function getPaperById(id: string): Promise<Paper | null> {
  // Validate ID format before querying
  if (!id || !isValidUUID(id)) {
    console.warn('[getPaperById] Invalid paper ID format.');
    return null;
  }

  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.from('documents').select('*').eq('id', id).single();
    if (error) throw error;
    return data ? mapDocumentToPaper(data) : null;
  } catch (error) {
    console.warn('[getPaperById] Supabase fetch failed:', sanitizeError(error));
    return null;
  }
}

// Keep bookmark storage local via AsyncStorage to respect "do not change schema of supabase"
export async function getBookmarks(): Promise<Paper[]> {
  const bookmarkedIds = await getLocalBookmarks();
  if (bookmarkedIds.length === 0) return [];

  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase.from('documents').select('*').in('id', bookmarkedIds);
    if (error) throw error;
    return (data || []).map(mapDocumentToPaper);
  } catch (error) {
    console.warn('[getBookmarks] Supabase fetch failed:', sanitizeError(error));
    return [];
  }
}

export async function isPaperBookmarked(paperId: string): Promise<boolean> {
  const bookmarkedIds = await getLocalBookmarks();
  return bookmarkedIds.includes(paperId);
}

export async function toggleBookmark(paperId: string): Promise<boolean> {
  return toggleLocalBookmark(paperId);
}
