import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/public';

const client = axios.create({ baseURL: BASE_URL });

export const getStatus = () => client.get('/status');
export const getUptimeHistory = (days = 90) => client.get('/uptime-history', { params: { days } });
export const getPublicIncidents = (limit = 10) => client.get('/incidents', { params: { limit } });
