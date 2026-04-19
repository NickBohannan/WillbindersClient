import React, { useState } from 'react';
import './Login.css';
import api from './api';

export default function Login({ onSwitch, onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/api/Auth/login', { email, password });
            localStorage.setItem('token', data.Token);
            localStorage.setItem('userId', data.UserId);
            localStorage.setItem('email', data.Email);
            console.log('Login successful:', data);
            onLogin();
        } catch (err) {
            console.error('Login failed:', err);
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
                <p className="switch-link">
                    Don't have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); onSwitch(); }}>Register</a>
                </p>
            </div>
        </div>
    );
}