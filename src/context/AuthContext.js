'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Fetch extended user profile from firestore
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        setUser({ id: firebaseUser.uid, ...userDoc.data() });
                    } else {
                        // Fallback in case document is missing
                        setUser({
                            id: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: 'user',
                            name: firebaseUser.displayName || 'User'
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        let userData = { id: firebaseUser.uid, email: firebaseUser.email, role: 'user', name: 'User' };
        if (userDoc.exists()) {
            userData = { id: firebaseUser.uid, ...userDoc.data() };
        }
        setUser(userData);
        return userData;
    };

    const register = async (name, email, password, studentId = '') => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const newUser = {
            name,
            email,
            role: 'user',
            avatar: null,
            department: '',
            studentId,
            phone: '',
            createdAt: new Date().toISOString()
        };

        // Create user document in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

        const userData = { id: firebaseUser.uid, ...newUser };
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        await firebaseSignOut(auth);
        setUser(null);
    };

    const updateProfile = async (updates) => {
        await updateDoc(doc(db, 'users', user.id), updates);
        setUser(prev => ({ ...prev, ...updates }));
    };

    const resetPassword = async (email) => {
        await sendPasswordResetEmail(auth, email);
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, resetPassword, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
