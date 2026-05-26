// NFC Reader for cables.gl
// ---------------------------------
// Reads NFC tags containing numbers (1-5)
// and outputs them into cables.gl.
//
// IMPORTANT:
// - Works mainly on Android Chrome
// - Requires HTTPS
// - NFC tags should contain plain text:
//   1
//   2
//   3
//   4
//   5

let nfcValue = op.outNumber("NFC Number");

async function startNfc() {
    if (!("NDEFReader" in window)) {
        console.log("Web NFC not supported on this device/browser.");
        return;
    }

    try {
        const ndef = new NDEFReader();

        // Start scanning
        await ndef.scan();

        console.log("NFC scan active");

        // Triggered whenever a tag is scanned
        ndef.onreading = (event) => {
            const decoder = new TextDecoder();

            for (const record of event.message.records) {
                if (record.recordType === "text") {
                    const text = decoder.decode(record.data);
                    const number = Number(text);

                    if (!isNaN(number)) {
                        console.log("NFC number:", number);

                        // Output number to cables.gl
                        nfcValue.set(number);

                        // Optional global variable
                        op.patch.setVariable("nfcNumber", number);
                    }
                }
            }
        };

    } catch (err) {
        console.error("NFC error:", err);
    }
}

// Start NFC automatically
startNfc();