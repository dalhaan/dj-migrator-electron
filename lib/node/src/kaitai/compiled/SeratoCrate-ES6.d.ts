export default class SeratoCrate {
  static ColumnTag: typeof ColumnTag;
  static Tag: typeof Tag;
  static TrackTag: typeof TrackTag;
  static FilePathTag: typeof FilePathTag;
  static FirstColumnTag: typeof FirstColumnTag;
  static VersionTag: typeof VersionTag;
  static UnknownTag: typeof UnknownTag;
  static ColumnNameTag: typeof ColumnNameTag;

  tags: Tag[];

  constructor(stream: any);
}

class ColumnTag {
  tags: Tag[];

  constructor(...args: any);
}

class Tag {
  type: string;
  length: number;
  body:
    | TrackTag
    | ColumnNameTag
    | FilePathTag
    | FirstColumnTag
    | ColumnTag
    | VersionTag
    | UnknownTag;

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

class FirstColumnTag {
  tags: Tag[];

  constructor(...args: any);
}

class VersionTag {
  body: string;

  constructor(...args: any);
}

class UnknownTag {
  body: any;

  constructor(...args: any);
}

class ColumnNameTag {
  name: string;

  constructor(...args: any);
}
