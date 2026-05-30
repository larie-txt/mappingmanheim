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

let currentNFC = 0;
let targetNFC = 0;
let isTransitioning = false;
let queuedNFC = null;

const FADE_DURATION = 1200;


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

        document.getElementById("startNFC")?.remove();

        ndef.onreading = (event) => {
            for (const record of event.message.records) {
                if (record.recordType === "text") {
                    const text = new TextDecoder(record.encoding).decode(record.data);
                    const number = parseInt(text.trim(), 10);

                    if (!Number.isNaN(number)) {
                        setNFCNumber(number);
                        sendNFCNumberToFirebase(number);
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

function setNFCNumber(number) {
    if (!window.CABLES || !CABLES.patch) {
        console.warn("CABLES patch not ready");
        return;
    }

    if (number === currentNFC && !isTransitioning) {
        return;
    }

    if (isTransitioning) {
        queuedNFC = number;
        console.log("Queued NFC:", number);
        return;
    }

    startNFCTransition(number);
}


function startNFCTransition(number) {
    targetNFC = number;
    isTransitioning = true;

    CABLES.patch.setVariable("currentNFC", currentNFC);
    CABLES.patch.setVariable("targetNFC", targetNFC);
    CABLES.patch.setVariable("fadeNFC", 0);

    const startTime = performance.now();

    function animate(now) {
        const elapsed = now - startTime;
        const fade = Math.min(elapsed / FADE_DURATION, 1);

        CABLES.patch.setVariable("fadeNFC", fade);

        if (fade < 1) {
            requestAnimationFrame(animate);
        } else {
            currentNFC = targetNFC;

            CABLES.patch.setVariable("currentNFC", currentNFC);
            CABLES.patch.setVariable("targetNFC", currentNFC);
            CABLES.patch.setVariable("fadeNFC", 0);

            isTransitioning = false;

            console.log("Transition complete:", currentNFC);

            if (queuedNFC !== null && queuedNFC !== currentNFC) {
                const next = queuedNFC;
                queuedNFC = null;
                startNFCTransition(next);
            } else {
                queuedNFC = null;
            }
        }
    }

    requestAnimationFrame(animate);
}


// =========================
// FIREBASE WRITE
// =========================

function sendNFCNumberToFirebase(number) {
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

let firstFirebaseValue = true;

onValue(nfcRef, (snapshot) => {

    const number = snapshot.val();

    if (number === null || number === undefined) {
        return;
    }

    console.log("Firebase received nfcNumber:", number);

    // First load: initialize directly
    if (firstFirebaseValue) {

        firstFirebaseValue = false;

        currentNFC = number;
        targetNFC = number;

        if (window.CABLES && CABLES.patch) {
            CABLES.patch.setVariable("currentNFC", number);
            CABLES.patch.setVariable("targetNFC", number);
            CABLES.patch.setVariable("fadeNFC", 0);
        }

        console.log("Initial NFC state:", number);
        return;
    }

    // Later updates fade normally
    setNFCNumber(number);
});


// =========================
// START BUTTON
// =========================

const startButton = document.getElementById("startNFC");

if (startButton) {
    startButton.addEventListener("click", startNFC);
}
