import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyATQBWTDPYxseyReqaCUBwS0R0DXKkV5UU",
    authDomain: "mapping-manheim-a3212.firebaseapp.com",
    databaseURL: "https://mapping-manheim-a3212-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mapping-manheim-a3212",
    storageBucket: "mapping-manheim-a3212.firebasestorage.app",
    messagingSenderId: "1040811677824",
    appId: "1:1040811677824:web:ada79a20f9b2cdc78cae65"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const nfcRef = ref(db, "nfcNumber");

let latestFirebaseValue = 0;
let nfcIsScanning = false;
let resetTimer = null;

const RESET_AFTER_MS = 1200;

function applyValueToCables(value) {
    latestFirebaseValue = value;

    if (!window.cablesPatch) {
        console.warn("Cables patch not ready yet. Stored value:", value);
        return;
    }

    window.cablesPatch.setVariable("nfcNumber", value);

    console.log("Applied to cables #nfcNumber:", value);
}

// Listen on ALL devices
onValue(nfcRef, (snapshot) => {
    const value = snapshot.val() ?? 0;

    console.log("Firebase received nfcNumber:", value);

    applyValueToCables(value);
});

// Keep checking until cables is ready, then apply latest Firebase value
const waitForCables = setInterval(() => {
    if (window.cablesPatch) {
        applyValueToCables(latestFirebaseValue);
        clearInterval(waitForCables);
        console.log("Cables patch connected to Firebase sync");
    }
}, 100);

function sendNfcValue(value) {
    console.log("Sending NFC value to Firebase:", value);
    set(nfcRef, value)
        .then(() => {
            console.log("Firebase write successful:", value);
        })
        .catch((err) => {
            console.error("Firebase write failed:", err);
        });
}

function scheduleResetToZero() {
    clearTimeout(resetTimer);

    resetTimer = setTimeout(() => {
        sendNfcValue(0);
        console.log("Reset nfcNumber to 0");
    }, RESET_AFTER_MS);
}

async function scanNFC() {
    if (nfcIsScanning) {
        console.log("NFC already scanning");
        return;
    }

    if (!("NDEFReader" in window)) {
        alert("Web NFC only works on Android Chrome.");
        return;
    }

    try {
        const ndef = new NDEFReader();

        await ndef.scan();

        nfcIsScanning = true;

        console.log("NFC scanning started");

        ndef.addEventListener("reading", ({ message }) => {
            for (const record of message.records) {
                if (record.recordType !== "text") continue;

                const text = new TextDecoder(record.encoding)
                    .decode(record.data)
                    .trim();

                console.log("NFC text:", text);

                const value = parseInt(text, 10);

                if (Number.isNaN(value)) {
                    console.warn("Invalid NFC integer:", text);
                    return;
                }

                sendNfcValue(value);
                scheduleResetToZero();
            }
        });

    } catch (err) {
        console.error("NFC error:", err);
    }
}

document
    .getElementById("startNFC")
    .addEventListener("click", scanNFC);
