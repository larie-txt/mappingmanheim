let nfcIsScanning = false;
let lastNfcValue = 0;
let resetTimer = null;

// Adjust this.
// If the value resets too quickly while the tag is still touching,
// increase this to 1500, 2000, or 3000.
const RESET_AFTER_MS = 1200;

function setCablesNfcNumber(value) {
    if (!window.cablesPatch) {
        console.error("Cables patch not loaded yet.");
        return;
    }

    window.cablesPatch.setVariable("nfcNumber", value);
    console.log("Set #nfcNumber to:", value);
}

function scheduleResetToZero() {
    clearTimeout(resetTimer);

    resetTimer = setTimeout(() => {
        lastNfcValue = 0;
        setCablesNfcNumber(0);
        console.log("No NFC tag detected recently. Reset to 0.");
    }, RESET_AFTER_MS);
}

async function scanNFC() {
    if (nfcIsScanning) {
        console.log("NFC is already scanning.");
        return;
    }

    if (!("NDEFReader" in window)) {
        alert("Web NFC only works on Android Chrome.");
        return;
    }

    if (!window.cablesPatch) {
        console.error("Cables patch not loaded yet.");
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

                const value = parseInt(text, 10);

                if (Number.isNaN(value)) {
                    console.warn("NFC tag text is not a valid integer:", text);
                    return;
                }

                lastNfcValue = value;
                setCablesNfcNumber(value);

                // Reset only if no new tag read happens soon.
                scheduleResetToZero();
            }
        });

    } catch (err) {
        nfcIsScanning = false;
        console.error("NFC error:", err);
    }
}

document.getElementById("startNFC").addEventListener("click", scanNFC);
