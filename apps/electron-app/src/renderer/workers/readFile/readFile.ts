const fs = require("fs/promises");
// import fs from "fs/promises";

onmessage = async (event: MessageEvent) => {
  if (event.data.type === "FILE_PATH") {
    try {
      const file = await fs.readFile(event.data.filePath);

      const sharedArrayBuffer = new SharedArrayBuffer(file.length);
      const buffer = new Uint8Array(sharedArrayBuffer);
      buffer.set(file);

      postMessage({
        type: "SUCCESS",
        sharedArrayBuffer,
      });
    } catch (error) {
      postMessage({
        type: "FAIL",
        error,
      });
    }
  }
};
