// =========================
// FIREBASE IMPORTS
// =========================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    onValue
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// =========================
// FIREBASE CONFIG
// =========================

// Replace with YOUR Firebase config
const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain:
        "YOUR_PROJECT.firebaseapp.com",

    databaseURL:
        "https://YOUR_PROJECT-default-rtdb.europe-west1.firebasedatabase.app",

    projectId: "YOUR_PROJECT",

    storageBucket:
        "YOUR_PROJECT.appspot.com",

    messagingSenderId:
        "YOUR_SENDER_ID",

    appId:
        "YOUR_APP_ID"
};


// =========================
// FIREBASE INIT
// =========================

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const nfcRef = ref(db, "nfcNumber");


// =========================
// SYNC TO CABLES
// =========================

// Every connected device listens here.
// iMac updates automatically when Android scans.
onValue(nfcRef, (snapshot) => {

    const value = snapshot.val() ?? 0;

    console.log("Firebase nfcNumber:", value);

    if (window.cablesPatch) {

        window.cablesPatch.setVariable(
            "nfcNumber",
            value
        );

        console.log(
            "Updated cables variable:",
            value
        );
    }
});


// =========================
// SEND VALUE TO FIREBASE
// =========================

function sendNfcValue(value) {

    console.log(
        "Sending NFC value to Firebase:",
        value
    );

    set(nfcRef, value);
}


// =========================
// NFC SCANNING
// =========================

let nfcIsScanning = false;

let resetTimer = null;

// Adjust if reset is too fast
const RESET_AFTER_MS = 1200;


function scheduleResetToZero() {

    clearTimeout(resetTimer);

    resetTimer = setTimeout(() => {

        sendNfcValue(0);

        console.log(
            "Reset nfcNumber to 0"
        );

    }, RESET_AFTER_MS);
}


async function scanNFC() {

    if (nfcIsScanning) {

        console.log(
            "NFC already scanning"
        );

        return;
    }

    if (!("NDEFReader" in window)) {

        alert(
            "Web NFC only works on Android Chrome."
        );

        return;
    }

    try {

        const ndef = new NDEFReader();

        await ndef.scan();

        nfcIsScanning = true;

        console.log(
            "NFC scanning started"
        );

        ndef.addEventListener(
            "reading",
            ({ message }) => {

                for (const record of message.records) {

                    if (
                        record.recordType !== "text"
                    ) continue;

                    const text =
                        new TextDecoder(
                            record.encoding
                        )
                        .decode(record.data)
                        .trim();

                    console.log(
                        "NFC text:",
                        text
                    );

                    const value =
                        parseInt(text, 10);

                    if (
                        Number.isNaN(value)
                    ) {

                        console.warn(
                            "Invalid NFC integer:",
                            text
                        );

                        return;
                    }

                    // SEND TO ALL DEVICES
                    sendNfcValue(value);

                    // Reset later
                    scheduleResetToZero();
                }
            }
        );

    } catch (err) {

        console.error(
            "NFC error:",
            err
        );
    }
}


// =========================
// START NFC BUTTON
// =========================

document
    .getElementById("startNFC")
    .addEventListener(
        "click",
        scanNFC
    );
