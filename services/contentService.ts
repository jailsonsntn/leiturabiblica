import { DailyEntry } from '../types';
import { MOCK_PLAYLISTS, BIBLE_IMAGES, READING_PLANS } from '../constants';
import { format, addDays, differenceInCalendarDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Dados dos livros e quantidade de capítulos
export const BIBLE_BOOKS = [
  { name: "Gênesis", chapters: 50 }, { name: "Êxodo", chapters: 40 }, { name: "Levítico", chapters: 27 },
  { name: "Números", chapters: 36 }, { name: "Deuteronômio", chapters: 34 }, { name: "Josué", chapters: 24 },
  { name: "Juízes", chapters: 21 }, { name: "Rute", chapters: 4 }, { name: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", chapters: 24 }, { name: "1 Reis", chapters: 22 }, { name: "2 Reis", chapters: 25 },
  { name: "1 Crônicas", chapters: 29 }, { name: "2 Crônicas", chapters: 36 }, { name: "Esdras", chapters: 10 },
  { name: "Neemias", chapters: 13 }, { name: "Ester", chapters: 10 }, { name: "Jó", chapters: 42 },
  { name: "Salmos", chapters: 150 }, { name: "Provérbios", chapters: 31 }, { name: "Eclesiastes", chapters: 12 },
  { name: "Cânticos", chapters: 8 }, { name: "Isaías", chapters: 66 }, { name: "Jeremias", chapters: 52 },
  { name: "Lamentações", chapters: 5 }, { name: "Ezequiel", chapters: 48 }, { name: "Daniel", chapters: 12 },
  { name: "Oseias", chapters: 14 }, { name: "Joel", chapters: 3 }, { name: "Amós", chapters: 9 },
  { name: "Obadias", chapters: 1 }, { name: "Jonas", chapters: 4 }, { name: "Miqueias", chapters: 7 },
  { name: "Naum", chapters: 3 }, { name: "Habacuque", chapters: 3 }, { name: "Sofonias", chapters: 3 },
  { name: "Ageu", chapters: 2 }, { name: "Zacarias", chapters: 14 }, { name: "Malaquias", chapters: 4 },
  { name: "Mateus", chapters: 28 }, { name: "Marcos", chapters: 16 }, { name: "Lucas", chapters: 24 },
  { name: "João", chapters: 21 }, { name: "Atos", chapters: 28 }, { name: "Romanos", chapters: 16 },
  { name: "1 Coríntios", chapters: 16 }, { name: "2 Coríntios", chapters: 13 }, { name: "Gálatas", chapters: 6 },
  { name: "Efésios", chapters: 6 }, { name: "Filipenses", chapters: 4 }, { name: "Colossenses", chapters: 4 },
  { name: "1 Tessalonicenses", chapters: 5 }, { name: "2 Tessalonicenses", chapters: 3 }, { name: "1 Timóteo", chapters: 6 },
  { name: "2 Timóteo", chapters: 4 }, { name: "Tito", chapters: 3 }, { name: "Filemom", chapters: 1 },
  { name: "Hebreus", chapters: 13 }, { name: "Tiago", chapters: 5 }, { name: "1 Pedro", chapters: 5 },
  { name: "2 Pedro", chapters: 3 }, { name: "1 João", chapters: 5 }, { name: "2 João", chapters: 1 },
  { name: "3 João", chapters: 1 }, { name: "Judas", chapters: 1 }, { name: "Apocalipse", chapters: 22 }
];

// Helper to parse "YYYY-MM-DD" as local midnight date (prevents UTC offset issues)
const parseLocalYMD = (ymd: string): Date => {
  if (!ymd) return new Date();
  const parts = ymd.split('-');
  if (parts.length !== 3) return new Date(ymd);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed for JS Date
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

/**
 * Calculates which "Plan Day" (1-365) a specific date corresponds to,
 * given the user's custom start date.
 */
export const getPlanDayFromDate = (targetDate: Date, startDateStr: string): number => {
  const start = startOfDay(parseLocalYMD(startDateStr));
  const target = startOfDay(targetDate);
  // Difference in days + 1 because day 0 diff is Day 1 of plan
  return differenceInCalendarDays(target, start) + 1;
};

// Helper to find Book and Chapter from a cumulative chapter number within a specific list of books
const getBookAndChapterFromList = (cumulativeChapter: number, bookList: typeof BIBLE_BOOKS) => {
  let remaining = cumulativeChapter;
  for (const book of bookList) {
    if (remaining <= book.chapters) {
      return { bookName: book.name, chapter: remaining };
    }
    remaining -= book.chapters;
  }
  const lastBook = bookList[bookList.length - 1];
  return { bookName: lastBook.name, chapter: lastBook.chapters };
};

export const getEntryForDay = (dayOfPlan: number, startDateStr?: string, planId: string = 'whole_bible'): DailyEntry => {
  // 1. Determine Plan Config
  const plan = READING_PLANS.find(p => p.id === planId) || READING_PLANS[0];
  const maxDays = plan.days;
  
  // Clamp day
  const safeDay = Math.max(1, Math.min(maxDays, dayOfPlan));

  // 2. Filter Books based on Plan
  let activeBooks = BIBLE_BOOKS;
  if (plan.books.length > 0) {
    activeBooks = BIBLE_BOOKS.filter(b => plan.books.includes(b.name));
  }

  // 3. Calculate Totals for this specific plan
  const totalChaptersInPlan = activeBooks.reduce((sum, book) => sum + book.chapters, 0);

  // 4. Calculate Content Range
  // Calculate chapters per day based on THIS plan's length
  const chaptersPerDay = totalChaptersInPlan / maxDays;
  const startCumulative = Math.floor((safeDay - 1) * chaptersPerDay) + 1;
  const endCumulative = Math.floor(safeDay * chaptersPerDay);
  
  // Ensure we don't exceed total
  const safeEndCumulative = Math.min(endCumulative, totalChaptersInPlan);
  // Ensure start doesn't exceed total (edge case on last day)
  const safeStartCumulative = Math.min(startCumulative, totalChaptersInPlan);
  // If calculation makes end < start (rare float issue), fix it
  const finalEndCumulative = Math.max(safeEndCumulative, safeStartCumulative);

  const startInfo = getBookAndChapterFromList(safeStartCumulative, activeBooks);
  const endInfo = getBookAndChapterFromList(finalEndCumulative, activeBooks);

  let chaptersToRead: number[] = [];
  let readingPlanRange = "";

  if (startInfo.bookName === endInfo.bookName) {
    readingPlanRange = `${startInfo.bookName} ${startInfo.chapter}-${endInfo.chapter}`;
    for (let i = startInfo.chapter; i <= endInfo.chapter; i++) {
      chaptersToRead.push(i);
    }
  } else {
    readingPlanRange = `${startInfo.bookName} ${startInfo.chapter} - ${endInfo.bookName} ${endInfo.chapter}`;
    // Simplified logic for multi-book reading in one day:
    // Just show start chapter as primary action for simplicity in this MVP
    // Ideally we would list all chapters across books
    chaptersToRead = [startInfo.chapter]; 
  }

  // 5. Calculate Date Display
  let dateObj = new Date();
  if (startDateStr) {
    const start = parseLocalYMD(startDateStr);
    dateObj = addDays(start, safeDay - 1);
  } else {
    dateObj = addDays(new Date(2026, 0, 1), safeDay - 1);
  }

  // 6. Assets
  const playlist = MOCK_PLAYLISTS[(safeDay - 1) % MOCK_PLAYLISTS.length];
  const image = BIBLE_IMAGES[(safeDay - 1) % BIBLE_IMAGES.length];

  return {
    id: safeDay, 
    dateStr: format(dateObj, 'yyyy-MM-dd'),
    displayDate: format(dateObj, "dd 'de' MMMM", { locale: ptBR }),
    title: `Dia ${safeDay}`,
    bookName: startInfo.bookName,
    startChapter: startInfo.chapter,
    endChapter: endInfo.chapter,
    chaptersToRead: chaptersToRead.length > 0 ? chaptersToRead : [startInfo.chapter],
    readingPlanRange: readingPlanRange,
    verseReference: `${startInfo.bookName} ${startInfo.chapter}:1`,
    verseText: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", 
    devotional: `Seguindo o plano "${plan.label}". Ao ler ${startInfo.bookName}, observe o contexto histórico e espiritual. Que a leitura de hoje renove sua mente.`,
    playlistTitle: playlist.title,
    playlistUrl: playlist.url,
    imageUrl: image,
  };
};