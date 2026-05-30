import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// =========================
// FIREBASE CONFIG
// =========================

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


// =========================
// TRANSITION STATE
// =========================

let currentNfc = 0;
let targetNfc = 1;
let isTransitioning = false;
let queuedNfc = null;

const FADE_DURATION = 1200; // milliseconds


// =========================
// NFC LOGIC
// =========================

async function startNFC() {

    if (!("NDEFReader" in window)) {
        alert("Web NFC is not supported on this device/browser.");
        return;
    }

    const ndef = new NDEFReader();

    try {
        await ndef.scan();

        console.log("NFC scanning started");

        ndef.onreading = (event) => {

            for (const record of event.message.records) {

                if (record.recordType === "text") {

                    const text = new TextDecoder(
                        record.encoding
                    ).decode(record.data);

                    const number = parseInt(text.trim(), 10);

                    if (!Number.isNaN(number)) {

                        setNfcNumber(number);
                        sendNfcNumberToFirebase(number);

                    } else {
                        console.warn("NFC tag did not contain a valid number");
                    }
                }
            }
        };

    } catch (error) {
        console.error("NFC error:", error);
    }
}


// =========================
// LOCAL CABLES UPDATE WITH FADE
// =========================

function setNfcNumber(number) {

    if (!window.CABLES || !CABLES.patch) {
        console.warn("CABLES patch not ready");
        return;
    }

    if (number === currentNfc && !isTransitioning) {
        return;
    }

    if (isTransitioning) {
        queuedNfc = number;
        console.log("Queued NFC:", number);
        return;
    }

    startNfcTransition(number);
}


function startNfcTransition(number) {

    targetNfc = number;
    isTransitioning = true;

    CABLES.patch.setVariable("currentNfc", currentNfc);
    CABLES.patch.setVariable("targetNfc", targetNfc);
    CABLES.patch.setVariable("nfcFade", 0);

    const startTime = performance.now();

    function animate(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / FADE_DURATION, 1);

        CABLES.patch.setVariable("nfcFade", t);

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {

            currentNfc = targetNfc;

            CABLES.patch.setVariable("currentNfc", currentNfc);
            CABLES.patch.setVariable("targetNfc", currentNfc);
            CABLES.patch.setVariable("nfcFade", 0);

            isTransitioning = false;

            console.log("Transition complete:", currentNfc);

            if (queuedNfc !== null && queuedNfc !== currentNfc) {
                const next = queuedNfc;
                queuedNfc = null;
                startNfcTransition(next);
            } else {
                queuedNfc = null;
            }
        }
    }

    requestAnimationFrame(animate);
}


// =========================
// FIREBASE WRITE
// =========================

function sendNfcNumberToFirebase(number) {

    console.log("Sending nfcNumber to Firebase:", number);

    set(nfcRef, number)
        .then(() => {
            console.log("Firebase nfcNumber sent:", number);
        })
        .catch((error) => {
            console.error("Firebase write failed:", error);
        });
}


// =========================
// FIREBASE LISTENER
// =========================

onValue(nfcRef, (snapshot) => {

    const number = snapshot.val();

    if (number === null || number === undefined) {
        return;
    }

    console.log("Firebase received nfcNumber:", number);

    setNfcNumber(number);
});


// =========================
// START BUTTON
// =========================

document
    .getElementById("startNFC")
    .addEventListener("click", startNFC);
