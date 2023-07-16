import fs from "fs/promises";
import path from "path";
import { BeatGrid, CuePoint, rbgToHex } from "../../common/src/index";

import SeratoBeatgrid from "./kaitai/compiled/SeratoBeatgrid";

import * as musicMetadata from "music-metadata";
import SeratoMarkers2 from "./kaitai/compiled/SeratoMarkers2";
import * as ID3 from "./serato-parser/id3";
import * as VORBIS from "./serato-parser/vorbis";
const KaitaiStream = require("kaitai-struct/KaitaiStream");

function parseSeratoMarkers2Tag(data: Buffer) {
  const parsed = new SeratoMarkers2(new KaitaiStream(data));

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

  return cuePoints;
}

function parseSeratoBeatGridTag(data: Buffer) {
  const parsed = new SeratoBeatgrid(new KaitaiStream(data));

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

  return beatGrids;
}

function parseId3(metadata: musicMetadata.IAudioMetadata) {
  const seratoTags = ID3.getSeratoTags(metadata);

  if (seratoTags.SeratoMarkers2) {
    const decoded = ID3.decodeSeratoMarkers2Tag(seratoTags.SeratoMarkers2);
    const parsed = parseSeratoMarkers2Tag(decoded);
    console.log(parsed);
  }

  if (seratoTags.SeratoBeatGrid) {
    const decoded = ID3.decodeSeratoBeatGridTag(seratoTags.SeratoBeatGrid);
    const parsed = parseSeratoBeatGridTag(decoded);
    console.log(parsed);
  }
}

function parseVorbis(metadata: musicMetadata.IAudioMetadata) {
  const seratoTags = VORBIS.getSeratoTags(metadata);

  console.log(seratoTags);

  if (seratoTags.SeratoMarkers2) {
    const decoded = VORBIS.decodeSeratoMarkers2Tag(seratoTags.SeratoMarkers2);
    const parsed = parseSeratoMarkers2Tag(decoded);
    console.log(parsed);
  }

  if (seratoTags.SeratoBeatGrid) {
    const decoded = VORBIS.decodeSeratoBeatGridTag(seratoTags.SeratoBeatGrid);
    const parsed = parseSeratoBeatGridTag(decoded);
    console.log(parsed);
  }
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
    "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 6/Gonda - Hold Up (Rise Remix).flac"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 6/Trex - Stress Test.flac"
  );

  const metadata = await musicMetadata.parseFile(absolutePath);

  parseVorbis(metadata);
  // parseId3(metadata);
}

main();
