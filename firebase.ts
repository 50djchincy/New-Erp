
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDeLW60g4WeLwMsC_kn1WR1fZtlsuytePQ",
  authDomain: "mystockrestnewblue.firebaseapp.com",
  projectId: "mystockrestnewblue",
  storageBucket: "mystockrestnewblue.firebasestorage.app",
  messagingSenderId: "187297215146",
  appId: "1:187297215146:web:8772f86b5fd286a6f316d3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Helper for the specific artifact path
export const getArtifactCollection = (collectionName: string) => {
  return collection(db, "artifacts", "mystockrestnewblue", `mozza_${collectionName}`);
};
