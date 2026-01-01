import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCcxtiFQyzI5LHaTM76fgtgnR4OzZ5fq-M",
  authDomain: "nightship-drivers.firebaseapp.com",
  projectId: "nightship-drivers",
  storageBucket: "nightship-drivers.appspot.com",
  messagingSenderId: "507088519358",
  appId: "1:507088519358:web:4d453ccdfcad2532979eef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, firebaseConfig };
