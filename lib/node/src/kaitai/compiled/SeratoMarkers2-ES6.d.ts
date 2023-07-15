export default class SeratoMarkers2 {
  static Color: typeof Color;
  static Header: typeof Header;
  static Tag: typeof Tag;
  static ColorTag: typeof ColorTag;
  static CueTag: typeof CueTag;
  static BpmLockTag: typeof BpmLockTag;
  static UnknownTag: typeof UnknownTag;

  header: Header;
  tags: Tag[];

  constructor(stream: any);
}

class Color {
  red: number;
  green: number;
  blue: number;

  constructor(...args: any);
}

class Header {
  magic: [number, number];

  constructor(...args: any);
}

class Tag {
  type: string;
  len: number;
  body: ColorTag | CueTag | BpmLockTag | UnknownTag;

  constructor(...args: any);
}

class ColorTag {
  color: Color;

  constructor(...args: any);
}

class CueTag {
  index: number;
  position: number;
  color: Color;
  name: string;

  constructor(...args: any);
}

class BpmLockTag {
  isLocked: number;

  constructor(...args: any);
}

class UnknownTag {
  constructor(...args: any);
}
