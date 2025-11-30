import { DailyEntry } from '../types';

const API_URL = 'https://www.abibliadigital.com.br/api';
const VERSION = 'acf'; // Almeida Corrigida Fiel (Public Domain)

// Fallback API (Bible-API.com)
const FALLBACK_API_URL = 'https://bible-api.com';

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapter {
  book: {
    name: string;
    author: string;
    group: string;
  };
  chapter: {
    number: number;
    verses: number;
  };
  verses: BibleVerse[];
}

// Mapeamento de nomes do App para abreviações da API principal (abibliadigital)
const BOOK_MAP: Record<string, string> = {
  "Gênesis": "gn", "Êxodo": "ex", "Levítico": "lv", "Números": "nm", "Deuteronômio": "dt",
  "Josué": "js", "Juízes": "jz", "Rute": "rt", "1 Samuel": "1sm", "2 Samuel": "2sm",
  "1 Reis": "1rs", "2 Reis": "2rs", "1 Crônicas": "1cr", "2 Crônicas": "2cr",
  "Esdras": "ed", "Neemias": "ne", "Ester": "et", "Jó": "job", "Salmos": "sl",
  "Provérbios": "pv", "Eclesiastes": "ec", "Cânticos": "ct", "Isaías": "is",
  "Jeremias": "jr", "Lamentações": "lm", "Ezequiel": "ez", "Daniel": "dn",
  "Oseias": "os", "Joel": "jl", "Amós": "am", "Obadias": "ob", "Jonas": "jn",
  "Miqueias": "mq", "Naum": "na", "Habacuque": "hc", "Sofonias": "sf", "Ageu": "ag",
  "Zacarias": "zc", "Malaquias": "ml", "Mateus": "mt", "Marcos": "mc", "Lucas": "lc",
  "João": "jo", "Atos": "at", "Romanos": "rm", "1 Coríntios": "1co", "2 Coríntios": "2co",
  "Gálatas": "gl", "Efésios": "ef", "Filipenses": "fp", "Colossenses": "cl",
  "1 Tessalonicenses": "1ts", "2 Tessalonicenses": "2ts", "1 Timóteo": "1tm",
  "2 Timóteo": "2tm", "Tito": "tt", "Filemom": "fm", "Hebreus": "hb", "Tiago": "tg",
  "1 Pedro": "1pe", "2 Pedro": "2pe", "1 João": "1jo", "2 João": "2jo", "3 João": "3jo",
  "Judas": "jd", "Apocalipse": "ap"
};

// Simple English mapping for Fallback API if Portuguese fails
const ENGLISH_BOOK_MAP: Record<string, string> = {
  "Gênesis": "Genesis", "Êxodo": "Exodus", "Levítico": "Leviticus", "Números": "Numbers", "Deuteronômio": "Deuteronomy",
  "Josué": "Joshua", "Juízes": "Judges", "Rute": "Ruth", "1 Samuel": "1Samuel", "2 Samuel": "2Samuel",
  "1 Reis": "1Kings", "2 Reis": "2Kings", "1 Crônicas": "1Chronicles", "2 Crônicas": "2Chronicles",
  "Esdras": "Ezra", "Neemias": "Nehemiah", "Ester": "Esther", "Jó": "Job", "Salmos": "Psalms",
  "Provérbios": "Proverbs", "Eclesiastes": "Ecclesiastes", "Cânticos": "Song of Solomon", "Isaías": "Isaiah",
  "Jeremias": "Jeremiah", "Lamentações": "Lamentations", "Ezequiel": "Ezekiel", "Daniel": "Daniel",
  "Oseias": "Hosea", "Joel": "Joel", "Amós": "Amos", "Obadias": "Obadiah", "Jonas": "Jonah",
  "Miqueias": "Micah", "Naum": "Nahum", "Habacuque": "Habakkuk", "Sofonias": "Zephaniah", "Ageu": "Haggai",
  "Zacarias": "Zechariah", "Malaquias": "Malachi", "Mateus": "Matthew", "Marcos": "Mark", "Lucas": "Luke",
  "João": "John", "Atos": "Acts", "Romanos": "Romans", "1 Coríntios": "1Corinthians", "2 Coríntios": "2Corinthians",
  "Gálatas": "Galatians", "Efésios": "Ephesians", "Filipenses": "Philippians", "Colossenses": "Colossians",
  "1 Tessalonicenses": "1Thessalonians", "2 Tessalonicenses": "2Thessalonians", "1 Timóteo": "1Timothy",
  "2 Timóteo": "2Timothy", "Tito": "Titus", "Filemom": "Philemon", "Hebreus": "Hebrews", "Tiago": "James",
  "1 Pedro": "1Peter", "2 Pedro": "2Peter", "1 João": "1John", "2 João": "2John", "3 João": "3John",
  "Judas": "Jude", "Apocalipse": "Revelation"
};

const fetchFromFallback = async (bookName: string, chapter: number): Promise<BibleChapter | null> => {
  try {
    const englishName = ENGLISH_BOOK_MAP[bookName] || bookName;
    // almeida is the PT-BR version on bible-api.com
    const response = await fetch(`${FALLBACK_API_URL}/${englishName}+${chapter}?translation=almeida`);
    
    if (!response.ok) throw new Error('Fallback API Failed');
    
    const data = await response.json();
    
    // Transform to match our interface
    return {
      book: {
        name: bookName,
        author: '',
        group: ''
      },
      chapter: {
        number: chapter,
        verses: data.verses.length
      },
      verses: data.verses.map((v: any) => ({
        number: v.verse,
        text: v.text
      }))
    };
  } catch (err) {
    console.error("Fallback API also failed", err);
    return null;
  }
};

export const fetchChapterContent = async (bookName: string, chapter: number): Promise<BibleChapter | null> => {
  const abbrev = BOOK_MAP[bookName];
  if (!abbrev) {
    console.error(`Book abbreviation not found for: ${bookName}`);
    return null;
  }

  // 1. Try Primary API (abibliadigital)
  try {
    const response = await fetch(`${API_URL}/verses/${VERSION}/${abbrev}/${chapter}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Primary Bible API failed, trying fallback...", error);
    
    // 2. Try Fallback API
    return await fetchFromFallback(bookName, chapter);
  }
};

export const fetchDailyReadingContent = async (entry: DailyEntry): Promise<BibleChapter[]> => {
  const chaptersData: BibleChapter[] = [];
  
  // Create an array of promises to fetch concurrently
  const promises = entry.chaptersToRead.map(chapterNum => 
    fetchChapterContent(entry.bookName, chapterNum)
  );

  const results = await Promise.all(promises);
  
  // Filter out nulls
  results.forEach(res => {
    if (res) chaptersData.push(res);
  });

  return chaptersData;
};