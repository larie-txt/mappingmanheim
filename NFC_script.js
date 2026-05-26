async function scanNFC() {
  if (!("NDEFReader" in window)) {
    alert("Web NFC only works on Android Chrome.");
    return;
  }

  try {
    const ndef = new NDEFReader();

    await ndef.scan();
    console.log("NFC scan active");

    ndef.addEventListener("reading", ({ message }) => {
      console.log("NFC tag read:", message);

      for (const record of message.records) {
        if (record.recordType === "text") {
          const text = new TextDecoder(record.encoding)
            .decode(record.data)
            .trim();

          console.log("NFC text:", text);

          const value = Number(text);
          console.log("NFC number:", value);

          if (!Number.isNaN(value)) {
            if (window.cablesPatch) {
              window.cablesPatch.setVariable("nfcNumber", value);
              console.log("Sent to cables variable nfcNumber:", value);
            } else {
              console.error("window.cablesPatch does not exist yet");
            }
          }
        }
      }
    });
  } catch (err) {
    console.error("NFC error:", err);
  }
}

document.getElementById("startNFC").addEventListener("click", scanNFC);
