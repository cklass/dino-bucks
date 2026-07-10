import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, off } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import firebaseConfig from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
export const auth = getAuth(app);

const ROOT = "classroom";

export function saveToFirebase(state) {
  return set(ref(db, ROOT), state);
}

export function subscribeToFirebase(callback) {
  const r = ref(db, ROOT);
  onValue(r, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(r);
}

export function teacherSignIn() {
  return signInWithEmailAndPassword(auth, "mrklassen@dinobucks.ca", "DinoBucks2026");
}

export function teacherSignOut() {
  return signOut(auth);
}