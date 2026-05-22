export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
    },
    PATIENT: {
        PROFILE: '/patient/profile',
        MEDICATIONS: '/patient/medications',
    },
    CHAT: {
        TEXT: '/chat/text',
        VOICE: '/chat/voice',
    },
    ADMIN: {
        DASHBOARD: '/admin/dashboard',
        PATIENTS: '/admin/patients',
        INVITES: '/admin/invites',
    }
};
