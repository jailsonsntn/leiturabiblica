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

// Versículos Chave por Livro para garantir correspondência correta
const KEY_VERSES: Record<string, { text: string; ref: string }> = {
  "Gênesis": { text: "No princípio criou Deus o céu e a terra.", ref: "Gênesis 1:1" },
  "Êxodo": { text: "O Senhor pelejará por vós, e vós vos calareis.", ref: "Êxodo 14:14" },
  "Levítico": { text: "Santos sereis, porque eu, o Senhor vosso Deus, sou santo.", ref: "Levítico 19:2" },
  "Números": { text: "O Senhor te abençoe e te guarde.", ref: "Números 6:24" },
  "Deuteronômio": { text: "Amarás, pois, o Senhor teu Deus de todo o teu coração.", ref: "Deuteronômio 6:5" },
  "Josué": { text: "Não to mandei eu? Esforça-te, e tem bom ânimo.", ref: "Josué 1:9" },
  "Juízes": { text: "Naqueles dias não havia rei em Israel; porém cada um fazia o que parecia reto aos seus olhos.", ref: "Juízes 21:25" },
  "Rute": { text: "Onde quer que fores, irei eu; e onde quer que pousares, ali pousarei eu.", ref: "Rute 1:16" },
  "1 Samuel": { text: "Eis que o obedecer é melhor do que o sacrificar.", ref: "1 Samuel 15:22" },
  "2 Samuel": { text: "O caminho de Deus é perfeito, e a palavra do Senhor refinada.", ref: "2 Samuel 22:31" },
  "1 Reis": { text: "Dá, pois, a teu servo um coração entendido para julgar a teu povo.", ref: "1 Reis 3:9" },
  "2 Reis": { text: "Não temas; porque mais são os que estão conosco do que os que estão com eles.", ref: "2 Reis 6:16" },
  "1 Crônicas": { text: "Ah! Se me abençoasses muitíssimo!", ref: "1 Crônicas 4:10" },
  "2 Crônicas": { text: "Se o meu povo, que se chama pelo meu nome, se humilhar, e orar...", ref: "2 Crônicas 7:14" },
  "Esdras": { text: "A mão do nosso Deus é sobre todos os que o buscam, para o bem deles.", ref: "Esdras 8:22" },
  "Neemias": { text: "A alegria do Senhor é a vossa força.", ref: "Neemias 8:10" },
  "Ester": { text: "E quem sabe se para tal tempo como este chegaste a este reino?", ref: "Ester 4:14" },
  "Jó": { text: "Eu sei que o meu Redentor vive, e que por fim se levantará sobre a terra.", ref: "Jó 19:25" },
  "Salmos": { text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", ref: "Salmos 119:105" },
  "Provérbios": { text: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.", ref: "Provérbios 3:5" },
  "Eclesiastes": { text: "Tudo tem o seu tempo determinado, e há tempo para todo o propósito debaixo do céu.", ref: "Eclesiastes 3:1" },
  "Cânticos": { text: "Eu sou do meu amado, e o meu amado é meu.", ref: "Cânticos 6:3" },
  "Isaías": { text: "Mas os que esperam no Senhor renovarão as forças.", ref: "Isaías 40:31" },
  "Jeremias": { text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor.", ref: "Jeremias 29:11" },
  "Lamentações": { text: "As misericórdias do Senhor são a causa de não sermos consumidos.", ref: "Lamentações 3:22" },
  "Ezequiel": { text: "E dar-vos-ei um coração novo, e porei dentro de vós um espírito novo.", ref: "Ezequiel 36:26" },
  "Daniel": { text: "Seja bendito o nome de Deus de eternidade a eternidade, porque dele são a sabedoria e a força.", ref: "Daniel 2:20" },
  "Oseias": { text: "Conheçamos, e prossigamos em conhecer ao Senhor.", ref: "Oseias 6:3" },
  "Joel": { text: "E há de ser que, todo aquele que invocar o nome do Senhor será salvo.", ref: "Joel 2:32" },
  "Amós": { text: "Buscai ao Senhor, e vivei.", ref: "Amós 5:6" },
  "Obadias": { text: "Mas no monte Sião haverá livramento.", ref: "Obadias 1:17" },
  "Jonas": { text: "Ao Senhor pertence a salvação.", ref: "Jonas 2:9" },
  "Miqueias": { text: "Ele te declarou, ó homem, o que é bom; e que é o que o Senhor pede de ti.", ref: "Miqueias 6:8" },
  "Naum": { text: "O Senhor é bom, uma fortaleza no dia da angústia.", ref: "Naum 1:7" },
  "Habacuque": { text: "Todavia eu me alegrarei no Senhor; exultarei no Deus da minha salvação.", ref: "Habacuque 3:18" },
  "Sofonias": { text: "O Senhor teu Deus está no meio de ti, poderoso para te salvar.", ref: "Sofonias 3:17" },
  "Ageu": { text: "Minha é a prata, e meu é o ouro, disse o Senhor dos Exércitos.", ref: "Ageu 2:8" },
  "Zacarias": { text: "Não por força nem por violência, mas sim pelo meu Espírito, diz o Senhor.", ref: "Zacarias 4:6" },
  "Malaquias": { text: "Mas para vós, que temeis o meu nome, nascerá o sol da justiça.", ref: "Malaquias 4:2" },
  "Mateus": { text: "Buscai primeiro o Reino de Deus, e a sua justiça.", ref: "Mateus 6:33" },
  "Marcos": { text: "Tudo é possível ao que crê.", ref: "Marcos 9:23" },
  "Lucas": { text: "Porque o Filho do homem veio buscar e salvar o que se havia perdido.", ref: "Lucas 19:10" },
  "João": { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.", ref: "João 3:16" },
  "Atos": { text: "Mas recebereis a virtude do Espírito Santo, que há de vir sobre vós.", ref: "Atos 1:8" },
  "Romanos": { text: "Porque todos pecaram e destituídos estão da glória de Deus.", ref: "Romanos 3:23" },
  "1 Coríntios": { text: "Agora, pois, permanecem a fé, a esperança e o amor.", ref: "1 Coríntios 13:13" },
  "2 Coríntios": { text: "A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.", ref: "2 Coríntios 12:9" },
  "Gálatas": { text: "Já estou crucificado com Cristo; e vivo, não mais eu, mas Cristo vive em mim.", ref: "Gálatas 2:20" },
  "Efésios": { text: "Porque pela graça sois salvos, por meio da fé.", ref: "Efésios 2:8" },
  "Filipenses": { text: "Posso todas as coisas naquele que me fortalece.", ref: "Filipenses 4:13" },
  "Colossenses": { text: "E tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor.", ref: "Colossenses 3:23" },
  "1 Tessalonicenses": { text: "Orai sem cessar.", ref: "1 Tessalonicenses 5:17" },
  "2 Tessalonicenses": { text: "Mas o Senhor é fiel, que vos confirmará, e guardará do maligno.", ref: "2 Tessalonicenses 3:3" },
  "1 Timóteo": { text: "Porque há um só Deus, e um só Mediador entre Deus e os homens, Jesus Cristo.", ref: "1 Timóteo 2:5" },
  "2 Timóteo": { text: "Combati o bom combate, acabei a carreira, guardei a fé.", ref: "2 Timóteo 4:7" },
  "Tito": { text: "Aguardando a bem-aventurada esperança e o aparecimento da glória do grande Deus.", ref: "Tito 2:13" },
  "Filemom": { text: "Para que a comunhão da tua fé seja eficaz no conhecimento de todo o bem.", ref: "Filemom 1:6" },
  "Hebreus": { text: "Ora, a fé é o firme fundamento das coisas que se esperam.", ref: "Hebreus 11:1" },
  "Tiago": { text: "Chegai-vos a Deus, e ele se chegará a vós.", ref: "Tiago 4:8" },
  "1 Pedro": { text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", ref: "1 Pedro 5:7" },
  "2 Pedro": { text: "Crescei na graça e conhecimento de nosso Senhor e Salvador, Jesus Cristo.", ref: "2 Pedro 3:18" },
  "1 João": { text: "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar.", ref: "1 João 1:9" },
  "2 João": { text: "E o amor é este: que andemos segundo os seus mandamentos.", ref: "2 João 1:6" },
  "3 João": { text: "Amado, desejo que te vá bem em todas as coisas, e que tenhas saúde.", ref: "3 João 1:2" },
  "Judas": { text: "Conservai-vos a vós mesmos no amor de Deus.", ref: "Judas 1:21" },
  "Apocalipse": { text: "Eis que estou à porta, e bato; se alguém ouvir a minha voz, e abrir a porta, entrarei.", ref: "Apocalipse 3:20" }
};

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

  // 7. Get Correct Key Verse for the Book
  const keyVerse = KEY_VERSES[startInfo.bookName] || { 
    text: "Lâmpada para os meus pés é tua palavra.", 
    ref: `${startInfo.bookName} ${startInfo.chapter}:1` 
  };

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
    verseReference: keyVerse.ref,
    verseText: keyVerse.text,
    devotional: `Seguindo o plano "${plan.label}". Ao ler ${startInfo.bookName}, observe o contexto histórico e espiritual. Que a leitura de hoje renove sua mente.`,
    playlistTitle: playlist.title,
    playlistUrl: playlist.url,
    imageUrl: image,
  };
};