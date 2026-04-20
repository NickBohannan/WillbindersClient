import React, { useState } from 'react';
import './Login.scss';
import api from './api';

export default function Login({ onSwitch, onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { data } = await api.post('/api/Auth/login', { email, password });
            localStorage.setItem('token', data.Token);
            localStorage.setItem('userId', data.UserId);
            localStorage.setItem('email', data.Email);
            onLogin();
        } catch (err) {
            const message = err.response?.data || 'Login failed. Please try again.';
            setError(typeof message === 'string' ? message : 'Login failed. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>
                {error && <p className="error-message">{error}</p>}
                <p className="switch-link">
                    Don't have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); onSwitch(); }}>Register</a>
                </p>
            </div>
        </div>
    );
}