import React, { useCallback, useEffect, useRef, useState } from 'react';
import api, { createMapControlSocket } from './api';
import './CharacterMap.scss';

export default function CharacterMap({ character, onBack, onSelectCharacter }) {
    const hasCharacter = Boolean(character);
    const mapId = character?.CurrentMap;
    const [mapCharacters, setMapCharacters] = useState([]);
    const [mapData, setMapData] = useState(null);
    const [isLoadingMapData, setIsLoadingMapData] = useState(false);
    const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
    const [mapLoadError, setMapLoadError] = useState('');
    const [loadError, setLoadError] = useState('');
    const [socketStatus, setSocketStatus] = useState('disconnected');
    const [toasts, setToasts] = useState([]);
    const [devEdits, setDevEdits] = useState({});
    const [devUpdatingById, setDevUpdatingById] = useState({});
    const [devError, setDevError] = useState('');
    const toastTimersRef = useRef({});

    const addToast = useCallback((id, type, text) => {
        setToasts((prev) => {
            if (prev.some((t) => t.id === id)) return prev;
            return [...prev, { id, type, text }];
        });

        toastTimersRef.current[id] = window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
            delete toastTimersRef.current[id];
        }, 6000);
    }, []);

    useEffect(() => {
        const timers = toastTimersRef.current;
        return () => {
            Object.values(timers).forEach(window.clearTimeout);
        };
    }, []);

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

    useEffect(() => {
        fetchMapData(true);
        fetchCharactersInMap(true);

        if (!hasCharacter || !mapId) {
            return;
        }

        const intervalId = window.setInterval(() => {
            fetchCharactersInMap();
        }, 30000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [hasCharacter, mapId]);

    useEffect(() => {
        if (!hasCharacter || !mapId) {
            setSocketStatus('disconnected');
            return undefined;
        }

        let isActive = true;
        let reconnectTimeoutId;
        let socket;

        const connect = () => {
            if (!isActive) {
                return;
            }

            setSocketStatus('connecting');
            socket = createMapControlSocket(mapId);

            socket.onopen = () => {
                if (isActive) {
                    setSocketStatus('live');
                }
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message?.Map) {
                        setMapData(message.Map);
                    }

                    if (message?.Type === 'zoneCaptured' && message.ZoneId && message.ControllingTeamId) {
                        const toastId = `zone-${message.ZoneId}-${message.ControllingTeamId}`;
                        addToast(toastId, 'capture', `Zone captured by ${formatTeamLabel(message.ControllingTeamId)}`);
                    }

                    if (message?.Type === 'mapWon' && message.WinningTeamId) {
                        const toastId = `win-${message.MapId}-${message.WinningTeamId}`;
                        addToast(toastId, 'win', `${formatTeamLabel(message.WinningTeamId)} has won the map!`);
                    }
                } catch {
                    // Ignore malformed socket payloads.
                }
            };

            socket.onerror = () => {
                if (isActive) {
                    setSocketStatus('error');
                }
            };

            socket.onclose = () => {
                if (!isActive) {
                    return;
                }

                setSocketStatus('disconnected');
                reconnectTimeoutId = window.setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            isActive = false;
            if (reconnectTimeoutId) {
                window.clearTimeout(reconnectTimeoutId);
            }
            if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
                socket.close();
            }
        };
    }, [hasCharacter, mapId]);

    const zones = Array.isArray(mapData?.Zones) ? mapData.Zones : [];
    const mapWinnerLabel = formatTeamLabel(mapData?.WinningTeamId);

    const updateDevEdit = (characterId, patch) => {
        setDevEdits((prev) => {
            const current = prev[characterId] ?? {};
            return {
                ...prev,
                [characterId]: {
                    ...current,
                    ...patch,
                },
            };
        });
    };

    const getDevEditForCharacter = (mapCharacter) => {
        const zoneValue = mapCharacter?.CurrentZone ? String(mapCharacter.CurrentZone) : '';
        const powerValue = Number.isFinite(Number(mapCharacter?.Power)) ? Number(mapCharacter.Power) : 0;
        const existing = devEdits[mapCharacter.CharacterId];

        return {
            zoneId: existing?.zoneId ?? zoneValue,
            power: existing?.power ?? powerValue,
        };
    };

    const applyDevCharacterUpdate = async (mapCharacter) => {
        const edit = getDevEditForCharacter(mapCharacter);
        const nextPower = Number.parseInt(String(edit.power), 10);

        if (!edit.zoneId) {
            setDevError('Select a zone before applying.');
            return;
        }

        if (!Number.isFinite(nextPower) || nextPower < 0) {
            setDevError('Power must be a non-negative integer.');
            return;
        }

        setDevError('');
        setDevUpdatingById((prev) => ({ ...prev, [mapCharacter.CharacterId]: true }));

        try {
            await api.put('/api/RealmData/DevUpdateCharacterZoneAndPowerAsync', {
                CharacterId: mapCharacter.CharacterId,
                ZoneId: edit.zoneId,
                Power: nextPower,
            });

            addToast(`dev-${mapCharacter.CharacterId}-${Date.now()}`, 'capture', `Updated ${mapCharacter.CharacterId.slice(0, 8)}`);
            await fetchCharactersInMap();
            await fetchMapData();
        } catch (err) {
            const message = err.response?.data || 'Failed to update character.';
            setDevError(typeof message === 'string' ? message : 'Failed to update character.');
        } finally {
            setDevUpdatingById((prev) => ({ ...prev, [mapCharacter.CharacterId]: false }));
        }
    };

    return (
        <div className="character-map-page">
            {toasts.length > 0 && (
                <div className="toast-container" role="status" aria-live="polite">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`toast toast--${toast.type}`}
                        >
                            {toast.text}
                        </div>
                    ))}
                </div>
            )}
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
                        <p className={`socket-status socket-status--${socketStatus}`}>
                            Realtime: {socketStatus}
                        </p>

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
                                    {mapData.WinningTeamId && (
                                        <div className="winner-banner">
                                            <span className="winner-banner__label">Map Winner</span>
                                            <strong>{mapWinnerLabel}</strong>
                                        </div>
                                    )}

                                    <h3>Zones</h3>
                                    {zones.length > 0 ? (
                                        <ul className="zone-list">
                                            {zones.map((zone) => {
                                                const zoneId = zone.ZoneId ?? zone.Id;
                                                const currentPopulation = zone.Characters?.length ?? 0;
                                                const captureThreshold = Number(zone.CaptureThresholdPercentage ?? 100);
                                                const leadingControl = Number(zone.LeadingControlPercentage ?? 0);
                                                const progress = captureThreshold > 0
                                                    ? Math.min((leadingControl / captureThreshold) * 100, 100)
                                                    : 0;
                                                return (
                                                    <li key={zoneId} className="zone-item">
                                                        <div className="zone-item__row">
                                                            <strong>{zone.Name ?? 'Unnamed Zone'}</strong>
                                                            <span className="zone-item__status">
                                                                {zone.ControllingTeamId
                                                                    ? `Held by ${formatTeamLabel(zone.ControllingTeamId)}`
                                                                    : zone.CapturingTeamId
                                                                        ? `Capturing: ${formatTeamLabel(zone.CapturingTeamId)}`
                                                                        : 'Neutral'}
                                                            </span>
                                                        </div>
                                                        <span>Zone {zoneId}</span>
                                                        <span>
                                                            Pop {currentPopulation}
                                                        </span>
                                                        <span>{zone.IsContested ? 'Contested' : 'Not contested'}</span>
                                                        <span>
                                                            Control {leadingControl.toFixed(1)} / {captureThreshold.toFixed(1)}
                                                        </span>
                                                        <div className="zone-progress" aria-hidden="true">
                                                            <div className="zone-progress__fill" style={{ width: `${progress}%` }} />
                                                        </div>
                                                        {Array.isArray(zone.ControlPercentages) && zone.ControlPercentages.length > 0 && (
                                                            <div className="zone-breakdown">
                                                                {zone.ControlPercentages
                                                                    .slice()
                                                                    .sort((left, right) => (right.Percentage ?? 0) - (left.Percentage ?? 0))
                                                                    .map((control) => {
                                                                        const teamControl = Number(control.Percentage ?? 0);
                                                                        const captureProgress = captureThreshold > 0
                                                                            ? Math.min((teamControl / captureThreshold) * 100, 100)
                                                                            : 0;

                                                                        return (
                                                                            <div
                                                                                key={`${zoneId}-${control.TeamId}`}
                                                                                className="zone-breakdown__item"
                                                                            >
                                                                                <span>{formatTeamLabel(control.TeamId)}</span>
                                                                                <span>{captureProgress.toFixed(1)}%</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p>No zones returned for this map.</p>
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
                                <>
                                    {devError && <p className="error-message">{devError}</p>}
                                    <ul className="map-character-list">
                                        {mapCharacters.map((mapCharacter) => {
                                            const devEdit = getDevEditForCharacter(mapCharacter);
                                            const isUpdating = Boolean(devUpdatingById[mapCharacter.CharacterId]);

                                            return (
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
                                                    <div className="map-character-dev-controls">
                                                        <label>
                                                            Zone
                                                            <select
                                                                value={devEdit.zoneId}
                                                                onChange={(event) => updateDevEdit(mapCharacter.CharacterId, { zoneId: event.target.value })}
                                                            >
                                                                <option value="">Select zone</option>
                                                                {zones.map((zone) => {
                                                                    const zoneId = String(zone.ZoneId ?? zone.Id ?? '');
                                                                    return (
                                                                        <option key={zoneId} value={zoneId}>
                                                                            {zone.Name ?? 'Zone'} ({zoneId.slice(0, 8)})
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </label>
                                                        <label>
                                                            Power
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={devEdit.power}
                                                                onChange={(event) => updateDevEdit(mapCharacter.CharacterId, { power: event.target.value })}
                                                            />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className="dev-apply-button"
                                                            onClick={() => applyDevCharacterUpdate(mapCharacter)}
                                                            disabled={isUpdating}
                                                        >
                                                            {isUpdating ? 'Applying...' : 'Apply'}
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </>
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

function formatTeamLabel(teamId) {
    if (!teamId || typeof teamId !== 'string') {
        return 'None';
    }

    return `Team ${teamId.slice(0, 8)}`;
}
