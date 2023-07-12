import fs from "fs/promises";
import path from "path";

import SeratoBeatgrid from "./kaitai/compiled/SeratoBeatgrid";

import * as musicMetadata from "music-metadata";
const KataiStream = require("kaitai-struct/KaitaiStream");

function getGeobTags(metadata: musicMetadata.IAudioMetadata) {
  const id3Version = Object.keys(metadata.native).find((tagType) =>
    tagType.startsWith("ID3v2")
  );

  if (!id3Version) throw new Error("No ID3v2 tags found");

  const geobTags = metadata.native[id3Version].filter(
    (tag) => tag.id === "GEOB"
  );

  return geobTags;
}

function getSeratoTags(geobTags: musicMetadata.ITag[]) {
  const seratoTags: Record<"SeratoBeatGrid", Buffer | null> = {
    SeratoBeatGrid: null,
  };

  for (const tag of geobTags) {
    const data = tag.value.data as Buffer;

    // Serato BeatGrid
    if (data.toString().startsWith("erato BeatGrid")) {
      seratoTags.SeratoBeatGrid = data;
    }
  }

  return seratoTags;
}

function parseSeratoBeatGridTag(data: Buffer) {
  const body = data.subarray(data.indexOf(0x00) + 1); // First NULL byte (0x00) marks end of the GEOB header

  const parsedBeatgrid = new SeratoBeatgrid(new KataiStream(body));

  return parsedBeatgrid;
}

async function main() {
  const absolutePath = path.resolve(
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/L-side - Zaga Dan.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Molecular - Skank.mp3"
    "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Nu_Tone - Heaven Sent (Alternative Mix).mp3"
  );

  const metadata = await musicMetadata.parseFile(absolutePath);

  const geobTags = getGeobTags(metadata);

  const seratoTags = getSeratoTags(geobTags);

  if (seratoTags.SeratoBeatGrid) {
    const parsedBeatgrid = parseSeratoBeatGridTag(seratoTags.SeratoBeatGrid);
    console.log("Parsed: ", parsedBeatgrid);
  }

  // await fs.writeFile(
  //   path.resolve(
  //     "/Users/dallanfreemantle/Desktop/Serato Beatgrid.octet-stream"
  //   ),
  //   bufferBody
  // );
}

main();
