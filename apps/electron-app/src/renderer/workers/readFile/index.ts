import ReadFileWorker from "./readFile?worker";

export function readFile(filePath: string) {
  const readFileWorker = new ReadFileWorker();

  return new Promise<Uint8Array>((resolve, reject) => {
    readFileWorker.addEventListener("message", async (event) => {
      if (event.data.type === "SUCCESS") {
        const sharedArrayBuffer = event.data
          .sharedArrayBuffer as SharedArrayBuffer;
        const file = new Uint8Array(sharedArrayBuffer);
        resolve(file);
      } else if (event.data.type === "FAIL") {
        reject(event.data.error);
      }

      readFileWorker.terminate();
    });

    readFileWorker.postMessage({
      type: "FILE_PATH",
      filePath,
    });
  });
}
