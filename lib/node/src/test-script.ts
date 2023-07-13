import fs from "fs/promises";
import path from "path";

import SeratoBeatgrid from "./kaitai/compiled/SeratoBeatgrid";

import * as musicMetadata from "music-metadata";
import SeratoMarkers2 from "./kaitai/compiled/SeratoMarkers2";
import {
  decodeSeratoBeatGridTag,
  decodeSeratoMarkers2Tag,
  getSeratoTags,
} from "./serato-parser/id3";
const KataiStream = require("kaitai-struct/KaitaiStream");

function parseSeratoMarkers2Tag(data: Buffer) {
  const parsed = new SeratoMarkers2(new KataiStream(data));

  return parsed;
}

function parseSeratoBeatGridTag(data: Buffer) {
  const parsed = new SeratoBeatgrid(new KataiStream(data));

  return parsed;
}

async function main() {
  const absolutePath = path.resolve(
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/L-side - Zaga Dan.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Molecular - Skank.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Nu_Tone - Heaven Sent (Alternative Mix).mp3"
    // "/Users/dallanfreemantle/Desktop/Netsky - Free.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/DnB To Get Weird To II/Netsky - Tomorrows Another Day VIP.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 6/Clipz - Again.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 2/Kenji Kawai - Making of Cyborg (Flite Remix).wav"
    "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/Analysed DnB/02. The Upbeats - Oddity - 9A - 170.mp3"
  );

  const metadata = await musicMetadata.parseFile(absolutePath);

  const seratoTags = getSeratoTags(metadata);

  if (seratoTags.SeratoMarkers2) {
    const decoded = decodeSeratoMarkers2Tag(seratoTags.SeratoMarkers2);
    const parsed = parseSeratoMarkers2Tag(decoded);
    console.log(parsed);
  }

  if (seratoTags.SeratoBeatGrid) {
    const decoded = decodeSeratoBeatGridTag(seratoTags.SeratoBeatGrid);
    const parsed = parseSeratoBeatGridTag(decoded);
    console.log(parsed);
  }
}

main();
