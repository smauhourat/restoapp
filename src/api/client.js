import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let showToast = () => { };

export const setAxiosErrorToastHandler = (fn) => {
    showToast = fn;
};

// Interceptor para manejar errores globalmente
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // console.error('API Error:', error.response?.data || error.message);
        console.error('API Error:', error)

        const message = error.response?.data?.error || 'Error desconocido del servidor';
        // Mostrar toast (esto depende de cómo manejes notificaciones)
        showToast(message)      

        // Evita que el error se propague si no te interesa manejarlo individualmente
        return new Promise(() => { }); // NEVER resolves → evita el "Uncaught"        
        //return Promise.reject(error);
    }
);  

export default apiClient;