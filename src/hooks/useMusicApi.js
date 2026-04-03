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

async function fetchMultiple(queries) {
  const results = await Promise.all(queries.map(q => fetchSongs(q, 1).catch(() => [])));
  return dedup(results.flat());
}

const QUERIES = {
  bollywood90s: [
    'Tujhe Dekha Toh DDLJ', 'Chaiyya Chaiyya Dil Se', 'Dil To Pagal Hai',
    'Pehla Nasha Jo Jeeta', 'Taal Se Taal Mila', 'Ae Mere Humsafar',
    'Kuch Kuch Hota Hai', 'Ek Ladki Ko Dekha', 'Tu Mile Dil Khile',
    'Dil Chahta Hai', 'Sandese Aate Hain Border', 'Jai Ho Slumdog',
  ],
  bollywood2000s: [
    'Kal Ho Naa Ho', 'Tum Se Hi Jab We Met', 'Maeri Euphoria',
    'Kajra Re Bunty Aur Babli', 'Tere Bina Guru', 'Khuda Jaane Bachna Ae Haseeno',
    'Aaoge Jab Tum Jab We Met', 'Kabhi Alvida Naa Kehna', 'Jashn-E-Bahaaraa Jodhaa Akbar',
    'Rang De Basanti', 'Tera Hone Laga Hoon', 'Tere Liye Prince',
  ],
  bollywoodModern: [
    'Tum Hi Ho Aashiqui 2', 'Channa Mereya Ae Dil Hai Mushkil', 'Kesariya Brahmastra',
    'Gerua Dilwale', 'Agar Tum Saath Ho Tamasha', 'Raabta Arijit Singh',
    'Ilahi Yeh Jawaani Hai Deewani', 'Kabira Yeh Jawaani Hai Deewani',
    'Ae Dil Hai Mushkil', 'Soch Na Sake Airlift', 'Bolna Kapoor And Sons',
    'Enna Sona OK Jaanu',
  ],
  bollywoodLatest: [
    'Apna Bana Le Bhediya', 'Pasoori Coke Studio', 'Jhoome Jo Pathaan',
    'Besharam Rang Pathaan', 'Raataan Lambiyan Shershaah', 'Maan Meri Jaan King',
    'O Bedardeya Tu Jhoothi Main Makkaar', 'Phir Aur Kya Chahiye Zara Hatke Zara Bachke',
    'Tere Vaaste Zara Hatke', 'Chaleya Jawan', 'Heeriye Jasleen Royal',
    'Satranga Animal',
  ],
  hollywoodHits: [
    'Shape of You Ed Sheeran', 'Blinding Lights Weeknd', 'Someone Like You Adele',
    'Perfect Ed Sheeran', 'Bohemian Rhapsody Queen', 'Thinking Out Loud Ed Sheeran',
    'Rolling in the Deep Adele', 'Uptown Funk Bruno Mars', 'Closer Chainsmokers',
    'Starboy Weeknd', 'Let Her Go Passenger', 'Photograph Ed Sheeran',
  ],
  hollywoodPop: [
    'Levitating Dua Lipa', 'Stay Rihanna', 'Bad Guy Billie Eilish',
    'Señorita Shawn Mendes', 'Watermelon Sugar Harry Styles', 'Dance Monkey Tones And I',
    'Circles Post Malone', 'Sunflower Post Malone', 'drivers license Olivia Rodrigo',
    'Anti-Hero Taylor Swift', 'As It Was Harry Styles', 'Heat Waves Glass Animals',
  ],
};

export function useMusicApi() {
  const [categories, setCategories] = useState({
    bollywood90s: [], bollywood2000s: [], bollywoodModern: [],
    bollywoodLatest: [], hollywoodHits: [], hollywoodPop: [],
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
      const [b90, b00, bMod, bLat, hHit, hPop] = await Promise.all([
        fetchMultiple(QUERIES.bollywood90s),
        fetchMultiple(QUERIES.bollywood2000s),
        fetchMultiple(QUERIES.bollywoodModern),
        fetchMultiple(QUERIES.bollywoodLatest),
        fetchMultiple(QUERIES.hollywoodHits),
        fetchMultiple(QUERIES.hollywoodPop),
      ]);
      setCategories({
        bollywood90s: b90, bollywood2000s: b00, bollywoodModern: bMod,
        bollywoodLatest: bLat, hollywoodHits: hHit, hollywoodPop: hPop,
      });
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
