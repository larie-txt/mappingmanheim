let nfcIsScanning = false;
let resetTimer = null;

const RESET_AFTER_MS = 1200;

function setCablesNfcNumber(value) {
    console.log("Trying to set #nfcNumber to:", value);

    if (!window.cablesPatch) {
        console.error("window.cablesPatch does not exist.");
        return;
    }

    console.log("cablesPatch exists:", window.cablesPatch);

    window.cablesPatch.setVariable("nfcNumber", value);

    const variable = window.cablesPatch.getVar("nfcNumber");

    if (variable) {
        console.log(
            "Cables variable #nfcNumber is now:",
            variable.getValue()
        );
    } else {
        console.error(
            "Could not find cables variable named nfcNumber. Check spelling."
        );
    }
}

function scheduleResetToZero() {
    clearTimeout(resetTimer);

    resetTimer = setTimeout(() => {
        setCablesNfcNumber(0);
        console.log("Reset #nfcNumber to 0 after timeout.");
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
            console.log("NFC reading event:", message);

            for (const record of message.records) {
                console.log("NFC record:", record);

                if (record.recordType !== "text") {
                    console.warn("Skipping non-text NFC record:", record.recordType);
                    continue;
                }

                const text = new TextDecoder(record.encoding)
                    .decode(record.data)
                    .trim();

                console.log("Decoded NFC text:", text);

                const value = parseInt(text, 10);

                console.log("Parsed NFC value:", value);

                if (Number.isNaN(value)) {
                    console.warn("NFC tag text is not a valid integer:", text);
                    return;
                }

                setCablesNfcNumber(value);
                scheduleResetToZero();
            }
        });

    } catch (err) {
        nfcIsScanning = false;
        console.error("NFC error:", err);
    }
}

document.getElementById("startNFC").addEventListener("click", scanNFC);
