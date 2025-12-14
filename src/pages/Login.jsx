import { useState } from 'react';
import SignUp from '../components/SignUp';
import SignIn from '../components/SignIn';
import ForgotPassword from '../components/ForgotPassword';
import './Login.css';

const Login = ({ onLogin }) => {
  const [view, setView] = useState('signin');
  const [message, setMessage] = useState('');

  const handleToggle = (newView) => {
    setView(newView);
    setMessage('');
  };

  const handleSuccess = (msg) => {
    setMessage(msg);
    setView('signin');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {message && <p className="success-message">{message}</p>}

        {view === 'signup' && (
          <SignUp onToggle={handleToggle} onSuccess={handleSuccess} />
        )}

        {view === 'signin' && (
          <SignIn onToggle={handleToggle} onLogin={onLogin} />
        )}

        {view === 'forgot' && (
          <ForgotPassword onToggle={handleToggle} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
};

export default Login;
