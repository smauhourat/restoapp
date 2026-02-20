import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let showToast = () => { };
let _onUnauthorized = null;

export const setAxiosErrorToastHandler = (fn) => {
    showToast = fn;
};

export const setUnauthorizedHandler = (fn) => {
    _onUnauthorized = fn;
};

// ─── Interceptor de request: agrega JWT ──────────────────────────────────────
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Interceptor de response: manejo de errores + refresh automático ─────────
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => refreshSubscribers.push(cb);
const onTokenRefreshed = (token) => {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
};

apiClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        // 401 → intentar refresh automático (solo una vez)
        if (error.response?.status === 401 && !originalRequest._retry) {
            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
                if (_onUnauthorized) _onUnauthorized();
                return new Promise(() => { });
            }

            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(apiClient(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(
                    `${process.env.REACT_APP_API_BASE_URL}/auth/refresh`,
                    { refresh_token: refreshToken }
                );
                const { access_token, refresh_token: newRefreshToken } = response.data;

                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', newRefreshToken);

                apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
                originalRequest.headers.Authorization = `Bearer ${access_token}`;

                onTokenRefreshed(access_token);
                isRefreshing = false;

                return apiClient(originalRequest);
            } catch {
                isRefreshing = false;
                refreshSubscribers = [];
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                if (_onUnauthorized) _onUnauthorized();
                return new Promise(() => { });
            }
        }

        // Otros errores: mostrar toast
        console.error('API Error:', error);
        const errorData = error.response?.data;
        const baseMessage = errorData?.error || 'Error desconocido del servidor';
        const detalles = Array.isArray(errorData?.detalles) ? errorData.detalles : [];
        const detalleExtra = detalles.find((detalle) => detalle && detalle !== baseMessage);
        const message = detalleExtra ? `${baseMessage} (${detalleExtra})` : baseMessage;
        showToast(message);

        return new Promise(() => { });
    }
);

export default apiClient;
