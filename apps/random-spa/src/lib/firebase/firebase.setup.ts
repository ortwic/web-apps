// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDPPHgT0TwrxNVh7OTGElNLuzh3cVZE4NE",
  authDomain: "random-b853b.firebaseapp.com",
  projectId: "random-b853b",
  storageBucket: "random-b853b.appspot.com",
  messagingSenderId: "418629147187",
  appId: "1:418629147187:web:dbf3f041f59b3b07d4a146",
  measurementId: "G-VBF5E9M6H8"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);