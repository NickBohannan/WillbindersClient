import React, { useEffect, useState } from 'react';
import api from './api';
import './SelectCharacter.scss';

export default function SelectCharacter({ onBack }) {
    const [characters, setCharacters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCharacters = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                setError('No user found in session. Please log in again.');
                setIsLoading(false);
                return;
            }

            try {
                const { data } = await api.get(`/api/RealmData/GetAllCharactersByUserIdAsync/${userId}`);
                setCharacters(data?.Characters ?? []);
            } catch (err) {
                const message = err.response?.data || 'Failed to load characters.';
                setError(typeof message === 'string' ? message : 'Failed to load characters.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCharacters();
    }, []);

    return (
        <div className="select-character-page">
            <div className="select-character-card">
                <div className="select-character-header">
                    <h1>Your Characters</h1>
                    <button className="back-button" onClick={onBack}>Back</button>
                </div>

                {isLoading && <p>Loading characters...</p>}
                {!isLoading && error && <p className="error-message">{error}</p>}
                {!isLoading && !error && characters.length === 0 && (
                    <p>No characters found for your account.</p>
                )}

                {!isLoading && !error && characters.length > 0 && (
                    <ul className="character-list">
                        {characters.map((character) => (
                            <li key={character.CharacterId} className="character-item">
                                <h2>Character #{character.CharacterId}</h2>
                                <p>Team: {character.TeamId}</p>
                                <p>Map: {character.CurrentMap}</p>
                                <p>Zone: {character.CurrentZone}</p>
                                <p>Experience: {character.Experience}</p>
                                <p>Power: {character.Power}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
