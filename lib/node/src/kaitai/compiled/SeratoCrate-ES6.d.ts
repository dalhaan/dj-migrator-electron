export default class SeratoCrate {
  static Tag: typeof Tag;
  static VersionTag: typeof VersionTag;
  static ColumnSortTag: typeof ColumnSortTag;
  static ColumnSortDirTag: typeof ColumnSortDirTag;
  static ColumnTag: typeof ColumnTag;
  static ColumnNameTag: typeof ColumnNameTag;
  static ColumnWidthTag: typeof ColumnWidthTag;
  static TrackTag: typeof TrackTag;
  static FilePathTag: typeof FilePathTag;
  static UnknownTag: typeof UnknownTag;

  tags: Tag[];

  constructor(stream: any);
}

class Tag {
  type: string;
  length: number;
  body:
    | VersionTag
    | ColumnSortTag
    | ColumnSortDirTag
    | ColumnTag
    | ColumnNameTag
    | ColumnWidthTag
    | TrackTag
    | FilePathTag
    | UnknownTag;

  constructor(...args: any);
}

class VersionTag {
  body: string;

  constructor(...args: any);
}

class ColumnSortTag {
  tags: Tag[];

  constructor(...args: any);
}

class ColumnSortDirTag {
  isDescending: number;

  constructor(...args: any);
}

class ColumnTag {
  tags: Tag[];

  constructor(...args: any);
}

class ColumnNameTag {
  name: string;

  constructor(...args: any);
}

class ColumnWidthTag {
  width: string;

  constructor(...args: any);
}

class TrackTag {
  tags: Tag[];

  constructor(...args: any);
}

class FilePathTag {
  filePath: string;

  constructor(...args: any);
}

class UnknownTag {
  body: any;

  constructor(...args: any);
}
