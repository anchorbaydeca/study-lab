// Study Lab cloud layer: student accounts (Firebase Authentication) and saved
// progress (Cloud Firestore). Loaded as a module; exposes window.Cloud and fires
// a "cloud-ready" event. The main page keeps working on this device if it fails.
import {
  initializeApp, getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, connectAuthEmulator,
  getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, getDocs, collection, runTransaction
} from './vendor/firebase.js';

const CONFIG = {
  apiKey: 'AIzaSyAKBxWq4spTsT7klcoxJpyG-_LfR_Pfwf0',
  authDomain: 'anchor-bay-deca-study-lab.firebaseapp.com',
  projectId: 'anchor-bay-deca-study-lab',
  storageBucket: 'anchor-bay-deca-study-lab.firebasestorage.app',
  messagingSenderId: '34406197893',
  appId: '1:34406197893:web:a3b135791c6ae1b3b0d7ec'
};
// Students sign in under a scrambled ID at a reserved domain that can never receive mail,
// so no school email or name is stored in Firebase.
const DOMAIN = 'abdeca-studylab.invalid';
const SALT = 'abdeca-study-lab|';

// Local testing against the Firebase emulators: http://localhost:PORT/?emu
const EMU = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has('emu');
const app = initializeApp(EMU ? Object.assign({}, CONFIG, { projectId: 'demo-studylab', apiKey: 'demo-key' }) : CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
if (EMU) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

async function sidFor(email) {
  const bytes = new TextEncoder().encode(SALT + String(email).trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 20);
}
const loginFor = sid => sid + '@' + DOMAIN;
const sidOf = user => (user && user.email && user.email.endsWith('@' + DOMAIN)) ? user.email.split('@')[0] : null;

function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'timeout' })), ms))]);
}

const Cloud = {
  emulator: EMU,
  sidFor,
  onUser(cb) { return onAuthStateChanged(auth, u => cb(sidOf(u))); },
  currentSid() { return sidOf(auth.currentUser); },
  async signUp(email, pw) { const sid = await sidFor(email); await createUserWithEmailAndPassword(auth, loginFor(sid), pw); return sid; },
  async signIn(email, pw) { const sid = await sidFor(email); await signInWithEmailAndPassword(auth, loginFor(sid), pw); return sid; },
  signOut() { return signOut(auth); },

  async getStudent(sid) {
    const s = await withTimeout(getDoc(doc(db, 'students', sid)), 10000);
    return s.exists() ? s.data() : null;
  },
  putStudent(sid, patch) { return withTimeout(setDoc(doc(db, 'students', sid), patch, { merge: true }), 15000); },

  async getState(sid, cl) {
    const s = await withTimeout(getDoc(doc(db, 'students', sid, 'clusters', cl)), 10000);
    return s.exists() ? JSON.parse(s.data().state) : null;
  },
  // Reads the saved state, merges it with this device's state and writes the result,
  // all in one transaction so two devices saving at once don't overwrite each other.
  syncState(sid, cl, local, merge, studentPatch) {
    return withTimeout(runTransaction(db, async tx => {
      const ref = doc(db, 'students', sid, 'clusters', cl);
      const snap = await tx.get(ref);
      const remote = snap.exists() ? JSON.parse(snap.data().state) : null;
      const merged = merge(local, remote);
      tx.set(ref, { state: JSON.stringify(merged), upd: Date.now(), v: 3 });
      if (studentPatch) tx.set(doc(db, 'students', sid), studentPatch, { merge: true });
      return merged;
    }), 20000);
  },

  async isAdvisor(sid) {
    try { return (await withTimeout(getDoc(doc(db, 'advisors', sid)), 10000)).exists(); } catch (e) { return false; }
  },
  async listStudents() {
    const q = await withTimeout(getDocs(collection(db, 'students')), 20000);
    return q.docs.map(d => Object.assign({ sid: d.id }, d.data()));
  },
  async listStates(sid) {
    const q = await withTimeout(getDocs(collection(db, 'students', sid, 'clusters')), 20000);
    return q.docs.map(d => ({ cluster: d.id, upd: d.data().upd, state: JSON.parse(d.data().state) }));
  }
};

window.Cloud = Cloud;
window.dispatchEvent(new Event('cloud-ready'));
