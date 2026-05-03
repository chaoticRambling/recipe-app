import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './LoginView.css';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome Back</h1>
        <p>Sign in to manage your recipes.</p>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
        {message && <p className="login-message">{message}</p>}
      </div>
    </div>
  );
}
