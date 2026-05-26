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

          // set variable value
          CABLES.patch.setVariable("nfcNumber", number);

          // trigger your Var Set Trigger node
          CABLES.patch.trigger("nfcTrigger");

          console.log("nfcNumber =", number);
        }
      }
    }
  };
}

document
  .getElementById("startNFC")
  .addEventListener("click", startNFC);
