import { Serializable } from "./common";

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

export class SeratoCrate implements Serializable {
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
