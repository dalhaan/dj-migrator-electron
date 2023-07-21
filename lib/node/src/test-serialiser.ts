const NULL_BYTE = new Uint8Array([0x00]);

// ==================================
// Beat Grid
// ==================================

class NonTerminalMarker {
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
}

class TerminalMarker {
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
}

class SeratoBeatGrid {
  private static magic = new Uint8Array([0x01, 0x00]);
  private nonTerminalMarkers: NonTerminalMarker[] = [];
  private terminalMarker: TerminalMarker | undefined;

  constructor() {}

  addNonTerminalMarker(position: number, beatsToNextMarker: number) {
    this.nonTerminalMarkers.push(
      new NonTerminalMarker(position, beatsToNextMarker)
    );
  }

  addTerminalMarker(position: number, bpm: number) {
    this.terminalMarker = new TerminalMarker(position, bpm);
  }

  build() {
    const buffer = Buffer.concat([
      SeratoBeatGrid.magic,
      ...this.nonTerminalMarkers.map((marker) => marker.buffer),
      ...(this.terminalMarker ? [this.terminalMarker.buffer] : []),
    ]);

    return buffer;
  }
}

abstract class Tag {
  type: Buffer;

  constructor(type: "COLOR" | "CUE" | "BPMLOCK") {
    this.type = Buffer.alloc(type.length + 1);
    this.type.write(type, "ascii");
  }

  abstract build(): Buffer;
}

class CueTag extends Tag {
  index: Buffer;
  position: Buffer;
  color: Buffer;
  name: Buffer | undefined;

  // constructor(index: number, position: number, color: [number, number, number], name?: string) {
  constructor(
    index: number,
    position: number,
    color: [number, number, number],
    name?: string
  ) {
    super("CUE");

    // Index
    this.index = Buffer.alloc(1);
    this.index.writeUIntBE(index, 0, 1);

    // Position
    this.position = Buffer.alloc(4);
    this.position.writeUInt32BE(position, 0);

    // Color
    this.color = Buffer.from(color);

    // Name
    if (name) {
      this.name = Buffer.from(name, "ascii");
    }
  }

  build() {
    const body = Buffer.concat([
      NULL_BYTE,
      this.index,
      this.position,
      NULL_BYTE,
      this.color,
      NULL_BYTE,
      NULL_BYTE,
      ...(this.name ? [this.name, NULL_BYTE] : []),
    ]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class ColorTag extends Tag {
  color: Buffer;

  constructor(color: [number, number, number]) {
    super("COLOR");
    this.color = Buffer.from(color);
  }

  build() {
    const body = Buffer.concat([NULL_BYTE, this.color]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class BpmLockTag extends Tag {
  isLocked: Buffer;

  constructor(isLocked: boolean) {
    super("BPMLOCK");
    this.isLocked = Buffer.alloc(1);
    this.isLocked.writeUintBE(isLocked ? 1 : 0, 0, 1);
  }

  build() {
    const body = this.isLocked;
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class SeratoMarkers2 {
  private static magic = new Uint8Array([0x01, 0x01]);
  tags: Tag[] = [];
  footer = NULL_BYTE;

  addCueTag(
    index: number,
    position: number,
    color: [number, number, number],
    name: string
  ) {
    this.tags.push(new CueTag(index, position, color, name));
  }

  addColorTag(color: [number, number, number]) {
    this.tags.push(new ColorTag(color));
  }

  addBpmLockTag(isLocked: boolean) {
    this.tags.push(new BpmLockTag(isLocked));
  }

  build() {
    return Buffer.concat([
      SeratoMarkers2.magic,
      ...this.tags.map((tag) => tag.build()),
      this.footer,
    ]);
  }
}

async function main() {
  const beatGrid = new SeratoBeatGrid();
  beatGrid.addNonTerminalMarker(1.2, 64);
  beatGrid.addNonTerminalMarker(2.4, 64);
  beatGrid.addTerminalMarker(5.0, 178);
  console.log(beatGrid);
  console.log(beatGrid.build());

  const marker = new SeratoMarkers2();
  marker.addColorTag([255, 0, 0]);
  marker.addCueTag(1, 2020, [255, 255, 255], "Energy 7");
  marker.addBpmLockTag(false);

  console.log(marker.build());
}

main();
