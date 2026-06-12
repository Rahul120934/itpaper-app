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

export const MOCK_PAPERS: Paper[] = [
  {
    id: 'ad7724d1-5e87-4cac-9db3-4b854f2ccdbb',
    title: 'TWPE sem paper JAN 2026 RC19-20 TE',
    authors: ['Semester Exam Paper'],
    abstract: 'TWPE sem paper 2024 RC19-20 TE. Covers topics in Technical Writing, Professional Ethics, professional communication, and ethics codes in technology fields.',
    venue: 'RC 19-20 TWPE (JAN 2026).pdf (1.84 MB)',
    publish_year: 2026,
    pdf_url: 'https://gieiqpocinmqfmdpyggu.supabase.co/storage/v1/object/public/pdfs/1780917250756_RC%2019-20%20TWPE%20(JAN%202026).pdf',
    category: 'Technical Writing',
    created_at: '2026-06-08T11:14:14.839086+00:00',
  },
  {
    id: 'df7d3edc-d4a5-4f3b-b30c-557562eb7899',
    title: 'IPV sem paper NOV 2024 RC19-20 TE',
    authors: ['Semester Exam Paper'],
    abstract: 'IPV sem paper NOV 2024 RC19-20 TE. Focuses on digital Image Processing and Video Analytics, spatial filtering, histogram equalization, and edge detection.',
    venue: 'RC 19-20 IPV (DEC 2024).pdf (1.90 MB)',
    publish_year: 2024,
    pdf_url: 'https://gieiqpocinmqfmdpyggu.supabase.co/storage/v1/object/public/pdfs/1780914427553_RC%2019-20%20IPV%20(DEC%202024).pdf',
    category: 'Image Processing',
    created_at: '2026-06-08T10:27:11.560796+00:00',
  },
  {
    id: 'd9856885-0051-4be3-a15b-8258254b460d',
    title: 'AI sem paper 2024 RC19-20 TE',
    authors: ['Semester Exam Paper'],
    abstract: 'AI sem paper 2024 RC19-20 TE. Examines foundations of Artificial Intelligence including heuristic search, logic agents, neural network architectures, and machine learning methods.',
    venue: 'RC 19-20 AI (DEC 2024).pdf (1.87 MB)',
    publish_year: 2024,
    pdf_url: 'https://gieiqpocinmqfmdpyggu.supabase.co/storage/v1/object/public/pdfs/1780909831257_RC%2019-20%20AI%20(DEC%202024).pdf',
    category: 'Artificial Intelligence',
    created_at: '2026-06-08T09:10:34.886356+00:00',
  },
  {
    id: 'b309817f-0d62-402a-ae36-edb6b7831a39',
    title: 'IPV sem paper NOV 2025 RC19-20 TE',
    authors: ['Semester Exam Paper'],
    abstract: 'IPV sem paper NOV 2025 RC19-20 TE. Explores advanced image algorithms, morphologic operators, image segmentation, color models, and feature extractors.',
    venue: 'RC 19-20 IPV (DEC 2025).pdf (1.79 MB)',
    publish_year: 2025,
    pdf_url: 'https://gieiqpocinmqfmdpyggu.supabase.co/storage/v1/object/public/pdfs/1780914691307_RC%2019-20%20IPV%20(DEC%202025).pdf',
    category: 'Image Processing',
    created_at: '2026-06-08T10:31:34.6882+00:00',
  },
  {
    id: '73881f2d-7bdd-4ba2-b890-36062efb7a0a',
    title: 'Cloud Computing sem paper 2025 nov dec RC19-20 TE',
    authors: ['Semester Exam Paper'],
    abstract: 'cloud sem paper, cloud computing, cca, rc 19-20, RC 19-20. Covers virtualization architectures, resource scheduling, load balancing, and SLA requirements.',
    venue: 'RC 19-20 CCA (DEC 2025).pdf (1.77 MB)',
    publish_year: 2025,
    pdf_url: 'https://gieiqpocinmqfmdpyggu.supabase.co/storage/v1/object/public/pdfs/1780912256298_RC%2019-20%20CCA%20(DEC%202025).pdf',
    category: 'Cloud Computing',
    created_at: '2026-06-08T09:51:00.260713+00:00',
  },
  {
    id: '9e56fa8a-a240-477b-936d-7fc336150345',
    title: 'Data mining data warehousing sem paper 2024 TE',
    authors: ['Semester Exam Paper'],
    abstract: 'Data mining data warehousing sem paper 2024 TE. Covers DMDW concepts, association rules mining (Apriori), classification models (Decision Trees), and clustering.',
    venue: 'RC 19-20 DMDW (DEC 2024).pdf (1.83 MB)',
    publish_year: 2024,
    pdf_url: 'https://gieiqpocinmqfmdpyggu.supabase.co/storage/v1/object/public/pdfs/1780912910388_RC%2019-20%20DMDW%20(DEC%202024).pdf',
    category: 'Data Mining',
    created_at: '2026-06-08T10:01:54.57528+00:00',
  }
];

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
