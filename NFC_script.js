let lastValue = null;

async function scanNFC() {

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

        console.log("NFC scanning started");

        ndef.addEventListener("reading", ({ message }) => {

            console.log("NFC tag detected");

            for (const record of message.records) {

                if (record.recordType === "text") {

                    const text = new TextDecoder(record.encoding)
                        .decode(record.data)
                        .trim();

                    const value = parseInt(text, 10);

                    if (!Number.isNaN(value)) {

                        // only update if value actually changed
                        if (value !== lastValue) {

                            lastValue = value;

                            window.cablesPatch.setVariable(
                                "nfcNumber",
                                value
                            );

                            console.log(
                                "Stored NFC integer:",
                                value
                            );
                        }
                    }
                }
            }
        });

    } catch (err) {

        console.error("NFC error:", err);

    }
}

document.getElementById("startNFC")
    .addEventListener("click", scanNFC);
