import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { MdHistory, MdCheck } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase-config';
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import PosterBadge from '../components/PosterBadge';
import './Home.css';

const Search = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search).get('q');

    // Selection Mode Params
    const selectForFavorite = location.state?.selectForFavorite;
    const slotIndex = location.state?.slotIndex;

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Recent Searches
    const [recentSearches, setRecentSearches] = useState([]);

    // Success Animation State
    const [showSuccess, setShowSuccess] = useState(false);
    const [duplicateAlert, setDuplicateAlert] = useState(false);
    const [starSeriesIds, setStarSeriesIds] = useState(new Set());

    const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '05587a49bd4890a9630d6c0e544e0f6f'; // Fallback if env not loaded
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

    // Auth for unique storage
    const { currentUser } = useAuth();
    const storageKey = currentUser ? `recentSearches_${currentUser.uid}` : 'recentSearches_guest';

    useEffect(() => {
        try {
            const savedRecents = JSON.parse(localStorage.getItem(storageKey) || '[]');
            setRecentSearches(Array.isArray(savedRecents) ? savedRecents : []);
        } catch (e) {
            setRecentSearches([]);
        }
    }, [currentUser, storageKey]);

    useEffect(() => {
        if (!currentUser) {
            setStarSeriesIds(new Set());
            return;
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const stars = docSnap.data().starSeries || [];
                setStarSeriesIds(new Set(stars.map(s => s.id)));
            }
        }, (error) => {
            console.error("Error watching stars:", error);
        });

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (query) {
            fetchSearch();
            addToRecent(query);
        } else {
            setResults([]);
        }
    }, [query, storageKey]);

    const addToRecent = (term) => {
        let recents = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (!recents.includes(term)) {
            recents = [term, ...recents].slice(0, 5); // Keep last 5
            localStorage.setItem(storageKey, JSON.stringify(recents));
            setRecentSearches(recents);
        }
    };

    const [genreSearchData, setGenreSearchData] = useState(null); // { trending: [], underrated: [], genreName: '' }

    const GENRES_MAP = {
        'action': 10759, 'adventure': 10759,
        'animation': 16, 'comedy': 35, 'crime': 80,
        'documentary': 99, 'drama': 18, 'family': 10751,
        'kids': 10762, 'mystery': 9648, 'news': 10763,
        'reality': 10764,
        'scifi': 10765, 'sci-fi': 10765, 'fantasy': 10765,
        'soap': 10766, 'talk': 10767, 'war': 10768, 'western': 37,
        'horror': 27, 'thriller': 9648
    };

    const fetchSearch = async () => {
        setLoading(true);
        setGenreSearchData(null);
        setResults([]);

        const lowerQ = query.toLowerCase().trim();
        const genreId = GENRES_MAP[lowerQ];

        try {
            if (genreId) {
                // Genre Search
                const [trending, underrated] = await Promise.all([
                    fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`).then(r => r.json()),
                    fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=200`).then(r => r.json())
                ]);
                setGenreSearchData({
                    genreName: lowerQ.toUpperCase(),
                    trending: trending.results || [],
                    underrated: underrated.results || []
                });
            } else {
                // Normal Search
                const response = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
                const data = await response.json();
                setResults(data.results || []);
            }
            setLoading(false);
        } catch (error) {
            console.error("Search failed", error);
            setLoading(false);
        }
    };

    // const { currentUser } = useAuth(); // Moved up

    const handleSeriesClick = async (e, item) => {
        if (selectForFavorite) {
            e.preventDefault();

            if (!currentUser) return; // Should be protected, but safe guard

            try {
                // Fetch current user favorites
                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    let currentFavs = userSnap.data().favorites || [null, null, null, null, null];

                    // Duplicate Check
                    const isDuplicate = currentFavs.some((fav, idx) => fav && fav.id === item.id && idx !== slotIndex);
                    if (isDuplicate) {
                        setDuplicateAlert(true);
                        setTimeout(() => setDuplicateAlert(false), 2000);
                        return; // Stop processing
                    }

                    // Animation Trigger (Only if not duplicate)
                    setShowSuccess(true);

                    // Ensure standard length
                    if (currentFavs.length < 5) {
                        currentFavs = [...currentFavs, ...Array(5 - currentFavs.length).fill(null)];
                    }

                    // Update specific slot
                    currentFavs[slotIndex] = item;

                    // Save back
                    await updateDoc(userRef, { favorites: currentFavs });
                }
            } catch (err) {
                console.error("Failed to save favorite", err);
            }

            // Delay for Animation then Redirect
            setTimeout(() => {
                navigate('/profile');
            }, 2000); // 2s delay
        }
    };

    return (
        <div className="section" style={{ position: 'relative' }}>
            {/* Success Popup */}
            {showSuccess && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{
                        width: '100px', height: '100px',
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '20px',
                        animation: 'popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <MdCheck size={60} color="#000" />
                    </div>
                    <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', animation: 'fadeIn 1s ease-out' }}>Added to Favorites</h2>
                </div>
            )}

            {/* Duplicate Alert */}
            {duplicateAlert && (
                <div style={{
                    position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)',
                    background: '#ff4444', color: 'white', padding: '15px 30px', borderRadius: '8px',
                    zIndex: 2100, fontWeight: 'bold', boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
                    animation: 'fadeIn 0.2s ease-out', display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    <span>⚠️ This series is already in your favorites!</span>
                </div>
            )}

            <style>
                {`
                @keyframes popIn {
                    0% { transform: scale(0); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                `}
            </style>

            {!query ? (
                // Show Recent Searches when no query
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h3 style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem', letterSpacing: '1px' }}>RECENT SEARCHES</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {recentSearches.length > 0 ? recentSearches.map((term, i) => (
                            <Link key={i} to={`/search?q=${encodeURIComponent(term)}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', textDecoration: 'none', padding: '10px', background: '#111', border: '1px solid #222' }}>
                                <MdHistory color="#666" />
                                {term}
                            </Link>
                        )) : (
                            <div style={{ color: '#444', fontStyle: 'italic' }}>No recent searches</div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {genreSearchData ? (
                        // GENRE SEARCH UI
                        <div>
                            {/* High Trending in Genre */}
                            <h2 style={{
                                color: '#fff', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '1px', marginBottom: '20px', textTransform: 'uppercase', fontFamily: '"Amazon Ember", Arial, sans-serif'
                            }}>
                                {genreSearchData.genreName} TRENDING
                            </h2>
                            <div style={{ display: 'flex', overflowX: 'auto', gap: '15px', paddingBottom: '20px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {genreSearchData.trending.map((item) => (
                                    <div key={item.id} style={{ flex: '0 0 auto', width: starSeriesIds.has(item.id) ? '185px' : '160px', position: 'relative', paddingTop: starSeriesIds.has(item.id) ? '20px' : '0', paddingLeft: starSeriesIds.has(item.id) ? '20px' : '0', transition: 'all 0.3s' }} onClick={(e) => handleSeriesClick(e, item)}>
                                        <Link to={selectForFavorite ? '#' : `/tv/${item.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', pointerEvents: selectForFavorite ? 'none' : 'auto', position: 'relative', overflow: 'visible' }}>
                                            {starSeriesIds.has(item.id) && <PosterBadge />}
                                            <img
                                                src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/300x450/141414/FFFF00?text='}
                                                alt={item.name}
                                                style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                                            />
                                        </Link>
                                    </div>
                                ))}
                            </div>

                            {/* People Also Like (Underrated) */}
                            <div style={{ marginTop: '30px' }}>
                                <h2 style={{
                                    color: '#fff', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '1px', marginBottom: '20px', textTransform: 'uppercase', fontFamily: '"Amazon Ember", Arial, sans-serif'
                                }}>
                                    PEOPLE ALSO LIKE THIS
                                </h2>
                                <div style={{ display: 'flex', overflowX: 'auto', gap: '15px', paddingBottom: '20px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    {genreSearchData.underrated.map((item) => (
                                        <div key={item.id} style={{ flex: '0 0 auto', width: starSeriesIds.has(item.id) ? '185px' : '160px', position: 'relative', paddingTop: starSeriesIds.has(item.id) ? '20px' : '0', paddingLeft: starSeriesIds.has(item.id) ? '20px' : '0', transition: 'all 0.3s' }} onClick={(e) => handleSeriesClick(e, item)}>
                                            <Link to={selectForFavorite ? '#' : `/tv/${item.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', pointerEvents: selectForFavorite ? 'none' : 'auto', position: 'relative', overflow: 'visible' }}>
                                                {starSeriesIds.has(item.id) && <PosterBadge />}
                                                <img
                                                    src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/300x450/141414/FFFF00?text='}
                                                    alt={item.name}
                                                    style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                                                />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // NORMAL SEARCH UI
                        <>
                            <h2 className="section-title">Search Results for "{query}"</h2>
                            <div style={{ display: 'flex', overflowX: 'auto', gap: '15px', paddingBottom: '20px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {results.length === 0 ? <p style={{ color: '#999' }}>No series found with that name.</p> : results.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{ flex: '0 0 auto', width: starSeriesIds.has(item.id) ? '185px' : '160px', position: 'relative', paddingTop: starSeriesIds.has(item.id) ? '20px' : '0', paddingLeft: starSeriesIds.has(item.id) ? '20px' : '0', transition: 'all 0.3s' }} // Vertical Poster Width
                                        onClick={(e) => handleSeriesClick(e, item)}
                                    >
                                        <Link
                                            to={selectForFavorite ? '#' : `/tv/${item.id}`}
                                            style={{ display: 'block', textDecoration: 'none', color: 'inherit', pointerEvents: selectForFavorite ? 'none' : 'auto', position: 'relative', overflow: 'visible' }}>
                                            {starSeriesIds.has(item.id) && <PosterBadge />}
                                            <img
                                                src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/300x450/141414/FFFF00?text=No+Image'}
                                                alt={item.name}
                                                style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1 }}
                                            />
                                        </Link>
                                    </div>
                                ))}
                            </div>

                            {/* YOU MAY ALSO LIKE SECTION (Recommendations) */}
                            <div style={{ marginTop: '40px', borderTop: '1px solid #333', paddingTop: '30px' }}>
                                <h2 style={{
                                    color: '#fff', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '1px', marginBottom: '30px', textTransform: 'uppercase', fontFamily: '"Amazon Ember", Arial, sans-serif'
                                }}>
                                    YOU MAY ALSO LIKE
                                </h2>

                                <GenreRow title="SCI-FI & FANTASY" genreId="10765" apiKey={TMDB_API_KEY} starSeriesIds={starSeriesIds} />
                                <GenreRow title="HORROR" genreId="27" apiKey={TMDB_API_KEY} starSeriesIds={starSeriesIds} />
                                <GenreRow title="COMEDY" genreId="35" apiKey={TMDB_API_KEY} starSeriesIds={starSeriesIds} />
                                <GenreRow title="CRIME" genreId="80" apiKey={TMDB_API_KEY} starSeriesIds={starSeriesIds} />
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

// Sub-component for Genre Rows
function GenreRow({ title, genreId, apiKey, starSeriesIds }) {
    const [series, setSeries] = useState([]);

    useEffect(() => {
        const fetchGenre = async () => {
            try {
                const res = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=${genreId}&sort_by=popularity.desc&page=1`);
                const data = await res.json();
                setSeries(data.results || []);
            } catch (err) {
                console.error(`Error fetching ${title}`, err);
            }
        };
        fetchGenre();
    }, [genreId, apiKey]);

    if (series.length === 0) return null;

    return (
        <div style={{ marginBottom: '40px' }}>
            <h3 style={{
                color: '#ddd',
                fontSize: '1.1rem',
                fontWeight: '900',
                marginBottom: '15px',
                marginLeft: '5px'
            }}>{title}</h3>
            <div style={{ display: 'flex', overflowX: 'auto', gap: '15px', paddingBottom: '10px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {series.map(item => (
                    <div key={item.id} style={{ flex: '0 0 auto', width: starSeriesIds.has(item.id) ? '175px' : '150px', paddingTop: starSeriesIds.has(item.id) ? '20px' : '0', paddingLeft: starSeriesIds.has(item.id) ? '20px' : '0', transition: 'all 0.3s' }}>
                        <Link
                            to={`/tv/${item.id}`}
                            style={{ width: '100%', position: 'relative', display: 'block', overflow: 'visible' }}
                        >
                            {starSeriesIds.has(item.id) && <PosterBadge />}
                            <img
                                src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/300x450/111/333?text='}
                                alt={item.name}
                                style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '4px', display: 'block', position: 'relative', zIndex: 1 }}
                            />
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Search;
