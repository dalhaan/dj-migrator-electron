import { NULL_BYTE, Serializable } from "./common";

class NonTerminalMarker implements Serializable {
  static size = 8;
  buffer: Buffer;

  constructor(position: number, beatsToNextMarker: number) {
    const buffer = Buffer.alloc(NonTerminalMarker.size);

    // Position
    buffer.writeFloatBE(position, 0);

    // Beats to next marker
    buffer.writeUInt32BE(beatsToNextMarker, 4);

    this.buffer = buffer;
  }

  serialize() {
    return this.buffer;
  }
}

class TerminalMarker implements Serializable {
  static size = 8;
  buffer: Buffer;

  constructor(position: number, bpm: number) {
    const buffer = Buffer.alloc(TerminalMarker.size);

    // Position
    buffer.writeFloatBE(position, 0);

    // Beats to next marker
    buffer.writeFloatBE(bpm, 4);

    this.buffer = buffer;
  }

  serialize() {
    return this.buffer;
  }
}

export class SeratoBeatGrid implements Serializable {
  private static magic = new Uint8Array([0x01, 0x00]);
  private nonTerminalMarkers: NonTerminalMarker[] = [];
  private terminalMarker: TerminalMarker | undefined;
  private footer = NULL_BYTE;

  constructor() {}

  addNonTerminalMarker(position: number, beatsToNextMarker: number) {
    this.nonTerminalMarkers.push(
      new NonTerminalMarker(position, beatsToNextMarker)
    );

    return this;
  }

  addTerminalMarker(position: number, bpm: number) {
    this.terminalMarker = new TerminalMarker(position, bpm);

    return this;
  }

  serialize() {
    const noMarkers = Buffer.alloc(4);
    noMarkers.writeUInt32BE(
      this.nonTerminalMarkers.length + (this.terminalMarker ? 1 : 0)
    );

    const buffer = Buffer.concat([
      SeratoBeatGrid.magic,
      noMarkers,
      ...this.nonTerminalMarkers.map((marker) => marker.buffer),
      ...(this.terminalMarker ? [this.terminalMarker.buffer] : []),
      this.footer,
    ]);

    return buffer;
  }
}
