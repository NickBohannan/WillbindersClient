import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5075',
});

export default api;
