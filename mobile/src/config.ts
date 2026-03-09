const fallbackBaseUrl = 'https://fit-hub-portal-qpn6.vercel.app';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || fallbackBaseUrl).replace(/\/$/, '');

