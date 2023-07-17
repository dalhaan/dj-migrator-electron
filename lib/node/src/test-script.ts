import fs from "fs/promises";
import path from "path";
// import { BeatGrid, CuePoint, rbgToHex } from "../../common/src/index";

import SeratoCrate from "./kaitai/compiled/SeratoCrate-ES6";

import * as musicMetadata from "music-metadata";

import * as ID3 from "./serato-parser/id3";
import * as VORBIS from "./serato-parser/vorbis";
// import { parseSeratoMarkers2Tag } from "./serato-parser/parseSeratoMarkers2Tag";
// import { parseSeratoBeatGridTag } from "./serato-parser/parseSeratoBeatGridTag";
const KaitaiStream = require("kaitai-struct/KaitaiStream");

// function parseId3(metadata: musicMetadata.IAudioMetadata) {
//   const seratoTags = ID3.getSeratoTags(metadata);

//   if (seratoTags.SeratoMarkers2) {
//     const decoded = ID3.decodeSeratoMarkers2Tag(seratoTags.SeratoMarkers2);
//     const parsed = parseSeratoMarkers2Tag(decoded);
//     console.log(parsed);
//   }

//   if (seratoTags.SeratoBeatGrid) {
//     const decoded = ID3.decodeSeratoBeatGridTag(seratoTags.SeratoBeatGrid);
//     const parsed = parseSeratoBeatGridTag(decoded);
//     console.log(parsed);
//   }
// }

// function parseVorbis(metadata: musicMetadata.IAudioMetadata) {
//   const seratoTags = VORBIS.getSeratoTags(metadata);

//   console.log(seratoTags);

//   if (seratoTags.SeratoMarkers2) {
//     const decoded = VORBIS.decodeSeratoMarkers2Tag(seratoTags.SeratoMarkers2);
//     const parsed = parseSeratoMarkers2Tag(decoded);
//     console.log(parsed);
//   }

//   if (seratoTags.SeratoBeatGrid) {
//     const decoded = VORBIS.decodeSeratoBeatGridTag(seratoTags.SeratoBeatGrid);
//     const parsed = parseSeratoBeatGridTag(decoded);
//     console.log(parsed);
//   }
// }

function parseCrate(data: Buffer) {
  const parsed = new SeratoCrate(new KaitaiStream(data));

  // console.log(parsed);

  const trackFilePaths: string[] = [];

  for (const tag of parsed.tags) {
    if (tag.body instanceof SeratoCrate.TrackTag) {
      for (const trackTagTag of tag.body.tags) {
        if (trackTagTag.body instanceof SeratoCrate.FilePathTag) {
          trackFilePaths.push(trackTagTag.body.filePath);
        }
      }
    }
  }

  return trackFilePaths;
}

async function main() {
  const absolutePath = path.resolve(
    // MP3
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/L-side - Zaga Dan.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Molecular - Skank.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Nu_Tone - Heaven Sent (Alternative Mix).mp3"
    // "/Users/dallanfreemantle/Desktop/Netsky - Free.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/DnB To Get Weird To II/Netsky - Tomorrows Another Day VIP.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 6/Clipz - Again.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 2/Kenji Kawai - Making of Cyborg (Flite Remix).wav"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/Analysed DnB/02. The Upbeats - Oddity - 9A - 170.mp3"
    // FLAC
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 6/Gonda - Hold Up (Rise Remix).flac"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 6/Trex - Stress Test.flac"
    // Crate
    "/Users/dallanfreemantle/Desktop/Serato USB Latest/_Serato_/Subcrates/D - Love not Lost 2.crate"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/_Serato_/Subcrates/D - DEYS.crate"
  );

  // const metadata = await musicMetadata.parseFile(absolutePath);
  const crate = await fs.readFile(absolutePath);

  // parseVorbis(metadata);
  // parseId3(metadata);
  const crateTracks = parseCrate(crate);
  console.log(crateTracks);
}

main();
