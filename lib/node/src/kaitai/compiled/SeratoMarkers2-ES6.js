const KaitaiStream = require("kaitai-struct/KaitaiStream");

export default class SeratoMarkers2 {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.header = new Header(this._io, this, this._root);
    this.tags = [];
    var i = 0;
    do {
      var _ = new Tag(this._io, this, this._root);
      this.tags.push(_);
      i++;
    } while (!(this._io.size - this._io.pos == 0 || _.lookAhead == 0));
  }
}

/**
 * The color tag describes the tracks color in Serato.
 * The color is a three byte i8 array: [r,g,b].
 */

class ColorTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this._unnamed0 = this._io.readBytes(1);
    this.color = new Color(this._io, this, this._root);
  }
}

SeratoMarkers2.ColorTag = ColorTag;

class Tag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.type = KaitaiStream.bytesToStr(
      this._io.readBytesTerm(0, false, true, true),
      "ASCII"
    );
    this.len = this._io.readU4be();
    switch (this.type) {
      case "COLOR":
        this._raw_body = this._io.readBytes(this.len);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new ColorTag(_io__raw_body, this, this._root);
        break;
      case "CUE":
        this._raw_body = this._io.readBytes(this.len);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new CueTag(_io__raw_body, this, this._root);
        break;
      case "BPMLOCK":
        this._raw_body = this._io.readBytes(this.len);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new BpmLockTag(_io__raw_body, this, this._root);
        break;
      default:
        this._raw_body = this._io.readBytes(this.len);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new UnknownTag(_io__raw_body, this, this._root);
        break;
    }
  }
}

/**
 * This instance looks ahead by one byte to find the
 * terminating null byte which indicates the end of
 * the markers. This is a hack because Kaitai doesn't
 * currently support repeating a sequence until a
 * terminating byte or ByteArray is encountered like
 * strz.
 */
Object.defineProperty(Tag.prototype, "lookAhead", {
  get: function () {
    if (this._m_lookAhead !== undefined) return this._m_lookAhead;
    if (this._io.size - this._io.pos > 0) {
      var _pos = this._io.pos;
      this._io.seek(this._io.pos);
      this._m_lookAhead = this._io.readU1();
      this._io.seek(_pos);
    }
    return this._m_lookAhead;
  },
});

SeratoMarkers2.Tag = Tag;

/**
 * Colors are represented as a three-byte i8 array of [r, g, b]
 */

class Color {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.red = this._io.readU1();
    this.green = this._io.readU1();
    this.blue = this._io.readU1();
  }
}

SeratoMarkers2.Color = Color;

class Header {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.magic = this._io.readBytes(2);
    if (!(KaitaiStream.byteArrayCompare(this.magic, [1, 1]) == 0)) {
      throw new KaitaiStream.ValidationNotEqualError(
        [1, 1],
        this.magic,
        this._io,
        "/types/header/seq/0"
      );
    }
  }
}

SeratoMarkers2.Header = Header;

class UnknownTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {}
}

SeratoMarkers2.UnknownTag = UnknownTag;

/**
 * The bpmlock tag describes whether the beatgrid is locked.
 * The `is_locked` value is a boolean.
 */

class BpmLockTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.isLocked = this._io.readU1();
  }
}

SeratoMarkers2.BpmLockTag = BpmLockTag;

/**
 * The cue tag describes a cue point in Serato.
 * The cue tag contains its index, position (ms), color
 * (three byte i8 array: [r,g,b]), and name (null-terminated
 * ASCII string).
 */

class CueTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this._unnamed0 = this._io.readBytes(1);
    this.index = this._io.readU1();
    this.position = this._io.readU4be();
    this._unnamed3 = this._io.readBytes(1);
    this.color = new Color(this._io, this, this._root);
    this._unnamed5 = this._io.readBytes(2);
    this.name = KaitaiStream.bytesToStr(
      this._io.readBytesTerm(0, false, true, true),
      "ASCII"
    );
  }
}

SeratoMarkers2.CueTag = CueTag;
