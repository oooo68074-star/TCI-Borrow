'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Fetch extended user profile from firestore
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        setUser({ id: firebaseUser.uid, ...userDocSnap.data() });
                    } else {
                        // Auto-create Firestore document for new users (e.g. Google sign-in)
                        const newUser = {
                            name: firebaseUser.displayName || 'User',
                            email: firebaseUser.email,
                            role: 'user',
                            avatar: firebaseUser.photoURL || null,
                            department: '',
                            studentId: '',
                            phone: '',
                            createdAt: new Date().toISOString()
                        };
                        await setDoc(userDocRef, newUser);
                        setUser({ id: firebaseUser.uid, ...newUser });
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

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
            const firebaseUser = userCredential.user;
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

            let userData = { id: firebaseUser.uid, email: firebaseUser.email, role: 'user', name: 'User' };
            if (userDoc.exists()) {
                userData = { id: firebaseUser.uid, ...userDoc.data() };
            }
            setUser(userData);
            return userData;
        });
    };

    const signInWithGoogle = async () => {
        // Only trigger the popup — onAuthStateChanged handles Firestore
        const result = await signInWithPopup(auth, googleProvider);
        return { id: result.user.uid, email: result.user.email, name: result.user.displayName };
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
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, resetPassword, signInWithGoogle, isAdmin }}>
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
