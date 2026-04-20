import React, { useState } from 'react';
import './Login.scss';
import api from './api';

export default function Register({ onSwitch }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [registered, setRegistered] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/api/Auth/register', { firstName, lastName, email, password });
            setRegistered(true);
        } catch (err) {
            const message = err.response?.data || 'Registration failed. Please try again.';
            setError(typeof message === 'string' ? message : 'Registration failed. Please try again.');
        }
    };

    if (registered) {
        return (
            <div className="login-container">
                <div className="login-box">
                    <h1>Check Your Email</h1>
                    <p>Registration successful! Please check your email and click the verification link before logging in.</p>
                    <button className="switch-button" onClick={onSwitch}>Go to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Register</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>
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
                    <button type="submit">Register</button>
                </form>
                {error && <p className="error-message">{error}</p>}
                <p className="switch-link">
                    Already have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); onSwitch(); }}>Login</a>
                </p>
            </div>
        </div>
    );
}
