import { BeatGrid } from "@dj-migrator/common";
import SeratoBeatgrid from "../kaitai/compiled/SeratoBeatgrid-ES6";
const KaitaiStream = require("kaitai-struct/KaitaiStream");

export function parseSeratoBeatGridTag(data: Buffer) {
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
