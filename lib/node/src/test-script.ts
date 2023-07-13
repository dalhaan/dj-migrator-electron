import fs from "fs/promises";
import path from "path";

import SeratoBeatgrid from "./kaitai/compiled/SeratoBeatgrid";

import * as musicMetadata from "music-metadata";
import SeratoMarkers2 from "./kaitai/compiled/SeratoMarkers2";
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

function getSeratoTags(metadata: musicMetadata.IAudioMetadata) {
  const geobTags = getGeobTags(metadata);

  const seratoTags: Record<"SeratoBeatGrid" | "SeratoMarkers2", Buffer | null> =
    {
      SeratoBeatGrid: null,
      SeratoMarkers2: null,
    };

  for (const tag of geobTags) {
    const data = tag.value.data as Buffer;

    // Serato Markers2
    if (data.toString().startsWith("erato Markers2")) {
      seratoTags.SeratoMarkers2 = data;
    }
    // Serato BeatGrid
    else if (data.toString().startsWith("erato BeatGrid")) {
      seratoTags.SeratoBeatGrid = data;
    }
  }

  return seratoTags;
}

function parseSeratoMarkers2Tag(data: Buffer) {
  const bodyBase64 = data.subarray(data.indexOf(0x00) + 1); // First NULL byte (0x00) marks end of the GEOB header

  const body = Buffer.from(bodyBase64.toString(), "base64");

  const parsed = new SeratoMarkers2(new KataiStream(body));

  // parsed.tags?.forEach((tag) =>
  //   console.log(tag.body, tag.body instanceof SeratoMarkers2.CueTag)
  // );

  return parsed;
}

function parseSeratoBeatGridTag(data: Buffer) {
  const body = data.subarray(data.indexOf(0x00) + 1); // First NULL byte (0x00) marks end of the GEOB header

  const parsed = new SeratoBeatgrid(new KataiStream(body));

  return parsed;
}

async function main() {
  const absolutePath = path.resolve(
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/L-side - Zaga Dan.mp3"
    "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Molecular - Skank.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Nu_Tone - Heaven Sent (Alternative Mix).mp3"
  );

  const metadata = await musicMetadata.parseFile(absolutePath);

  const seratoTags = getSeratoTags(metadata);

  if (seratoTags.SeratoMarkers2) {
    const parsed = parseSeratoMarkers2Tag(seratoTags.SeratoMarkers2);
    console.log(parsed);
  }

  if (seratoTags.SeratoBeatGrid) {
    const parsedBeatgrid = parseSeratoBeatGridTag(seratoTags.SeratoBeatGrid);
    console.log(parsedBeatgrid);
  }

  // await fs.writeFile(
  //   path.resolve(
  //     "/Users/dallanfreemantle/Desktop/Serato Beatgrid.octet-stream"
  //   ),
  //   bufferBody
  // );
}

main();
