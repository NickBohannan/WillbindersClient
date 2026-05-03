import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5075',
});

function getWebSocketBaseUrl() {
    const httpBaseUrl = api.defaults.baseURL ?? window.location.origin;
    const url = new URL(httpBaseUrl, window.location.origin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.toString().replace(/\/$/, '');
}

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export function createMapControlSocket(mapId) {
    const token = localStorage.getItem('token');
    const socketUrl = new URL(`${getWebSocketBaseUrl()}/ws/map-control`);
    socketUrl.searchParams.set('mapId', mapId);
    if (token) {
        socketUrl.searchParams.set('access_token', token);
    }

    return new WebSocket(socketUrl.toString());
}

export default api;
