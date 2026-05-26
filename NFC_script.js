async function scanNFC() {

    // check if Web NFC is supported
    if (!("NDEFReader" in window)) {
        alert("Web NFC only works on Android Chrome.");
        return;
    }

    // check if cables patch exists
    if (!window.cablesPatch) {
        console.error("Cables patch not loaded yet.");
        return;
    }

    try {

        const ndef = new NDEFReader();

        // start NFC scanning
        await ndef.scan();

        console.log("NFC scanning started");

        // when an NFC tag is detected
        ndef.addEventListener("reading", ({ message }) => {

            console.log("NFC tag detected");

            for (const record of message.records) {

                // only read text records
                if (record.recordType === "text") {

                    // decode NFC text
                    const text = new TextDecoder(record.encoding)
                        .decode(record.data)
                        .trim();

                    console.log("Raw NFC text:", text);

                    // convert to integer
                    const value = parseInt(text, 10);

                    console.log("Parsed integer:", value);

                    // only continue if valid number
                    if (!Number.isNaN(value)) {

                        // send integer to cables variable
                        window.cablesPatch.setVariable("nfcNumber", value);

                        console.log(
                            "Sent integer to var #nfcNumber:",
                            value
                        );

                    } else {

                        console.warn(
                            "NFC tag does not contain a valid integer:",
                            text
                        );

                    }
                }
            }
        });

    } catch (err) {

        console.error("NFC error:", err);

    }
}


// start NFC after pressing button
document.getElementById("startNFC").addEventListener(
    "click",
    scanNFC
);
