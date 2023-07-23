import fs from "fs/promises";
import Mp3Tag from "mp3tag.js";
import * as musicMetadata from "music-metadata";

const NULL_BYTE = new Uint8Array([0x00]);

// ==================================
// Serato Crate
// ==================================

const TagType = {
  VERSION_TAG: "vrsn",
  SORT_BY_COLUMN_TAG: "osrt",
  SORT_DIR_TAG: "brev",
  COLUMN_TAG: "ovct",
  COLUMN_NAME_TAG: "tvcn",
  COLUMN_WIDTH_TAG: "tvcw",
  TRACK_TAG: "otrk",
  FILE_PATH_TAG: "ptrk",
} as const;

type TagType = (typeof TagType)[keyof typeof TagType];

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
    super(TagType.VERSION_TAG);

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
    super(TagType.SORT_BY_COLUMN_TAG);
  }

  addColumnNameTag(name: string) {
    this.tags.push(new ColumnNameTag(name));

    return this;
  }

  addSortDirTag(isDescending: boolean) {
    this.tags.push(new SortDirTag(isDescending));

    return this;
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
    super(TagType.SORT_DIR_TAG);

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
    super(TagType.COLUMN_TAG);
  }

  addColumnNameTag(name: string) {
    const tag = new ColumnNameTag(name);

    this.tags.push(tag);

    return this;
  }

  addColumnWidthTag(width: string) {
    const tag = new ColumnWidthTag(width);

    this.tags.push(tag);

    return this;
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
    super(TagType.COLUMN_NAME_TAG);

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
    super(TagType.COLUMN_WIDTH_TAG);

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
    super(TagType.TRACK_TAG);
  }

  addFilePathTag(filePath: string) {
    const tag = new FilePathTag(filePath);

    this.tags.push(tag);

    return this;
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
    super(TagType.FILE_PATH_TAG);

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
    const tag = new VersionTag(versionMetadata);

    this.tags.push(tag);

    return this;
  }

  addSortByColumnTag(name: string, isDescending: boolean) {
    const tag = new SortByColumnTag();

    tag.addColumnNameTag(name);
    tag.addSortDirTag(isDescending);
    this.tags.push(tag);

    return this;
  }

  addColumnTag(name: string, width: string) {
    const tag = new ColumnTag();

    tag.addColumnNameTag(name);
    tag.addColumnWidthTag(width);
    this.tags.push(tag);

    return this;
  }

  addTrackTag(filePath: string) {
    const tag = new TrackTag();

    tag.addFilePathTag(filePath);
    this.tags.push(tag);

    return this;
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
    name: string
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
    this.name = Buffer.from(name, "ascii");
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

    return this;
  }

  addColorTag(color: [number, number, number]) {
    this.tags.push(new ColorTag(color));

    return this;
  }

  addBpmLockTag(isLocked: boolean) {
    this.tags.push(new BpmLockTag(isLocked));

    return this;
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
  // const beatGrid = new SeratoBeatGrid();
  // beatGrid
  //   .addNonTerminalMarker(0.04595804959535599, 64)
  //   .addNonTerminalMarker(22.110000610351562, 20)
  //   .addTerminalMarker(33.13986587524414, 174.0264892578125);
  // // beatGrid.addTerminalMarker(0.17129819095134735, 172);
  // console.log(beatGrid.serialize());
  // // await fs.writeFile(
  // //   "/Users/dallanfreemantle/Desktop/three-beat-grids-S.octet-stream",
  // //   beatGrid.serialize()
  // // );
  // const markers = new SeratoMarkers2();
  // markers
  //   .addColorTag([255, 255, 255])
  //   .addCueTag(2, 41, [0, 0, 204], "")
  //   .addCueTag(3, 8317, [204, 204, 0], "")
  //   .addBpmLockTag(false);
  // console.log(markers.serialize());
  // // await fs.writeFile(
  // //   "/Users/dallanfreemantle/Desktop/two-markers-S.octet-stream",
  // //   markers.serialize()
  // // );
  // const crate = new SeratoCrate();
  // crate
  //   .addVersionTag("1.0/Serato ScratchLive Crate")
  //   .addSortByColumnTag("song", false)
  //   .addColumnTag("song", "551")
  //   .addColumnTag("playCount", "0")
  //   .addColumnTag("bpm", "0")
  //   .addColumnTag("length", "0")
  //   .addColumnTag("artist", "0")
  //   .addColumnTag("album", "0")
  //   .addColumnTag("comment", "0")
  //   .addTrackTag("music/DnB To Get Weird To II/Alix Perez - Good To Me.mp3");
  // console.log(crate.serialize());
  // // await fs.writeFile(
  // //   "/Users/dallanfreemantle/Desktop/FLAAC-S.crate",
  // //   crate.serialize()
  // // );

  // const tags = await NodeID3.read(
  //   "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/L-side - Zaga Dan.mp3"
  // );

  // WRITE

  // const file = await fs.readFile(
  //   "/Users/dallanfreemantle/Desktop/Deadline - Dreamer.mp3"
  // );

  // const tag = new Mp3Tag(file);

  // tag.read();

  // const seratoBeatGridTag = tag.tags.v2.GEOB.find(
  //   (tag) => tag.description === "Serato BeatGrid"
  // );

  // // console.log(tag.tags.v2.GEOB);

  // seratoBeatGridTag.object = [1, 0, 0, 0, 0, 0, 0];

  // tag.save();

  // await fs.writeFile(
  //   "/Users/dallanfreemantle/Desktop/Deadline - Dreamer-S.mp3",
  //   Buffer.from(tag.buffer)
  // );

  // READ

  // const file = await fs.readFile(
  //   "/Users/dallanfreemantle/Desktop/Deadline - Dreamer-S.mp3"
  // );

  // const tag = new Mp3Tag(file);

  // tag.read();

  // // const seratoBeatGridTag = tag.tags.v2.GEOB.find(
  // //   (tag) => tag.description === "Serato BeatGrid"
  // // );

  // console.log(tag.tags.v2.GEOB);

  const file = await fs.readFile(
    "/Users/dallanfreemantle/Desktop/Deadline - Dreamer.mp3"
  );

  // const metadata = await musicMetadata.parseFile(
  //   "/Users/dallanfreemantle/Desktop/Deadline - Dreamer.mp3"
  // );

  // const musicMetaDataSeratoMarkers2 = metadata.native["ID3v2.3"].find(
  //   (tag) => tag.value.description === "Serato Markers2"
  // );

  // let musicMetadataData = musicMetaDataSeratoMarkers2?.value.data;
  // musicMetadataData = musicMetadataData.subarray(
  //   musicMetadataData.indexOf(0x00) + 1
  // );

  // console.log(musicMetadataData);

  // Buffer.from(musicMetaDataSeratoMarkers2?.value.data.toString(), "base64");

  // await fs.writeFile(
  //   "/Users/dallanfreemantle/Desktop/music-metadata-dreamer-markers2.octet-stream",
  //   musicMetaDataSeratoMarkers2?.value.data
  // );

  const tag = new Mp3Tag(file);

  tag.read();

  // const seratoMarkers2Tag = tag.tags.v2.GEOB.find(
  //   (tag) => tag.description === "Serato Markers2"
  // );

  // console.log(seratoMarkers2Tag);

  // function seratoMarkers2BufferToMp3TagArray(buffer: Buffer): number[] {
  //   const lineLength = 72;

  //   const lines: string[] = [];
  //   let remainder = buffer.toString("base64");
  //   while (remainder) {
  //     const line = remainder.slice(0, lineLength);
  //     lines.push(line);
  //     remainder = remainder.slice(lineLength);
  //   }

  //   const encoded = lines.join("\n");
  //   // const encodedBuffer = Buffer.from(encoded);
  //   const encodedBuffer = Buffer.alloc(468);
  //   encodedBuffer.set(Buffer.from(encoded));
  //   const encodedArray = [1, 1, ...Array.from(encodedBuffer)];

  //   return encodedArray;
  // }

  // const markers = new SeratoMarkers2();
  // markers
  //   .addColorTag([255, 255, 255])
  //   .addCueTag(1, 1000, [204, 0, 0], "Cue 1")
  //   .addCueTag(2, 2000, [0, 204, 0], "Cue 2")
  //   .addCueTag(3, 3000, [0, 0, 204], "Cue 3")
  //   .addBpmLockTag(false);

  // const seratoMarkers2Array = seratoMarkers2BufferToMp3TagArray(
  //   markers.serialize()
  // );

  // seratoMarkers2Tag.object = seratoMarkers2Array;

  // console.log(seratoMarkers2Tag);

  tag.save({
    // strict: true,
    unsynch: true,
  });

  await fs.writeFile(
    "/Users/dallanfreemantle/Desktop/dreamer-S-unstrict-unsync.mp3",
    Buffer.from(tag.buffer)
  );
}

main();
