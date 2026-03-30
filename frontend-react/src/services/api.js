import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ---- Auth ----
export const loginUser = async (email, password, role) => {
    const response = await api.post('/auth/login', { email, password, role });
    return response.data;
};

export const signupUser = async (email, password, role) => {
    const response = await api.post('/auth/signup', { email, password, role });
    return response.data;
};

// Sync role from backend (call on layout mount to pick up admin role changes)
export const getMe = async () => {
    try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
            const user = response.data.user;
            localStorage.setItem('role', user.role);
            localStorage.setItem('userName', user.name);
            return user;
        }
    } catch (err) {
        console.warn('Failed to sync user:', err.message);
    }
    return null;
};

// ---- User Management (Admin) ----
export const getUsers = async (roleFilter) => {
    const params = roleFilter && roleFilter !== 'all' ? { role: roleFilter } : {};
    const response = await api.get('/auth/users', { params });
    return response.data;
};

export const getUserStats = async () => {
    const response = await api.get('/auth/users/stats');
    return response.data;
};

export const updateUserRole = async (email, role) => {
    const response = await api.put(`/auth/users/${encodeURIComponent(email)}/role`, { role });
    return response.data;
};

export const updateUserStatus = async (email, status) => {
    const response = await api.put(`/auth/users/${encodeURIComponent(email)}/status`, { status });
    return response.data;
};

export const deleteUser = async (email) => {
    const response = await api.delete(`/auth/users/${encodeURIComponent(email)}`);
    return response.data;
};

export const uploadDataset = async (file) => {
    const formData = new FormData();
    formData.append('dataset', file);
    
    // Let axios set the proper boundary for multipart/form-data
    const response = await api.post('/upload', formData);
    return response.data;
};

export const getDatasetStatus = async (datasetId) => {
    const response = await api.get(`/dataset-status/${datasetId}`);
    return response.data;
};

export const getDashboardConfig = async (datasetId) => {
    try {
        const response = await api.get(`/dashboard/${datasetId}`);
        return response.data;
    } catch (err) {
        console.warn("Dashboard config not available:", err.message);
        return { success: false, charts: [], insights: [], executive_summary: "" };
    }
};

export const getAnalytics = async (datasetId) => {
    const response = await api.get(`/analytics/${datasetId}`);
    return response.data;
};

export const askQuery = async (datasetId, question) => {
    const response = await api.post('/query', {
        datasetId: datasetId,
        question: question,
    });
    return response.data;
};

export const getDatasets = async () => {
    const response = await api.get('/datasets');
    return response.data;
};

export const getCleanedData = async (datasetId, params = {}) => {
    const response = await api.get(`/cleaned-data/${datasetId}`, { params });
    return response.data;
};

export default api;
