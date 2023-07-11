import KaitaiStructCompiler from "kaitai-struct-compiler";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import path from "path";
import YAML from "yaml";

async function main() {
  let inputDir = process.argv[2];
  let outputDir = process.argv[3];

  // Validate args

  if (!inputDir || !fs.existsSync(inputDir)) {
    throw new Error("Invalid input dir (arg 1)");
  }
  if (!outputDir || !fs.existsSync(outputDir)) {
    throw new Error("Invalid output dir (arg 2)");
  }

  // Resolve file system paths

  inputDir = path.resolve(inputDir);
  outputDir = path.resolve(outputDir);

  // Gather all .ksy files

  let ksyFiles = await fsPromises.readdir(inputDir);
  ksyFiles = ksyFiles
    .filter((filename) => filename.endsWith(".ksy"))
    .map((filename) => path.resolve(inputDir, filename));

  // Compile all .ksy files
  let outputFilenames: string[] = [];

  for (const ksyFile of ksyFiles) {
    // Compile .ksy file

    const file = await fsPromises.readFile(ksyFile, {
      encoding: "utf-8",
    });
    const ksySchema = YAML.parse(file);
    const compiler = new KaitaiStructCompiler();
    const compiledCode = await compiler.compile(
      "javascript",
      ksySchema,
      null,
      false
    );

    outputFilenames = Object.keys(compiledCode).map((filename) =>
      path.resolve(outputDir, filename)
    );

    // Write compiled files

    const writingPromises = Object.entries(compiledCode).map(
      ([filename, code]) =>
        outputDir &&
        fsPromises.writeFile(path.resolve(outputDir, filename), code, "utf-8")
    );

    const writingResults = await Promise.allSettled(writingPromises);

    // Print any file writing errors

    const failedWritingReasons = writingResults
      .filter((result) => result.status === "rejected")
      .map((result) => (result as PromiseRejectedResult).reason);

    if (failedWritingReasons.length) {
      console.error(failedWritingReasons);
    }
  }

  console.log({
    inputDir,
    outputDir,
    inputFiles: ksyFiles,
    outputFiles: outputFilenames,
  });
}

main();
