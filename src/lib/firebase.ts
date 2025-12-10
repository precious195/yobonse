// Firebase Client Configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCcPxOzkM1abTCE8_0_usaUpbildM8B80o",
    authDomain: "studio-6770964930-e9fa9.firebaseapp.com",
    databaseURL: "https://studio-6770964930-e9fa9-default-rtdb.firebaseio.com",
    projectId: "studio-6770964930-e9fa9",
    storageBucket: "studio-6770964930-e9fa9.firebasestorage.app",
    messagingSenderId: "944200457183",
    appId: "1:944200457183:web:9ee75e0a91c399b0bf426a"
};

// Initialize Firebase (singleton pattern to prevent re-initialization)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth: Auth = getAuth(app);
const database: Database = getDatabase(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, database, storage };
export default app;

