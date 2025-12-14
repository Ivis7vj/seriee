import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase-config";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null); // Firestore profile data
    const [loading, setLoading] = useState(true);

    async function checkUsernameAvailability(username) {
        const q = query(collection(db, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty;
    }

    async function signup(email, password, additionalData) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user document in Firestore with optimized storage
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            username: additionalData.username, // Save username
            createdAt: new Date(),
            dob: additionalData.dob || null, // Storing DOB as requested
            bio: "Movie enthusiast.",
            avatarUrl: "",
            // Optimized Arrays for storage efficiency
            watchlist: [], // Array of { tmdbId, type, addedAt }
            favorites: [], // Array of tmdbIds
            likes: [],     // Array of tmdbIds
            watched: []    // Array of tmdbIds
        });

        return user;
    }

    async function login(username, password) {
        // Assume input is username, try to find email
        let emailToUse = username;

        // If it doesn't look like an email, lookup the username
        if (!username.includes('@')) {
            const q = query(collection(db, "users"), where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                emailToUse = userData.email;
            } else {
                throw new Error("Username not found");
            }
        }

        return signInWithEmailAndPassword(auth, emailToUse, password);
    }

    function logout() {
        return signOut(auth);
    }

    async function verifyAndResetPassword(username, dob) {
        const q = query(collection(db, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Username not found");
        }

        const userData = querySnapshot.docs[0].data();
        if (userData.dob !== dob) {
            throw new Error("Date of Birth does not match records");
        }

        // Send reset email
        await sendPasswordResetEmail(auth, userData.email);
        return true;
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // Fetch user profile data
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userData,
        signup,
        login,
        logout,
        checkUsernameAvailability,
        verifyAndResetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
