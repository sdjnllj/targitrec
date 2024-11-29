// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyAPzskLscM99aZRvuvw2WJTV2j2TgAU",
    authDomain: "targitrec.firebaseapp.com",
    projectId: "targitrec",
    storageBucket: "targitrec.appspot.com",
    messagingSenderId: "376230798821",
    appId: "1:376230798821:web:dfa3394ad2a54bf5a646ac"
};

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
