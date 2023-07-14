import fs from "fs/promises";
import path from "path";
import { BeatGrid, CuePoint } from "../../common/src/index";

import SeratoBeatgrid from "./kaitai/compiled/SeratoBeatgrid";

import * as musicMetadata from "music-metadata";
import SeratoMarkers2 from "./kaitai/compiled/SeratoMarkers2";
import {
  decodeSeratoBeatGridTag,
  decodeSeratoMarkers2Tag,
  getSeratoTags,
} from "./serato-parser/id3";
const KataiStream = require("kaitai-struct/KaitaiStream");

/**
 * Converts a decimal to a hex string.
 * Hex strings are trimmed by default so the hex string
 * is padded with "0"s to ensure it is a full byte.
 */
function decimalToHex(decimal: number) {
  return decimal.toString(16).padStart(2, "0");
}

function rbgToHex(red: number, green: number, blue: number) {
  return `#${decimalToHex(red)}${decimalToHex(green)}${decimalToHex(blue)}`;
}

function parseSeratoMarkers2Tag(data: Buffer) {
  // Parse tag with Kaitai
  const parsed = new SeratoMarkers2(new KataiStream(data));

  const cuePoints: CuePoint[] = [];

  if (parsed.tags) {
    for (const tag of parsed.tags) {
      // CuePoint
      if (tag.body instanceof SeratoMarkers2.CueTag) {
        cuePoints.push(
          new CuePoint({
            index: tag.body.index,
            position: tag.body.position,
            color: rbgToHex(
              tag.body.color.red,
              tag.body.color.green,
              tag.body.color.blue
            ),
            name: tag.body.name || undefined,
          })
        );
      }
    }
  }

  console.log(cuePoints);

  return parsed;
}

function parseSeratoBeatGridTag(data: Buffer) {
  const parsed = new SeratoBeatgrid(new KataiStream(data));

  const beatGrids: BeatGrid[] = [];

  // Non-terminal beat grid
  if (parsed.nonTerminalMarkers && parsed.terminalMarker) {
    for (const [
      index,
      nonTerminalMarker,
    ] of parsed.nonTerminalMarkers.entries()) {
      // Calculate BPM from time to the next marker and beats to next marker
      const nextMarkersPosition =
        index < parsed.nonTerminalMarkers.length - 1
          ? parsed.nonTerminalMarkers[index + 1].position
          : parsed.terminalMarker.position;
      const timeUntilNextMarker =
        nextMarkersPosition - nonTerminalMarker.position;
      const bpm =
        nonTerminalMarker.beatsUntilNextMarker * (60 / timeUntilNextMarker);

      beatGrids.push(
        new BeatGrid({
          position: nonTerminalMarker.position,
          bpm: bpm,
        })
      );
    }
  }

  if (parsed.terminalMarker) {
    beatGrids.push(
      new BeatGrid({
        position: parsed.terminalMarker.position,
        bpm: parsed.terminalMarker.bpm,
      })
    );
  }

  console.log(beatGrids);

  return parsed;
}

async function main() {
  const absolutePath = path.resolve(
    "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/L-side - Zaga Dan.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Molecular - Skank.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Nu_Tone - Heaven Sent (Alternative Mix).mp3"
    // "/Users/dallanfreemantle/Desktop/Netsky - Free.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/DnB To Get Weird To II/Netsky - Tomorrows Another Day VIP.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 6/Clipz - Again.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 2/Kenji Kawai - Making of Cyborg (Flite Remix).wav"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/Analysed DnB/02. The Upbeats - Oddity - 9A - 170.mp3"
  );

  const metadata = await musicMetadata.parseFile(absolutePath);

  const seratoTags = getSeratoTags(metadata);

  if (seratoTags.SeratoMarkers2) {
    const decoded = decodeSeratoMarkers2Tag(seratoTags.SeratoMarkers2);
    const parsed = parseSeratoMarkers2Tag(decoded);
    // console.log(parsed);
  }

  if (seratoTags.SeratoBeatGrid) {
    const decoded = decodeSeratoBeatGridTag(seratoTags.SeratoBeatGrid);
    const parsed = parseSeratoBeatGridTag(decoded);
    // console.log(parsed);
  }
}

main();
