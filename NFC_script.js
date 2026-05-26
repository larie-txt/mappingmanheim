async function scanNFC() {
  if (!("NDEFReader" in window)) {
    console.error("Web NFC is not supported in this browser.");
    alert("Web NFC is only supported on Chrome for Android.");
    return;
  }

  if (!window.cablesPatch) {
    console.warn("Cables patch is not ready yet.");
    return;
  }

  try {
    const ndef = new NDEFReader();
    await ndef.scan();

    console.log("NFC scan started");

    ndef.addEventListener("reading", ({ message }) => {
      for (const record of message.records) {
        if (record.recordType === "text") {
          const textDecoder = new TextDecoder(record.encoding);
          const tagText = textDecoder.decode(record.data).trim();

          console.log("NFC tag text:", tagText);

          const numberValue = Number(tagText);

          if (!Number.isNaN(numberValue)) {
            window.cablesPatch.setVariable("nfcNumber", numberValue);
            console.log("Sent to cables:", numberValue);
          } else {
            console.warn("NFC tag text is not a number:", tagText);
          }
        }
      }
    });
  } catch (error) {
    console.error("NFC scan failed:", error);
  }
}

document.addEventListener("click", () => {
  scanNFC();
}, { once: true });


// temporary desktop test fallback
window.addEventListener("keydown", (e) => {
  if (!window.cablesPatch) return;

  if (e.key >= "0" && e.key <= "9") {
    const numberValue = Number(e.key);
    window.cablesPatch.setVariable("nfcNumber", numberValue);
    console.log("Test value sent to cables:", numberValue);
  }
});
