async function startNFC() {
  if (!("NDEFReader" in window)) {
    alert("Web NFC is not supported on this device/browser.");
    return;
  }

  const ndef = new NDEFReader();

  await ndef.scan();
  console.log("NFC scan started");

  ndef.onreading = (event) => {
    for (const record of event.message.records) {
      if (record.recordType === "text") {
        const text = new TextDecoder(record.encoding).decode(record.data);
        const number = parseInt(text.trim(), 10);

        if (!Number.isNaN(number)) {
          sendNfcNumberToCables(number);
        }
      }
    }
  };
}

function sendNfcNumberToCables(number) {
  if (!window.CABLES || !CABLES.patch) {
    console.warn("CABLES patch is not ready yet");
    return;
  }

  const op = CABLES.patch.getOpById("ne0qr3urb");

  if (!op) {
    console.warn("Var Set node not found");
    return;
  }

  op.getPort("Value").set(number);
  op.getPort("Trigger").trigger();

  console.log("NFC sent to cables:", number);
}

document.getElementById("startNFC").addEventListener("click", startNFC);
