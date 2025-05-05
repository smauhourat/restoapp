// src/components/ToastProvider.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
    const [toast, setToast] = useState({ open: false, message: '', severity: 'error' });

    const showToast = useCallback((message, severity = 'error') => {
        setToast({ open: true, message, severity });
    }, []);

    const handleClose = () => {
        setToast(prev => ({ ...prev, open: false }));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Snackbar open={toast.open} autoHideDuration={4000} onClose={handleClose}>
                <Alert onClose={handleClose} severity={toast.severity} variant="filled">
                    {toast.message}
                </Alert>
            </Snackbar>
        </ToastContext.Provider>
    );
}
