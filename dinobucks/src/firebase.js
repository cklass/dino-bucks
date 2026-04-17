import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  off,
} from "firebase/database";
import firebaseConfig from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ── The single document path for this classroom ───────────────────────────────
const ROOT = "classroom";

// Write the entire state object to Firebase
export function saveToFirebase(state) {
  return set(ref(db, ROOT), state);
}

// Subscribe to real-time updates. Returns an unsubscribe function.
export function subscribeToFirebase(callback) {
  const r = ref(db, ROOT);
  onValue(r, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(r);
}
