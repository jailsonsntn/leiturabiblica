import { Badge, ReadingPlan } from './types';

export const COLORS = {
  primary: "#2C6BA6",       // Azul acolhedor
  primaryHover: "#20558a",
  accent: "#FFA725",        // Laranja suave
  accentHover: "#e69214",
  background: "#FFFFFF",
  surface: "#F7FAFB",
  textMain: "#1e293b",
  textMuted: "#64748b",
  success: "#10b981"
};

// Revertido para Busca Genérica (listType=search) para evitar erro de vídeo indisponível
export const MOCK_PLAYLISTS = [
  { title: "Melhores Músicas Gospel 2026", url: "https://www.youtube.com/results?search_query=melhores+musicas+gospel+2026+mais+tocadas" },
  { title: "Louvores de Adoração Profunda", url: "https://www.youtube.com/results?search_query=louvores+de+adoracao+profunda" },
  { title: "Hinos da Harpa Cristã", url: "https://www.youtube.com/results?search_query=hinos+harpa+crista+melhores" },
  { title: "Gospel Acústico para Orar", url: "https://www.youtube.com/results?search_query=gospel+acustico+para+orar" },
  { title: "Corinhos de Fogo Pentecostal", url: "https://www.youtube.com/results?search_query=corinhos+de+fogo+pentecostal" },
  { title: "Fernandinho e Morada", url: "https://www.youtube.com/results?search_query=fernandinho+morada+playlist" },
  { title: "Gabriela Rocha Worship", url: "https://www.youtube.com/results?search_query=gabriela+rocha+worship" }
];

export const BIBLE_IMAGES = [
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80", // Nature/Light
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80", // Sunrise
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80", // Mountains
  "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80", // Sky
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", // Ocean
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80", // Forest
  "https://images.unsplash.com/photo-1507643179173-39dbda018fd6?auto=format&fit=crop&w=1200&q=80", // Wheat
];

export const ACHIEVEMENT_BADGES: Badge[] = [
  {
    id: 'streak_7',
    label: 'Início Firme',
    description: 'Completou 7 dias de leitura consecutiva.',
    daysRequired: 7,
    iconName: 'star'
  },
  {
    id: 'streak_30',
    label: 'Hábito Criado',
    description: 'Alcançou 30 dias seguidos de devocional.',
    daysRequired: 30,
    iconName: 'flame'
  },
  {
    id: 'streak_100',
    label: 'Centenário',
    description: 'Uma jornada incrível de 100 dias na Palavra.',
    daysRequired: 100,
    iconName: 'crown'
  },
  {
    id: 'streak_365',
    label: 'Bíblia Completa',
    description: 'Você leu a Bíblia toda em um ano!',
    daysRequired: 365,
    iconName: 'award'
  }
];

export const READING_PLANS: ReadingPlan[] = [
  {
    id: 'whole_bible',
    label: 'Bíblia Completa',
    description: 'Gênesis a Apocalipse em 1 ano (365 dias).',
    days: 365,
    books: [] // Empty implies ALL books
  },
  {
    id: 'custom',
    label: 'Plano Personalizado',
    description: 'Escolha um livro e defina seu ritmo.',
    days: 0, // Dynamic
    books: [] // Dynamic
  },
  {
    id: 'pentateuch',
    label: 'Pentateuco',
    description: 'Os 5 livros da Lei: Gênesis a Deuteronômio.',
    days: 90,
    books: ['Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio']
  },
  {
    id: 'historical',
    label: 'Livros Históricos',
    description: 'A história de Israel: Josué a Ester.',
    days: 90,
    books: ['Josué', 'Juízes', 'Rute', '1 Samuel', '2 Samuel', '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras', 'Neemias', 'Ester']
  },
  {
    id: 'poetic',
    label: 'Sapienciais e Poéticos',
    description: 'Sabedoria e Salmos: Jó a Cânticos.',
    days: 60,
    books: ['Jó', 'Salmos', 'Provérbios', 'Eclesiastes', 'Cânticos']
  },
  {
    id: 'prophetic',
    label: 'Livros Proféticos',
    description: 'Mensagens dos Profetas: Isaías a Malaquias.',
    days: 90,
    books: ['Isaías', 'Jeremias', 'Lamentações', 'Ezequiel', 'Daniel', 'Oseias', 'Joel', 'Amós', 'Obadias', 'Jonas', 'Miqueias', 'Naum', 'Habacuque', 'Sofonias', 'Ageu', 'Zacarias', 'Malaquias']
  },
  {
    id: 'gospels',
    label: 'Evangelhos',
    description: 'Vida de Jesus: Mateus, Marcos, Lucas e João.',
    days: 45,
    books: ['Mateus', 'Marcos', 'Lucas', 'João']
  },
  {
    id: 'acts',
    label: 'Atos dos Apóstolos',
    description: 'O início da Igreja Primitiva.',
    days: 14,
    books: ['Atos']
  },
  {
    id: 'epistles',
    label: 'Cartas (Epístolas)',
    description: 'Doutrina para a Igreja: Romanos a Judas.',
    days: 60,
    books: ['Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios', 'Filipenses', 'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo', '2 Timóteo', 'Tito', 'Filemom', 'Hebreus', 'Tiago', '1 Pedro', '2 Pedro', '1 João', '2 João', '3 João', 'Judas']
  },
  {
    id: 'revelation',
    label: 'Apocalipse',
    description: 'A revelação do fim dos tempos.',
    days: 14,
    books: ['Apocalipse']
  },
  {
    id: 'new_testament',
    label: 'Novo Testamento Completo',
    description: 'De Mateus a Apocalipse.',
    days: 120,
    books: ['Mateus', 'Marcos', 'Lucas', 'João', 'Atos', 'Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios', 'Filipenses', 'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo', '2 Timóteo', 'Tito', 'Filemom', 'Hebreus', 'Tiago', '1 Pedro', '2 Pedro', '1 João', '2 João', '3 João', 'Judas', 'Apocalipse']
  },
  {
    id: 'old_testament',
    label: 'Antigo Testamento Completo',
    description: 'De Gênesis a Malaquias.',
    days: 260,
    books: ['Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio', 'Josué', 'Juízes', 'Rute', '1 Samuel', '2 Samuel', '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras', 'Neemias', 'Ester', 'Jó', 'Salmos', 'Provérbios', 'Eclesiastes', 'Cânticos', 'Isaías', 'Jeremias', 'Lamentações', 'Ezequiel', 'Daniel', 'Oseias', 'Joel', 'Amós', 'Obadias', 'Jonas', 'Miqueias', 'Naum', 'Habacuque', 'Sofonias', 'Ageu', 'Zacarias', 'Malaquias']
  }
];