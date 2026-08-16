// One-time script to create an admin account in Firebase
// Run: node scripts/create-admin.mjs

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBxsC-52EgecZJf-ulXLdvvEe7Z-WwMmvI",
    authDomain: "borrowing-app-92145.firebaseapp.com",
    projectId: "borrowing-app-92145",
    storageBucket: "borrowing-app-92145.firebasestorage.app",
    messagingSenderId: "291140214202",
    appId: "1:291140214202:web:261b25045d6118d637d183",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = 'admin@borrowhub.com';
const ADMIN_PASSWORD = 'admin123456';
const ADMIN_NAME = 'ผู้ดูแลระบบ';

async function createAdmin() {
    console.log('🔧 Creating admin account...');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('');

    try {
        // Try to create the user
        let uid;
        try {
            const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
            uid = cred.user.uid;
            console.log('✅ Admin user created in Firebase Auth');
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                // User already exists, sign in to get uid
                console.log('ℹ️  Admin user already exists, updating role...');
                const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
                uid = cred.user.uid;
            } else {
                throw err;
            }
        }

        // Check if user doc already exists
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            // Update role to admin
            await updateDoc(userRef, { role: 'admin' });
            console.log('✅ User role updated to admin in Firestore');
        } else {
            // Create new admin user document
            await setDoc(userRef, {
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                role: 'admin',
                avatar: null,
                department: 'ศูนย์บรรณสารและสื่อการศึกษา',
                studentId: 'ADMIN-001',
                phone: '',
                createdAt: new Date().toISOString()
            });
            console.log('✅ Admin profile created in Firestore');
        }

        console.log('');
        console.log('🎉 Done! You can now login with:');
        console.log(`   Email:    ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('');
        console.error('💡 Make sure:');
        console.error('   1. Firebase Auth Email/Password is enabled in Firebase Console');
        console.error('   2. Firestore rules allow write access');
        process.exit(1);
    }
}

createAdmin();
