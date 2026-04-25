import axios from 'axios';

const api = axios.create({
    baseURL: 'https://incredible-respect-production.up.railway.app/api/v1/',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

export default api;
