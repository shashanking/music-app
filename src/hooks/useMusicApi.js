import { useState, useEffect, useCallback, useRef } from 'react';

const BASE_URL = 'https://jiosaavn-api-privatecvc2.vercel.app';

function dedup(songs) {
  const seen = new Set();
  return songs.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

function parseSong(track) {
  const urls = track.downloadUrl || [];
  let audioUrl = '';
  for (const q of ['320kbps', '160kbps', '96kbps', '48kbps']) {
    const m = urls.find(u => u.quality === q);
    if (m) { audioUrl = m.link; break; }
  }
  if (!audioUrl && urls.length) audioUrl = urls[urls.length - 1].link || '';

  const images = track.image || [];
  const coverUrl = images.length ? images[images.length - 1].link || '' : '';

  return {
    id: String(track.id || ''),
    title: track.name || 'Unknown',
    artist: track.primaryArtists || 'Unknown Artist',
    album: track.album?.name || 'Single',
    coverUrl,
    audioUrl,
    duration: parseInt(track.duration || '0', 10),
  };
}

async function fetchSongs(query, limit = 10) {
  const res = await fetch(`${BASE_URL}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  const results = json?.data?.results || [];
  return results.map(parseSong).filter(s => s.audioUrl);
}

async function fetchMultiple(queries, perQuery = 1) {
  const results = await Promise.all(queries.map(q => fetchSongs(q, perQuery).catch(() => [])));
  return dedup(results.flat());
}

const QUERIES = {
  // ──── BOLLYWOOD ────
  bollywoodClassic: [
    'Lag Ja Gale Lata Mangeshkar', 'Dum Maro Dum', 'Mere Sapno Ki Rani',
    'Roop Tera Mastana', 'Tere Bina Zindagi Se', 'Chingari Koi Bhadke',
    'Ek Pyaar Ka Nagma Hai', 'Kabhi Kabhie Mere Dil', 'Tujhe Dekha Toh DDLJ',
    'Chaiyya Chaiyya Dil Se', 'Dil To Pagal Hai', 'Pehla Nasha Jo Jeeta',
    'Taal Se Taal Mila', 'Ae Mere Humsafar', 'Kuch Kuch Hota Hai',
    'Ek Ladki Ko Dekha', 'Tu Mile Dil Khile', 'Dil Chahta Hai',
    'Sandese Aate Hain Border', 'Ye Dosti Sholay',
  ],
  bollywood2000s: [
    'Kal Ho Naa Ho', 'Tum Se Hi Jab We Met', 'Maeri Euphoria',
    'Kajra Re Bunty Aur Babli', 'Tere Bina Guru', 'Khuda Jaane Bachna Ae Haseeno',
    'Aaoge Jab Tum Jab We Met', 'Kabhi Alvida Naa Kehna', 'Jashn-E-Bahaaraa Jodhaa Akbar',
    'Rang De Basanti', 'Tera Hone Laga Hoon', 'Tere Liye Prince',
    'Tujh Mein Rab Dikhta Hai', 'Yeh Ishq Hai Jab We Met', 'Jai Ho Slumdog',
    'Tumhi Dekho Na Kabhi Alvida', 'Mauja Hi Mauja Jab We Met', 'Khwab Dekhe Race',
    'Dhan Te Nan Kaminey', 'Love Mera Hit Hit Billu',
  ],
  bollywoodModern: [
    'Tum Hi Ho Aashiqui 2', 'Channa Mereya Ae Dil Hai Mushkil', 'Kesariya Brahmastra',
    'Gerua Dilwale', 'Agar Tum Saath Ho Tamasha', 'Raabta Arijit Singh',
    'Ilahi Yeh Jawaani Hai Deewani', 'Kabira Yeh Jawaani Hai Deewani',
    'Ae Dil Hai Mushkil', 'Soch Na Sake Airlift', 'Bolna Kapoor And Sons',
    'Enna Sona OK Jaanu', 'Galliyan Ek Villain', 'Badtameez Dil Yeh Jawaani Hai Deewani',
    'Kar Gayi Chull Kapoor', 'Nashe Si Chadh Gayi Befikre',
    'Jeena Jeena Badlapur', 'Sun Saathiya ABCD', 'Banjaara Ek Villain',
    'Hamdard Ek Villain',
  ],
  bollywoodLatest: [
    'Apna Bana Le Bhediya', 'Pasoori Coke Studio', 'Jhoome Jo Pathaan',
    'Besharam Rang Pathaan', 'Raataan Lambiyan Shershaah', 'Maan Meri Jaan King',
    'O Bedardeya Tu Jhoothi Main Makkaar', 'Phir Aur Kya Chahiye Zara Hatke',
    'Tere Vaaste Zara Hatke', 'Chaleya Jawan', 'Heeriye Jasleen Royal',
    'Satranga Animal', 'Tere Hawaale Laal Singh Chaddha', 'Kesariya Tera Brahmastra',
    'Aaj Ki Raat Stree 2', 'Tumse Pyaar Karke', 'Love Stereo Again',
    'What Jhumka Laaye Rocky Aur Rani', 'Dil Jhoom Gayi Re',
    'Arjan Vailly Animal',
  ],

  // ──── PUNJABI ────
  punjabi: [
    'Excuses AP Dhillon', 'Brown Munde AP Dhillon', 'Lover Diljit Dosanjh',
    'Naina Diljit Dosanjh', 'Laung Laachi', 'Proper Patola Badshah',
    'Lahore Guru Randhawa', 'High Rated Gabru', 'Ban Ja Tu Meri Rani Guru',
    'Slowly Slowly Guru Randhawa', 'No Love Shubh', 'Elevated Shubh',
    'Kala Chashma Baar Baar Dekho', 'Suit Suit Guru Randhawa',
    'Naach Meri Rani Guru Randhawa', 'Amplifier Imran Khan',
    'Satisfya Imran Khan', 'Mundian To Bach Ke Panjabi MC',
    'Mitran Da Junction Diljit', 'Ikk Kudi Diljit Dosanjh',
  ],

  // ──── SOUTH INDIAN ────
  southIndian: [
    'Naatu Naatu RRR', 'Srivalli Pushpa', 'Oo Antava Pushpa',
    'Buttabomma Ala Vaikunthapurramuloo', 'Butta Bomma Armaan Malik',
    'Arabic Kuthu Beast', 'Kaavaalaa Jailer', 'Hukum Jailer',
    'Why This Kolaveri Di', 'Vaathi Coming Master', 'Rowdy Baby Maari',
    'Ranjithame Varisu', 'Naa Ready Master', 'Kurchi Madathapetti Guntur Kaaram',
    'Saami Saami Pushpa', 'Jai Balayya Akhanda', 'Dosti KGF', 'Tum Tum Enemy',
    'Illuminati Aavesham', 'Appadi Podu Ghilli',
  ],

  // ──── HOLLYWOOD / ENGLISH POP ────
  hollywoodClassic: [
    'Bohemian Rhapsody Queen', 'Hotel California Eagles', 'Stairway to Heaven Led Zeppelin',
    'Imagine John Lennon', 'Billie Jean Michael Jackson', 'Beat It Michael Jackson',
    'Smells Like Teen Spirit Nirvana', 'Wonderwall Oasis', 'Yesterday Beatles',
    'Let It Be Beatles', 'Thriller Michael Jackson', 'Comfortably Numb Pink Floyd',
    'Sweet Child O Mine Guns N Roses', 'Nothing Else Matters Metallica',
    'Lose Yourself Eminem', 'Stan Eminem', 'In The End Linkin Park',
    'Numb Linkin Park', 'Boulevard Of Broken Dreams Green Day',
    'Fix You Coldplay',
  ],
  hollywoodPop: [
    'Shape of You Ed Sheeran', 'Blinding Lights Weeknd', 'Someone Like You Adele',
    'Perfect Ed Sheeran', 'Thinking Out Loud Ed Sheeran', 'Rolling in the Deep Adele',
    'Uptown Funk Bruno Mars', 'Closer Chainsmokers', 'Starboy Weeknd',
    'Let Her Go Passenger', 'Photograph Ed Sheeran', 'Levitating Dua Lipa',
    'Stay Rihanna', 'Bad Guy Billie Eilish', 'Señorita Shawn Mendes',
    'Watermelon Sugar Harry Styles', 'Dance Monkey Tones And I',
    'Circles Post Malone', 'Sunflower Post Malone', 'drivers license Olivia Rodrigo',
  ],
  hollywoodModern: [
    'Anti-Hero Taylor Swift', 'As It Was Harry Styles', 'Heat Waves Glass Animals',
    'Peaches Justin Bieber', 'Montero Lil Nas X', 'Good 4 U Olivia Rodrigo',
    'Kiss Me More Doja Cat', 'Save Your Tears Weeknd', 'Shivers Ed Sheeran',
    'Easy On Me Adele', 'abcdefu Gayle', 'Industry Baby Lil Nas X',
    'Ghost Justin Bieber', 'Cold Heart Elton John Dua Lipa',
    'Cruel Summer Taylor Swift', 'Flowers Miley Cyrus', 'Vampire Olivia Rodrigo',
    'Calm Down Rema', 'Kill Bill SZA', 'Unholy Sam Smith',
  ],

  // ──── K-POP ────
  kpop: [
    'Dynamite BTS', 'Butter BTS', 'Boy With Luv BTS', 'Fake Love BTS',
    'How You Like That Blackpink', 'Kill This Love Blackpink', 'Pink Venom Blackpink',
    'Gangnam Style PSY', 'Love Dive IVE', 'Super Shy NewJeans',
    'Attention NewJeans', 'Next Level Aespa', 'Cupid Fifty Fifty',
    'Savage Aespa', 'God Menu Stray Kids', 'Back Door Stray Kids',
    'Ditto NewJeans', 'ANTIFRAGILE LE SSERAFIM', 'After Like IVE',
    'Hype Boy NewJeans',
  ],

  // ──── LATIN ────
  latin: [
    'Despacito Luis Fonsi', 'Mi Gente J Balvin', 'Danza Kuduro Don Omar',
    'Bailando Enrique Iglesias', 'Vivir Mi Vida Marc Anthony',
    'La Bicicleta Shakira', 'Waka Waka Shakira', 'Hips Dont Lie Shakira',
    'Taki Taki DJ Snake', 'Con Calma Daddy Yankee',
    'Gasolina Daddy Yankee', 'Te Felicito Shakira', 'Pepas Farruko',
    'Hawai Maluma', 'Dákiti Bad Bunny', 'Titi Me Pregunto Bad Bunny',
    'Ojitos Lindos Bad Bunny', 'Bzrp Music Sessions 53 Shakira',
    'Me Porto Bonito Bad Bunny', 'Provenza Karol G',
  ],

  // ──── ARABIC / MIDDLE EASTERN ────
  arabic: [
    'Habibi Ya Nour El Ain Amr Diab', 'Tamally Maak Amr Diab',
    'Ahwak Abdel Halim Hafez', 'Enta Eih Nancy Ajram',
    'Ya Tabtab Nancy Ajram', 'Nassam Alayna Fairuz',
    'Desert Rose Sting', 'Gratata MC Fioti',
    'Ya Lili Balti', 'Didi Khaled', 'Aicha Khaled',
    'Leila Wael Kfoury', 'Masha Allah Mesut Kurtis',
    'Waheshni Ehab Tawfik', 'Ana Albi Dalili Amr Diab',
  ],

  // ──── AFRICAN / AFROBEATS ────
  afrobeats: [
    'Essence Wizkid', 'Love Nwantiti CKay', 'Peru Fireboy DML',
    'Last Last Burna Boy', 'Ye Burna Boy', 'Fall Davido',
    'Joro Wizkid', 'Dumebi Rema', 'Soundgasm Rema',
    'Calm Down Rema Selena Gomez', 'Rush Ayra Starr', 'Bloody Samaritan Ayra Starr',
    'Loaded Tiwa Savage', 'Water Tyla', 'Unavailable Davido',
  ],

  // ──── EDM / ELECTRONIC ────
  edm: [
    'Faded Alan Walker', 'Alone Alan Walker', 'Titanium David Guetta',
    'Wake Me Up Avicii', 'Levels Avicii', 'The Nights Avicii',
    'Lean On Major Lazer', 'Roses SAINt JHN Imanbek Remix',
    'Something Just Like This Chainsmokers', 'Happier Marshmello',
    'Silence Marshmello', 'Animals Martin Garrix', 'Scared To Be Lonely Martin Garrix',
    'In The Name Of Love Martin Garrix', 'This Is What You Came For Calvin Harris',
    'Summer Calvin Harris', 'I Took A Pill In Ibiza Mike Posner',
    'Where Are U Now Skrillex Diplo Justin Bieber', 'Waiting For Love Avicii',
    'Don\'t Let Me Down Chainsmokers',
  ],

  // ──── HIP-HOP / RAP ────
  hiphop: [
    'SICKO MODE Travis Scott', 'HUMBLE Kendrick Lamar', 'God\'s Plan Drake',
    'Hotline Bling Drake', 'Rockstar Post Malone', 'Congratulations Post Malone',
    'Old Town Road Lil Nas X', 'Lucid Dreams Juice WRLD', 'Robbery Juice WRLD',
    'RAPSTAR Polo G', 'Laugh Now Cry Later Drake', 'Way 2 Sexy Drake',
    'Praise God Kanye West', 'Stronger Kanye West', 'Alright Kendrick Lamar',
    'Money Trees Kendrick Lamar', 'm.A.A.d city Kendrick Lamar',
    'Not Like Us Kendrick Lamar', 'Rap God Eminem', 'Without Me Eminem',
  ],

  // ──── R&B / SOUL ────
  rnb: [
    'Blinding Lights Weeknd', 'After Hours Weeknd', 'Die For You Weeknd',
    'Earned It Weeknd', 'Call Out My Name Weeknd', 'Snooze SZA',
    'Good Days SZA', 'Best Part Daniel Caesar', 'Redbone Childish Gambino',
    'Alright Supergrass', 'Get You Daniel Caesar', 'Leave The Door Open Silk Sonic',
    'Smokin Out The Window Silk Sonic', 'Adorn Miguel', 'All Of Me John Legend',
    'Ordinary People John Legend', 'If I Ain\'t Got You Alicia Keys',
    'No One Alicia Keys', 'Drunk In Love Beyonce', 'Halo Beyonce',
  ],

  // ──── COKE STUDIO / INDIE ────
  cokeStudio: [
    'Pasoori Ali Sethi Shae Gill', 'Kana Yaari Coke Studio',
    'Tu Jhoom Naseebo Lal Abida Parveen', 'Manwa Lazy Lamhe Coke Studio',
    'Afreen Afreen Rahat Fateh Ali Khan', 'Tajdar e Haram Coke Studio',
    'Kun Faya Kun AR Rahman', 'Khaki Banda Coke Studio',
    'Humraah Sachet Tandon', 'Tera Ban Jaunga Kabir Singh',
    'Shayad Love Aaj Kal', 'Qaafirana Kedarnath', 'Namo Namo Kedarnath',
    'Kalank Title Track', 'Ve Maahi Kesari', 'Tera Yaar Hoon Main',
    'Tujhe Kitna Chahne Lage Kabir Singh', 'Bekhayali Kabir Singh',
    'Dil Diyan Gallan Tiger Zinda Hai', 'Hawayein Jab Harry Met Sejal',
  ],
};

// Category display config
const CATEGORY_CONFIG = [
  { key: 'bollywoodClassic', title: 'Bollywood Classics', icon: '❤️' },
  { key: 'bollywood2000s', title: '2000s Bollywood', icon: '💿' },
  { key: 'bollywoodModern', title: 'Modern Bollywood', icon: '🎵' },
  { key: 'bollywoodLatest', title: 'Latest Bollywood', icon: '🔥' },
  { key: 'punjabi', title: 'Punjabi Hits', icon: '🦁' },
  { key: 'southIndian', title: 'South Indian', icon: '🎬' },
  { key: 'cokeStudio', title: 'Coke Studio & Indie', icon: '🎤' },
  { key: 'hollywoodClassic', title: 'Hollywood Legends', icon: '🎸' },
  { key: 'hollywoodPop', title: 'Pop Hits', icon: '⭐' },
  { key: 'hollywoodModern', title: 'Modern Pop', icon: '💫' },
  { key: 'kpop', title: 'K-Pop', icon: '🇰🇷' },
  { key: 'latin', title: 'Latin & Reggaeton', icon: '💃' },
  { key: 'arabic', title: 'Arabic & Middle Eastern', icon: '🕌' },
  { key: 'afrobeats', title: 'Afrobeats', icon: '🌍' },
  { key: 'edm', title: 'EDM & Electronic', icon: '🎧' },
  { key: 'hiphop', title: 'Hip-Hop & Rap', icon: '🎤' },
  { key: 'rnb', title: 'R&B & Soul', icon: '💜' },
];

export { CATEGORY_CONFIG };

export function useMusicApi() {
  const [categories, setCategories] = useState(() => {
    const init = {};
    for (const key of Object.keys(QUERIES)) init[key] = [];
    return init;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const loadSongs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const keys = Object.keys(QUERIES);
      const results = await Promise.all(
        keys.map(key => fetchMultiple(QUERIES[key]))
      );
      const cats = {};
      keys.forEach((key, i) => { cats[key] = results[i]; });
      setCategories(cats);
    } catch (e) {
      setError('Failed to load songs. Check your internet connection.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSongs(); }, [loadSongs]);

  const searchSongs = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fetchSongs(query, 30);
        setSearchResults(results);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 400);
  }, []);

  const allSongs = Object.values(categories).flat();

  return { categories, allSongs, loading, error, loadSongs, searchResults, searching, searchSongs };
}
