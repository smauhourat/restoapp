import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        try {
            if (refreshToken) {
                await apiClient.post('/auth/logout', { refresh_token: refreshToken });
            }
        } catch {
            // ignorar errores de logout
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
        }
    }, []);

    // Registrar handler para 401 en axios
    useEffect(() => {
        setUnauthorizedHandler(() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
        });
    }, []);

    // Verificar sesión al cargar la app
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        apiClient.get('/auth/me')
            .then((data) => {
                setUser(data);
            })
            .catch(() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = async (email, password) => {
        const data = await apiClient.post('/auth/login', { email, password });
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        setUser(data.user);
        return data.user;
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return ctx;
}
