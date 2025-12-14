import React, { forwardRef } from 'react';
import { MdStar } from 'react-icons/md';

const StoryCard = forwardRef(({ movie, review, user, rating }, ref) => {
    // Canvas: 1080 x 1080 px (1:1 Square)
    // Background: Solid Dark (#000000)
    // Layout: 85% width content area. 90px padding all sides.

    // Poster logic
    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Image';

    const bgStyle = {
        width: '1080px',
        height: '1080px',
        background: '#000000',
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
        color: 'white',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '90px'
    };

    // Extract Season/Episode directly from name if constructed as "Title (S#E#)"
    const seasonEpisodeMatch = movie.name.match(/\(S(\d+)E(\d+)\)/);
    // Title clean-up: Remove the (S#E#) part for main title display
    const cleanTitle = movie.name.replace(/\(S\d+E\d+\)/, '').split(':')[0].trim();
    // Reconstruct S#E# string for separate display if needed, or use the matched one
    const episodeInfo = seasonEpisodeMatch ? `S${seasonEpisodeMatch[1]} E${seasonEpisodeMatch[2]}` : null;

    return (
        <div ref={ref} style={bgStyle} id="story-card-element">

            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                gap: '60px',
                alignItems: 'center'
            }}>

                {/* Left: Poster Container (Vertical 2:3 ratio inside Square card) */}
                <div style={{
                    width: '400px',
                    height: '600px', // 2:3 Aspect ratio approx
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 40px rgba(255,255,255,0.1)',
                    flexShrink: 0,
                    position: 'relative'
                }}>
                    <img
                        src={posterUrl}
                        alt="Poster"
                        crossOrigin="anonymous"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </div>

                {/* Right: Info Column */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '20px',
                    height: '100%'
                }}>
                    {/* Branding Top Right aligned */}
                    <div style={{
                        fontSize: '48px', // Increased from 32px
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: '900',
                        letterSpacing: '4px',
                        textTransform: 'uppercase',
                        marginBottom: 'auto', // Push to top
                        alignSelf: 'flex-start',
                        marginTop: '20px'
                    }}>
                        <span style={{ color: '#FFCC00' }}>S</span>
                        <span style={{ color: 'white' }}>ERIEE</span>
                    </div>

                    {/* Title & Info Wrapper */}
                    <div>
                        <h1 style={{
                            fontSize: '40px',
                            fontWeight: '900',
                            margin: 0,
                            lineHeight: '1.2',
                            textTransform: 'uppercase',
                            marginBottom: '10px'
                        }}>
                            {cleanTitle}
                        </h1>

                        {/* Episode/Season Info */}
                        {(episodeInfo || movie.seasonName) && (
                            <div style={{
                                fontSize: '28px',
                                color: '#FFCC00',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                marginTop: '5px'
                            }}>
                                {/* Prefer Season Name if available and it's an episode share, else display constructed S#E# */}
                                {movie.seasonName ? `${movie.seasonName} ${episodeInfo ? `• ${episodeInfo.split(' ')[1]}` : ''}` : episodeInfo}
                            </div>
                        )}
                    </div>

                    {/* Stars */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[...Array(5)].map((_, i) => (
                            <MdStar
                                key={i}
                                size={28}
                                color={i < Math.round(rating) ? "#FFCC00" : "#333"}
                            />
                        ))}
                    </div>

                    {/* Review Text */}
                    <p style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: '#ddd',
                        margin: 0,
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 8,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: 'auto'
                    }}>
                        "{review}"
                    </p>
                </div>
            </div>
        </div>
    );
});

export default StoryCard;
