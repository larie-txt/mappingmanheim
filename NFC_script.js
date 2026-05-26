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

                    } else {

                        console.warn(
                            "NFC tag did not contain a valid number"
                        );

                    }
                }
            }
        };

    } catch (error) {

        console.error("NFC error:", error);

    }
}

function setNfcNumber(number) {

    if (!window.CABLES || !CABLES.patch) {
        console.warn("CABLES patch not ready");
        return;
    }

    // set cables variable
    CABLES.patch.setVariable("nfcNumber", number);

    console.log("nfcNumber =", number);
}

document
    .getElementById("startNFC")
    .addEventListener("click", startNFC);
