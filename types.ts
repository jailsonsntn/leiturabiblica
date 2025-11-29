
export interface DailyEntry {
  id: number;
  dateStr: string; // YYYY-MM-DD
  displayDate: string; // e.g., "01 de Janeiro"
  title: string;
  
  // Reading Plan Specifics
  bookName: string; // e.g. "Gênesis"
  startChapter: number;
  endChapter: number;
  chaptersToRead: number[]; // Array of chapter numbers e.g. [1, 2, 3]
  readingPlanRange: string;
  
  verseReference: string;
  verseText: string;
  devotional: string;
  playlistTitle: string;
  playlistUrl: string;
  imageUrl: string;
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  daysRequired: number;
  iconName: 'star' | 'flame' | 'award' | 'crown';
}

export interface ReadingPlan {
  id: string;
  label: string;
  description: string;
  days: number;
  books: string[]; // List of book names included
}

export interface CustomPlanConfig {
  bookName: string;
  days: number;
}

export interface UserProgress {
  completedIds: number[]; // IDs concluidos do contexto ATUAL
  allProgress: Record<string, number[]>; // Histórico completo: { 'custom_Gênesis': [1,2], 'whole_bible': [5] }
  notes: Record<number, string>;
  lastAccessDate: string | null;
  streak: number;
  unlockedBadges: string[]; // IDs dos badges conquistados
  planStartDate: string; // "YYYY-MM-DD" - Default Jan 1st
  selectedPlanId: string; // ID of the current reading plan
  customPlanConfig?: CustomPlanConfig; // Configuration for custom plan
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export enum ViewState {
  HOME = 'HOME',
  CALENDAR = 'CALENDAR',
  STATS = 'STATS',
  SETTINGS = 'SETTINGS'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
