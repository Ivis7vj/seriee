import { useState, useEffect } from 'react';
import { MdStarBorder, MdRemoveCircleOutline, MdClose } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase-config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './Home.css';
import '../pages/Home.css'; // Ensure CSS is loaded

const Watchlist = () => {
    const { currentUser } = useAuth();
    const [watchlist, setWatchlist] = useState([]);
    const [basketData, setBasketData] = useState(null); // Replaces viewingSeriesId

    useEffect(() => {
        if (!currentUser) return;
        const fetchWatchlist = async () => {
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setWatchlist(userSnap.data().watchlist || []);
            }
        };
        fetchWatchlist();
    }, [currentUser]);

    // Profile-style Grouping Logic (Season Baskets)
    const processWatchlist = (list) => {
        let processed = [];
        const groups = {}; // Key: "seriesId_SseasonNumber"

        // 1. Identify Episode Baskets
        list.forEach(item => {
            if (item.seasonNumber && item.episodeNumber) {
                const key = `${item.seriesId || item.id}_S${item.seasonNumber}`;
                if (!groups[key]) {
                    groups[key] = {
                        type: 'basket',
                        seriesId: item.seriesId || item.id,
                        seasonNumber: item.seasonNumber,
                        name: item.name, // Will be Series Name usually or Episode Name. We fix name below.
                        poster_path: item.poster_path, // Series Poster
                        pluginPoster: item.seasonPoster, // Season Poster (Prioritized)
                        episodes: []
                    };
                }
                groups[key].episodes.push(item);
                if (!groups[key].pluginPoster && item.seasonPoster) groups[key].pluginPoster = item.seasonPoster;
            }
        });

        // 2. Add Whole Series/Seasons (Dedupe check)
        list.forEach(item => {
            if (item.seasonNumber && item.episodeNumber) return; // Handled

            const basketKey = `${item.seriesId || item.id}_S${item.seasonNumber}`;
            if (item.seasonNumber && groups[basketKey]) return; // Deduplicate: specific season exists as basket

            processed.push({ ...item, type: 'series', isSeason: !!item.seasonNumber });
        });

        // 3. Add Baskets to Processed
        Object.values(groups).forEach(basket => {
            basket.episodeCount = basket.episodes.length;
            basket.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
            // Use season poster logic
            if (basket.pluginPoster) basket.poster_path = basket.pluginPoster;

            // Clean name (remove Episode specific stuff if present)
            // Ideally we get Series Name. The episode item has `name` as `Series - S1E1: Title`.
            // We can parse or pass `seriesName` separately in `itemToSave` in MovieDetails. 
            // In MovieDetails itemToSave: `name: ${details.name} - S...`.
            // We can split by " - ".
            if (basket.episodes[0]) {
                const parts = basket.episodes[0].name.split(' - ');
                basket.name = parts[0] + (basket.seasonNumber ? ` (Season ${basket.seasonNumber})` : '');
            }

            processed.push(basket);
        });

        return processed;
    };

    const removeFromWatchlist = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) return;
        const updated = watchlist.filter(item => item.id !== id);
        setWatchlist(updated);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { watchlist: updated });
        } catch (error) { console.error(error); }

        // Close modal if item removed was inside
        if (basketData && basketData.episodes.some(i => i.id === id)) {
            const newBasketEps = basketData.episodes.filter(i => i.id !== id);
            if (newBasketEps.length === 0) setBasketData(null);
            else setBasketData({ ...basketData, episodes: newBasketEps });
        }
    };

    const items = processWatchlist(watchlist);

    return (
        <div className="section" style={{ padding: '20px' }}>
            <h2 className="section-title">Your Watchlist <span style={{ fontSize: '1rem', color: '#666', fontWeight: 'normal' }}>({watchlist.length} items)</span></h2>

            {watchlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    <p>Your watchlist is empty.</p>
                    <Link to="/" style={{ color: '#00cc33', textDecoration: 'none' }}>Browse popular titles</Link>
                </div>
            ) : (
                <div className="watchlist-grid">
                    {items.map((item, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                            {item.type === 'basket' ? (
                                <div onClick={() => setBasketData(item)} style={{ cursor: 'pointer', display: 'block', border: 'none', aspectRatio: '2/3', position: 'relative' }}>
                                    <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{
                                        position: 'absolute', bottom: '10px', right: '10px',
                                        background: '#FFCC00', color: '#000',
                                        padding: '4px 8px', borderRadius: '4px',
                                        fontWeight: 'bold', fontSize: '0.8rem'
                                    }}>
                                        {item.episodeCount} EPS
                                    </div>
                                </div>
                            ) : (
                                <Link to={item.seasonNumber ? `/tv/${item.seriesId || item.id}/season/${item.seasonNumber}` : `/tv/${item.seriesId || item.id}`} style={{ display: 'block', border: 'none', aspectRatio: '2/3', position: 'relative' }}>
                                    <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    {item.seasonNumber && !item.episodeNumber && (
                                        <div style={{
                                            position: 'absolute', bottom: '10px', right: '10px',
                                            background: 'rgba(0,0,0,0.8)', color: '#fff',
                                            padding: '4px 8px', borderRadius: '4px',
                                            fontWeight: 'bold', fontSize: '0.8rem'
                                        }}>
                                            S{item.seasonNumber}
                                        </div>
                                    )}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Basket Modal/Overlay for Episodes */}
            {basketData && (
                <div className="basket-modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.9)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="basket-content" style={{
                        width: '90%', maxWidth: '800px', maxHeight: '80vh',
                        background: '#111', overflowY: 'auto', padding: '20px',
                        borderRadius: '8px', border: '1px solid #333'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#fff' }}>{basketData.name}</h2>
                            <button onClick={() => setBasketData(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><MdClose size={24} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
                            {basketData.episodes.map(ep => (
                                <div key={ep.id} style={{ position: 'relative' }}>
                                    <Link to={`/tv/${ep.seriesId}/season/${ep.seasonNumber}/episode/${ep.episodeNumber}`}>
                                        <img src={`https://image.tmdb.org/t/p/w300${ep.still_path || ep.poster_path}`} style={{ width: '100%', borderRadius: '4px' }} />
                                    </Link>
                                    <button onClick={(e) => removeFromWatchlist(e, ep.id)} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.7)', color: 'red', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: '4px' }}>
                                        <MdRemoveCircleOutline />
                                    </button>
                                    <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#ccc' }}>
                                        S{ep.seasonNumber} E{ep.episodeNumber}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Watchlist;

