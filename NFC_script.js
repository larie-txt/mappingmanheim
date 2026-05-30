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
let firstFirebaseValueIgnored = false;

const FADE_DURATION = 1200;


// =========================
// FORCE DEFAULT TEXTURE 0
// =========================

function setDefaultTextureZero() {
    if (!window.CABLES || !CABLES.patch) {
        console.warn("CABLES patch not ready for default texture");
        return;
    }

    currentNFC = 0;
    targetNFC = 0;
    queuedNFC = null;
    isTransitioning = false;

    CABLES.patch.setVariable("currentNFC", 0);
    CABLES.patch.setVariable("targetNFC", 0);
    CABLES.patch.setVariable("fadeNFC", 0);

    console.log("Default texture set to 0");
}


// Wait until cables patch exists, then force texture 0
function waitForCablesPatch() {
    if (window.CABLES && CABLES.patch) {
        setDefaultTextureZero();
    } else {
        requestAnimationFrame(waitForCablesPatch);
    }
}

waitForCablesPatch();


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

    let ignoreNextFirebaseUpdate = true;

// Reset saved Firebase value on every page load
    set(nfcRef, 0)
    .then(() => {
        console.log("Firebase reset to 0 on page load");
    })
    .catch((error) => {
        console.error("Firebase reset failed:", error);
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

    if (ignoreNextFirebaseUpdate) {
        ignoreNextFirebaseUpdate = false;

        currentNFC = 0;
        targetNFC = 0;

        CABLES.patch?.setVariable("currentNFC", 0);
        CABLES.patch?.setVariable("targetNFC", 0);
        CABLES.patch?.setVariable("fadeNFC", 0);

        console.log("Startup Firebase update ignored; staying on texture 0");
        return;
    }

    setNFCNumber(number);
});


// =========================
// START BUTTON
// =========================

const startButton = document.getElementById("startNFC");

if (startButton) {
    startButton.addEventListener("click", startNFC);
}
