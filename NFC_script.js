async function scanNFC() {
  if (!("NDEFReader" in window)) {
    alert("Web NFC only works on Android Chrome.");
    return;
  }

  try {
    const ndef = new NDEFReader();

    ndef.addEventListener("reading", ({ message }) => {
      for (const record of message.records) {
        if (record.recordType === "text") {
          const text = new TextDecoder(record.encoding)
            .decode(record.data)
            .trim();

          const value = Number(text);

          if (!Number.isNaN(value)) {
            window.cablesPatch.setVariable("nfcNumber", value);
            console.log("NFC value sent:", value);
          } else {
            console.warn("Tag text is not a number:", text);
          }
        }
      }
    });

    await ndef.scan();
    console.log("NFC scan active");
  } catch (err) {
    console.error("NFC error:", err);
  }
}

document.getElementById("startNFC").addEventListener("click", scanNFC);
