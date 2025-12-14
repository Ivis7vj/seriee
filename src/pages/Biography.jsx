
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';

const Biography = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [person, setPerson] = useState(null);
    const [credits, setCredits] = useState({ cast: [], crew: [] });
    const [loading, setLoading] = useState(true);

    const TMDB_API_KEY = '05587a49bd4890a9630d6c0e544e0f6f';
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Person Details + Combined Credits
                const res = await fetch(`${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&append_to_response=combined_credits`);
                const data = await res.json();
                setPerson(data);
                setCredits(data.combined_credits);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch person details", err);
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div style={{ color: 'white', padding: '50px' }}>Loading...</div>;
    if (!person) return <div style={{ color: 'white', padding: '50px' }}>Person not found</div>;

    // Calculate Age
    const getAge = (birthDate, deathDate) => {
        if (!birthDate) return 'N/A';
        const birth = new Date(birthDate);
        const end = deathDate ? new Date(deathDate) : new Date();
        let age = end.getFullYear() - birth.getFullYear();
        const m = end.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // Filter: Only TV Series Acted
    const acting = credits.cast
        .filter(c => c.media_type === 'tv')
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 20);

    return (
        <div style={{ padding: '0', background: 'black', minHeight: '100vh', color: 'white', overflowY: 'auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header / Back */}
            <div style={{ padding: '20px', borderBottom: '1px solid #333', background: 'rgba(0,0,0,0.8)', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#FFCC00', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '1.2rem', gap: '5px' }}>
                    <MdArrowBack /> Back
                </button>
                <div style={{ marginLeft: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>{person.name}</div>
            </div>

            <div style={{ display: 'flex', padding: '40px', gap: '40px', flexWrap: 'wrap' }}>
                {/* Left Profile */}
                <div style={{ flexShrink: 0, width: '300px' }}>
                    <img
                        src={person.profile_path ? `https://image.tmdb.org/t/p/h632${person.profile_path}` : 'https://via.placeholder.com/300x450'}
                        alt={person.name}
                        style={{ width: '100%', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    />
                    <div style={{ marginTop: '20px', color: '#ccc', fontSize: '1.1rem' }}>
                        <div style={{ marginBottom: '10px' }}><strong>Age:</strong> {getAge(person.birthday, person.deathday)}</div>
                        <div style={{ marginBottom: '10px' }}><strong>Born:</strong> {person.birthday}</div>
                        {person.deathday && <div style={{ marginBottom: '10px' }}><strong>Died:</strong> {person.deathday}</div>}
                        <div style={{ marginBottom: '10px' }}><strong>Place of Birth:</strong> {person.place_of_birth}</div>
                    </div>
                </div>

                {/* Right Bio & Credits */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h1 style={{ color: '#FFCC00', marginTop: 0 }}>Biography</h1>

                    {/* "News like Wikipedia" - Bio Box */}
                    <div style={{
                        background: '#111',
                        padding: '20px',
                        borderLeft: '4px solid #FFCC00',
                        marginBottom: '30px',
                        lineHeight: '1.8',
                        color: '#e0e0e0',
                        fontSize: '1.1rem',
                        whiteSpace: 'pre-line'
                    }}>
                        {person.biography || "No biography available."}
                        <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#888', fontStyle: 'italic', display: 'flex', justifyContent: 'flex-end' }}>
                            Source: Wikipedia / TMDB
                        </div>
                    </div>

                    {/* TV Series Roles Only */}
                    {acting.length > 0 && (
                        <div style={{ marginTop: '40px' }}>
                            <h2 style={{ color: '#FFCC00', borderBottom: '1px solid #333', paddingBottom: '10px' }}>TV Series Roles</h2>
                            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '20px' }}>
                                {acting.map(c => (
                                    <div
                                        key={c.credit_id}
                                        onClick={() => navigate(`/tv/${c.id}`)}
                                        style={{ width: '140px', flexShrink: 0, cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <img
                                            src={c.poster_path ? `https://image.tmdb.org/t/p/w200${c.poster_path}` : 'https://via.placeholder.com/140x210'}
                                            alt={c.name}
                                            style={{ width: '100%', height: '210px', objectFit: 'cover', borderRadius: '8px' }}
                                        />
                                        <div style={{ fontSize: '0.95rem', marginTop: '8px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#888' }}>{c.character}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{c.first_air_date?.split('-')[0]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Biography;
