let cablesPatch = null;

function patchFinishedLoading(patch) {
  cablesPatch = patch;
  console.log("Cables patch loaded");

  // default value
  cablesPatch.setVariable("nfcNumber", 0);
}

async function scanNFC() {
  if (!("NDEFReader" in window)) {
    console.error("Web NFC is not supported in this browser.");
    alert("Web NFC is only supported on Chrome for Android.");
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
          const tagText = textDecoder.decode(record.data);

          console.log("NFC tag text:", tagText);

          const numberValue = Number(tagText);

          if (!Number.isNaN(numberValue)) {
            cablesPatch?.setVariable("nfcNumber", numberValue);
            console.log("Sent to cables:", numberValue);
          } else {
            console.warn("NFC tag text is not a number:", tagText);
          }
        }
      }
    });

  	window.addEventListener("keydown", (e) => {
      if (!window.cablesPatch) return;

      if (e.key >= "0" && e.key <= "9") {
        const numberValue = Number(e.key);
          window.cablesPatch.setVariable("nfcNumber", numberValue);
          console.log("Test value sent to cables:", numberValue);
    }
});
    
  } catch (error) {
    console.error("NFC scan failed:", error);
  }
}

document.addEventListener("click", () => {
  scanNFC();
}, { once: true });
