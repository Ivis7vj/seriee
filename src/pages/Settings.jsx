
import { MdSettings, MdLogout, MdDeleteForever, MdLightMode, MdDarkMode } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import './Home.css';

const Settings = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { confirm } = useNotification();

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        const isConfirmed = await confirm("Are you sure you want to delete your account? This action cannot be undone.", "Delete Account", "Delete", "Cancel");
        if (isConfirmed) {
            localStorage.clear();
            navigate('/login');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', color: 'var(--text-primary)' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '40px', color: 'var(--text-primary)' }}>Settings</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                        <MdSettings /> Account Actions
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <MdLogout size={20} /> Log Out
                        </button>

                        <button
                            onClick={handleDeleteAccount}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#dc3545',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#bb2d3b'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#dc3545'}
                        >
                            <MdDeleteForever size={20} /> Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
