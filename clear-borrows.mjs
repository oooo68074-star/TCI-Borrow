import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

// Parse .env.local manually
try {
    const env = fs.readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val.length > 0 && !key.trim().startsWith('#')) {
            process.env[key.trim()] = val.join('=').trim().replace(/(^"|"$)/g, '');
        }
    });
} catch (err) {
    console.log("No .env.local found or error parsing.");
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearData() {
    try {
        console.log("Clearing borrows collection...");
        const snapshot = await getDocs(collection(db, 'borrows'));
        for (const d of snapshot.docs) {
            await deleteDoc(doc(db, 'borrows', d.id));
            console.log("Deleted borrow request: " + d.id);
        }
        
        console.log("Resetting items inventory...");
        const itemsSnapshot = await getDocs(collection(db, 'items'));
        for (const d of itemsSnapshot.docs) {
            const data = d.data();
            await updateDoc(doc(db, 'items', d.id), { 
                availableQuantity: data.quantity || 1,
                status: 'available' 
            });
            console.log("Reset item: " + (data.name || d.id));
        }
        console.log("All data cleared successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error clearing data:", err);
        process.exit(1);
    }
}

clearData();
