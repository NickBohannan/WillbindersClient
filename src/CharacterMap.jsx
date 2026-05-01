import React, { useEffect, useState } from 'react';
import api from './api';
import './CharacterMap.scss';

export default function CharacterMap({ character, onBack, onSelectCharacter }) {
    const hasCharacter = Boolean(character);
    const mapId = character?.CurrentMap;
    const [mapCharacters, setMapCharacters] = useState([]);
    const [mapData, setMapData] = useState(null);
    const [controlScores, setControlScores] = useState([]);
    const [isLoadingMapData, setIsLoadingMapData] = useState(false);
    const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
    const [isLoadingControlScores, setIsLoadingControlScores] = useState(false);
    const [mapLoadError, setMapLoadError] = useState('');
    const [loadError, setLoadError] = useState('');
    const [controlScoreError, setControlScoreError] = useState('');

    const fetchCharactersInMap = async (showLoadingState = false) => {
        if (!hasCharacter || !mapId) {
            setMapCharacters([]);
            setLoadError('');
            setIsLoadingCharacters(false);
            return;
        }

        if (showLoadingState) {
            setIsLoadingCharacters(true);
        }
        setLoadError('');

        try {
            const { data } = await api.get(
                `/api/RealmData/GetAllCharactersInMapAsync/${mapId}`
            );
            setMapCharacters(data?.Characters ?? []);
        } catch (err) {
            const message = err.response?.data || 'Failed to load map characters.';
            setLoadError(typeof message === 'string' ? message : 'Failed to load map characters.');
            setMapCharacters([]);
        } finally {
            setIsLoadingCharacters(false);
        }
    };

    const fetchMapData = async (showLoadingState = false) => {
        if (!hasCharacter || !mapId) {
            setMapData(null);
            setMapLoadError('');
            setIsLoadingMapData(false);
            return;
        }

        if (showLoadingState) {
            setIsLoadingMapData(true);
        }
        setMapLoadError('');

        try {
            const { data } = await api.get(`/api/RealmData/GetMapAsync/${mapId}`);
            setMapData(data ?? null);
        } catch (err) {
            const message = err.response?.data || 'Failed to load map data.';
            setMapLoadError(typeof message === 'string' ? message : 'Failed to load map data.');
            setMapData(null);
        } finally {
            setIsLoadingMapData(false);
        }
    };

    const fetchControlScores = async (showLoadingState = false) => {
        if (!hasCharacter || !mapId) {
            setControlScores([]);
            setControlScoreError('');
            setIsLoadingControlScores(false);
            return;
        }

        if (showLoadingState) {
            setIsLoadingControlScores(true);
        }
        setControlScoreError('');

        try {
            const { data } = await api.get(`/api/RealmData/GetControlAccumulationScoresByMapAsync/${mapId}`);
            setControlScores(Array.isArray(data) ? data : []);
        } catch (err) {
            const message = err.response?.data || 'Failed to load control accumulation scores.';
            setControlScoreError(typeof message === 'string' ? message : 'Failed to load control accumulation scores.');
            setControlScores([]);
        } finally {
            setIsLoadingControlScores(false);
        }
    };

    useEffect(() => {
        fetchMapData(true);
        fetchCharactersInMap(true);
        fetchControlScores(true);

        if (!hasCharacter || !mapId) {
            return;
        }

        const intervalId = window.setInterval(() => {
            fetchMapData();
            fetchCharactersInMap();
            fetchControlScores();
        }, 30000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [hasCharacter, mapId]);

    const zoneNameById = Array.isArray(mapData?.Zones)
        ? new Map(
            mapData.Zones
                .map((zone) => [zone.ZoneId ?? zone.Id, zone.Name ?? 'Unnamed Zone'])
                .filter(([zoneId]) => typeof zoneId === 'string' && zoneId.length > 0)
        )
        : new Map();

    return (
        <div className="character-map-page">
            <div className="character-map-card">
                <div className="character-map-header">
                    <h1>{hasCharacter ? `Map ${character.CurrentMap}` : 'Enter Map'}</h1>
                    <button type="button" className="back-button" onClick={onBack}>Back</button>
                </div>

                {hasCharacter ? (
                    <>
                        <p>You entered your character's current map.</p>
                        <p><strong>Character ID:</strong> {character.CharacterId}</p>
                        <p><strong>Map:</strong> {character.CurrentMap}</p>
                        <p><strong>Zone:</strong> {character.CurrentZone}</p>
                        <p><strong>Team:</strong> {character.TeamId}</p>

                        <div className="map-data-section">
                            <h2>Map Data</h2>
                            {isLoadingMapData && <p>Loading map data...</p>}
                            {!isLoadingMapData && mapLoadError && (
                                <p className="error-message">{mapLoadError}</p>
                            )}
                            {!isLoadingMapData && !mapLoadError && mapData && (
                                <>
                                    <p><strong>Name:</strong> {mapData.Name ?? 'Unknown'}</p>
                                    <p><strong>Map Id:</strong> {mapData.Id ?? mapData.MapId ?? mapId}</p>
                                    <p><strong>Zone Count:</strong> {mapData.ZoneCount ?? mapData.Zones?.length ?? 0}</p>

                                    <h3>Zones</h3>
                                    {Array.isArray(mapData.Zones) && mapData.Zones.length > 0 ? (
                                        <ul className="zone-list">
                                            {mapData.Zones.map((zone) => {
                                                const zoneId = zone.ZoneId ?? zone.Id;
                                                const currentPopulation = zone.CurrentPopulation ?? zone.Characters?.length ?? 0;
                                                return (
                                                    <li key={zoneId} className="zone-item">
                                                        <span>#{zoneId}</span>
                                                        <span>{zone.Name ?? 'Unnamed Zone'}</span>
                                                        <span>
                                                            Pop {currentPopulation}
                                                            {zone.MaxPopulation ? ` / ${zone.MaxPopulation}` : ''}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p>No zones returned for this map.</p>
                                    )}

                                    <h3>Control Accumulation Scores</h3>
                                    {isLoadingControlScores && <p>Loading control accumulation scores...</p>}
                                    {!isLoadingControlScores && controlScoreError && (
                                        <p className="error-message">{controlScoreError}</p>
                                    )}
                                    {!isLoadingControlScores && !controlScoreError && controlScores.length === 0 && (
                                        <p>No control accumulation scores found for this map.</p>
                                    )}
                                    {!isLoadingControlScores && !controlScoreError && controlScores.length > 0 && (
                                        <ul className="control-score-list">
                                            {controlScores.map((score, index) => (
                                                <li
                                                    key={`${score.TeamId}-${score.MapId}-${score.ZoneId}-${index}`}
                                                    className="control-score-item"
                                                >
                                                    <span>Map {score.MapId}</span>
                                                    <span>Zone {score.ZoneId} ({zoneNameById.get(score.ZoneId) ?? 'Unknown'})</span>
                                                    <span>Team {score.TeamId}</span>
                                                    <span>Accumulation {Number(score.Accumulation ?? 0).toFixed(2)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="map-characters-section">
                            <h2>Characters In This Map</h2>
                            {isLoadingCharacters && <p>Loading map characters...</p>}
                            {!isLoadingCharacters && loadError && (
                                <p className="error-message">{loadError}</p>
                            )}
                            {!isLoadingCharacters && !loadError && mapCharacters.length === 0 && (
                                <p>No characters currently found in this map.</p>
                            )}
                            {!isLoadingCharacters && !loadError && mapCharacters.length > 0 && (
                                <ul className="map-character-list">
                                    {mapCharacters.map((mapCharacter) => (
                                        <li
                                            key={mapCharacter.CharacterId}
                                            className={`map-character-item ${
                                                mapCharacter.CharacterId === character.CharacterId ? 'is-current' : ''
                                            }`}
                                        >
                                            <span>{mapCharacter.CharacterId}</span>
                                            <span>Team {mapCharacter.TeamId}</span>
                                            <span>Zone {mapCharacter.CurrentZone}</span>
                                            <span>Power {mapCharacter.Power}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <p>No character selected yet.</p>
                        <button type="button" className="select-character-button" onClick={onSelectCharacter}>
                            Choose Character
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
