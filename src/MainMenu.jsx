import React from 'react';
import './MainMenu.scss';

const menuItems = [
    { label: 'Enter Map', page: 'map' },
    { label: 'Select Character', page: 'selectCharacter' },
    { label: 'New Character', page: 'newCharacter' },
    { label: 'Options', page: 'options' },
];

export default function MainMenu({ onNavigate }) {
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
        onNavigate('login');
    };

    return (
        <div className="menu-container">
            <h1 className="menu-title">Willbinders</h1>
            <nav className="menu-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.page}
                        className="menu-button"
                        onClick={() => onNavigate(item.page)}
                    >
                        {item.label}
                    </button>
                ))}
                <button className="menu-button logout-button" onClick={handleLogout}>
                    Logout
                </button>
            </nav>
        </div>
    );
}
