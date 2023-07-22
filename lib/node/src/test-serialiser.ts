const NULL_BYTE = new Uint8Array([0x00]);

// ==================================
// Serato Crate
// ==================================

const TAG_TYPES = {
  VERSION_TAG: "vrsn",
  SORT_BY_COLUMN_TAG: "osrt",
  SORT_DIR_TAG: "brev",
  COLUMN_TAG: "ovct",
  COLUMN_NAME_TAG: "tvcn",
  COLUMN_WIDTH_TAG: "tvcw",
  TRACK_TAG: "otrk",
  FILE_PATH_TAG: "ptrk",
} as const;

type TagType = (typeof TAG_TYPES)[keyof typeof TAG_TYPES];

interface Serializable {
  serialize(): Buffer;
}

abstract class SeratoCrateTag implements Serializable {
  type: Buffer;

  constructor(type: TagType) {
    this.type = Buffer.from(type, "ascii");
  }

  abstract serialize(): Buffer;
}

class VersionTag extends SeratoCrateTag {
  versionMetadata: Buffer;

  constructor(versionMetadata: string) {
    super(TAG_TYPES.VERSION_TAG);

    // Encode string as UTF16BE
    this.versionMetadata = Buffer.from(versionMetadata, "utf16le").swap16();
  }

  serialize(): Buffer {
    const body = this.versionMetadata;
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class SortByColumnTag extends SeratoCrateTag {
  tags: SeratoCrateTag[] = [];

  constructor() {
    super(TAG_TYPES.SORT_BY_COLUMN_TAG);
  }

  addColumnNameTag(name: string) {
    this.tags.push(new ColumnNameTag(name));
  }

  addSortDirTag(isDescending: boolean) {
    this.tags.push(new SortDirTag(isDescending));
  }

  serialize(): Buffer {
    const body = Buffer.concat(this.tags.map((tag) => tag.serialize()));
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class SortDirTag extends SeratoCrateTag {
  isDescending: Buffer;

  constructor(isDescending: boolean) {
    super(TAG_TYPES.SORT_DIR_TAG);

    this.isDescending = Buffer.alloc(1);
    this.isDescending.set([isDescending ? 0x01 : 0x00]);
  }

  serialize(): Buffer {
    const body = this.isDescending;
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class ColumnTag extends SeratoCrateTag {
  tags: SeratoCrateTag[] = [];

  constructor() {
    super(TAG_TYPES.COLUMN_TAG);
  }

  addColumnNameTag(name: string) {
    this.tags.push(new ColumnNameTag(name));
  }

  addColumnWidthTag(width: string) {
    this.tags.push(new ColumnWidthTag(width));
  }

  serialize(): Buffer {
    const body = Buffer.concat(this.tags.map((tag) => tag.serialize()));
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class ColumnNameTag extends SeratoCrateTag {
  name: Buffer;

  constructor(name: string) {
    super(TAG_TYPES.COLUMN_NAME_TAG);

    // Encode string as UTF16BE
    this.name = Buffer.from(name, "utf16le").swap16();
  }

  serialize(): Buffer {
    const body = this.name;
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class ColumnWidthTag extends SeratoCrateTag {
  width: Buffer;

  constructor(width: string) {
    super(TAG_TYPES.COLUMN_WIDTH_TAG);

    // Encode string as UTF16BE
    this.width = Buffer.from(width, "utf16le").swap16();
  }

  serialize(): Buffer {
    const body = this.width;
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class TrackTag extends SeratoCrateTag {
  tags: SeratoCrateTag[] = [];

  constructor() {
    super(TAG_TYPES.TRACK_TAG);
  }

  addFilePathTag(filePath: string) {
    this.tags.push(new FilePathTag(filePath));
  }

  serialize(): Buffer {
    const body = Buffer.concat(this.tags.map((tag) => tag.serialize()));
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class FilePathTag extends SeratoCrateTag {
  filePath: Buffer;

  constructor(filePath: string) {
    super(TAG_TYPES.FILE_PATH_TAG);

    // Encode string as UTF16BE
    this.filePath = Buffer.from(filePath, "utf16le").swap16();
  }

  serialize(): Buffer {
    const body = this.filePath;
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class SeratoCrate implements Serializable {
  tags: SeratoCrateTag[] = [];

  addVersionTag(versionMetadata: string) {
    this.tags.push(new VersionTag(versionMetadata));
  }

  addSortByColumnTag(name: string, isDescending: boolean) {
    const tag = new SortByColumnTag();
    tag.addColumnNameTag(name);
    tag.addSortDirTag(isDescending);
    this.tags.push(tag);
  }

  addColumnTag(name: string, width: string) {
    const tag = new ColumnTag();
    tag.addColumnNameTag(name);
    tag.addColumnWidthTag(width);
    this.tags.push(tag);
  }

  addTrackTag(filePath: string) {
    const tag = new TrackTag();
    tag.addFilePathTag(filePath);
    this.tags.push(tag);
  }

  serialize(): Buffer {
    return Buffer.concat(this.tags.map((tag) => tag.serialize()));
  }
}

// ==================================
// Serato BeatGrid
// ==================================

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

class SeratoBeatGrid implements Serializable {
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

  serialize() {
    const buffer = Buffer.concat([
      SeratoBeatGrid.magic,
      ...this.nonTerminalMarkers.map((marker) => marker.buffer),
      ...(this.terminalMarker ? [this.terminalMarker.buffer] : []),
    ]);

    return buffer;
  }
}

// ==================================
// Serato Markers2
// ==================================

abstract class SeratoMarkers2Tag implements Serializable {
  type: Buffer;

  constructor(type: "COLOR" | "CUE" | "BPMLOCK") {
    this.type = Buffer.alloc(type.length + 1);
    this.type.write(type, "ascii");
  }

  abstract serialize(): Buffer;
}

class CueTag extends SeratoMarkers2Tag {
  index: Buffer;
  position: Buffer;
  color: Buffer;
  name: Buffer | undefined;

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

  serialize() {
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

class ColorTag extends SeratoMarkers2Tag {
  color: Buffer;

  constructor(color: [number, number, number]) {
    super("COLOR");
    this.color = Buffer.from(color);
  }

  serialize() {
    const body = Buffer.concat([NULL_BYTE, this.color]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class BpmLockTag extends SeratoMarkers2Tag {
  isLocked: Buffer;

  constructor(isLocked: boolean) {
    super("BPMLOCK");
    this.isLocked = Buffer.alloc(1);
    this.isLocked.writeUintBE(isLocked ? 1 : 0, 0, 1);
  }

  serialize() {
    const body = this.isLocked;
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.byteLength);

    return Buffer.concat([this.type, length, body]);
  }
}

class SeratoMarkers2 implements Serializable {
  private static magic = new Uint8Array([0x01, 0x01]);
  tags: SeratoMarkers2Tag[] = [];
  private footer = NULL_BYTE;

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

  serialize() {
    return Buffer.concat([
      SeratoMarkers2.magic,
      ...this.tags.map((tag) => tag.serialize()),
      this.footer,
    ]);
  }
}

async function main() {
  const beatGrid = new SeratoBeatGrid();
  beatGrid.addNonTerminalMarker(1.2, 64);
  beatGrid.addNonTerminalMarker(2.4, 64);
  beatGrid.addTerminalMarker(5.0, 178);
  console.log(beatGrid.serialize());

  const markers = new SeratoMarkers2();
  markers.addColorTag([255, 0, 0]);
  markers.addCueTag(1, 2020, [255, 255, 255], "Energy 7");
  markers.addBpmLockTag(false);
  console.log(markers.serialize());

  const crate = new SeratoCrate();
  // crate.addVersionTag("1.0/Serato ScratchLive Crate");
  // crate.addSortByColumnTag("key", false);
  crate.addColumnTag("song", "551");
  // crate.addTrackTag("music/DnB");
  console.log(crate.serialize());
}

main();
