'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';

const DataContext = createContext(null);

export function DataProvider({ children }) {
    const [items, setItems] = useState([]);
    const [borrows, setBorrows] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Listen to items collection
        const unsubItems = onSnapshot(collection(db, 'items'), (snapshot) => {
            const itemsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(itemsList);
        }, (error) => {
            console.error("Error fetching items real-time:", error);
        });

        // Listen to borrows collection
        const unsubBorrows = onSnapshot(collection(db, 'borrows'), (snapshot) => {
            const borrowsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBorrows(borrowsList);
            setIsLoaded(true); // Assuming heavily relied data is loaded
        }, (error) => {
            console.error("Error fetching borrows real-time:", error);
            setIsLoaded(true);
        });

        return () => {
            unsubItems();
            unsubBorrows();
        };
    }, []);

    const addItem = async (newItem) => {
        try {
            const itemData = {
                ...newItem,
                status: 'available',
                createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, 'items'), itemData);
        } catch (err) {
            console.error("Error adding item to Firestore:", err);
            throw err;
        }
    };

    const updateItem = async (id, updates) => {
        try {
            await updateDoc(doc(db, 'items', id), updates);
        } catch (err) {
            console.error("Error updating item in Firestore:", err);
            throw err;
        }
    };

    const deleteItem = async (id) => {
        try {
            await deleteDoc(doc(db, 'items', id));
        } catch (err) {
            console.error("Error deleting item in Firestore:", err);
            throw err;
        }
    };

    const addBorrowRequest = async (request) => {
        try {
            const borrowData = {
                ...request,
                status: 'pending',
                borrowDate: new Date().toISOString()
            };
            await addDoc(collection(db, 'borrows'), borrowData);
        } catch (err) {
            console.error("Error requesting borrow in Firestore:", err);
            throw err;
        }
    };

    const updateBorrowStatus = async (id, newStatus) => {
        try {
            const updates = { status: newStatus };
            if (newStatus === 'returned') {
                updates.returnDate = new Date().toISOString();
            }
            await updateDoc(doc(db, 'borrows', id), updates);
        } catch (err) {
            console.error("Error updating borrow status in Firestore:", err);
            throw err;
        }
    };

    return (
        <DataContext.Provider value={{
            items,
            borrows,
            isLoaded,
            addItem,
            updateItem,
            deleteItem,
            addBorrowRequest,
            updateBorrowStatus
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

export default DataContext;
