import React from 'react';
import './MainMenu.css';

const menuItems = [
    { label: 'Enter Map', page: 'map' },
    { label: 'Select Character', page: 'selectCharacter' },
    { label: 'New Character', page: 'newCharacter' },
    { label: 'Options', page: 'options' },
];

export default function MainMenu({ onNavigate }) {
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
            </nav>
        </div>
    );
}
