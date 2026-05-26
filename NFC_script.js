async function startNFC() {
  if (!("NDEFReader" in window)) {
    alert("Web NFC is not supported on this device/browser.");
    return;
  }

  const ndef = new NDEFReader();

  await ndef.scan();

  ndef.onreading = (event) => {
    for (const record of event.message.records) {
      if (record.recordType === "text") {
        const text = new TextDecoder(record.encoding).decode(record.data);
        const number = parseInt(text.trim(), 10);

        if (!Number.isNaN(number)) {
          window.CABLES.patch.setVariable("nfcNumber", number);
          console.log("nfcNumber =", number);
        }
      }
    }
  };
}

document.getElementById("startNFC").addEventListener("click", startNFC);