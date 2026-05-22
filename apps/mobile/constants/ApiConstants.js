// API Base URL from .env
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://caresync-backend-ewfcajcdbka3dsag.centralindia-01.azurewebsites.net/api';

export const ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    AUTH: {
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
    },
    USER_PROFILE: '/user/profile',
    USERS: '/users',
    PATIENT_HISTORY: '/patient/history',
    NOTIFICATIONS: {
        REGISTER: '/notifications/register-token',
        HISTORY: '/notifications/history',
        RESPOND: '/notifications/respond',
    },
    CAREGIVER: {
        ASSIGNMENTS: '/caregiver-assignments/patients',
        ASSIGN: '/caregiver-assignments/assign',
        REMOVE: '/caregiver-assignments/remove',
        PATIENT: '/caregiver-assignments/patient',
    },
    PATIENTS: '/patients',
    MEDICATIONS: {
        BASE: '/medications',
        SCHEDULES: '/medication-schedules',
        SCHEDULES_BY_PATIENT: '/medication-schedules/patient',
        LOGS_BY_PATIENT: '/medication-logs/patient',
    },
    VOICE: {
        TRANSCRIBE: '/voice/transcribe',
        SYNTHESIZE: '/voice/synthesize',
    },
    INVITE: {
        SEND: '/invites/send',
        LIST: '/invites/',
        RESEND: (id) => `/invites/${id}/resend`,
        VERIFY: '/invites/',
    },
    CHAT: {
        TEXT: '/chat/text',
        VOICE: '/chat/voice',
    },
    ADMIN: {
        STATS: '/admin/stats',
    },
    CONTACTS: {
        BASE: '/contacts',
        BY_USER: (userId) => `/contacts/user/${userId}`,
        SEND_EMAIL: '/contacts/send-email',
    }
};

export const ROLES = {
    ADMIN: 'admin',
    CARETAKER: 'caregiver', // API returns 'caregiver'
    PATIENT: 'patient',
};
