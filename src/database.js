import { openDB } from 'idb';

const initDB = async () => {
    const db = await openDB('restaurantDB', 1, {
        upgrade(db) {
            db.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
            db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
        },
    });
    return db;
};

// Funciones para manipular contactos   
export const addContact = async (name, phone) => {
    const db = await initDB();
    await db.add('contacts', { name, phone });
};

export const getContacts = async () => {
    const db = await initDB();
    return await db.getAll('contacts');
};