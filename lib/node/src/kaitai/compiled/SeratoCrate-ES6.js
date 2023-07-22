const KaitaiStream = require("kaitai-struct/KaitaiStream");

export default class SeratoCrate {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.tags = [];
    var i = 0;
    while (!this._io.isEof()) {
      this.tags.push(new Tag(this._io, this, this._root));
      i++;
    }
  }
}

class ColumnTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.tags = [];
    var i = 0;
    while (!this._io.isEof()) {
      this.tags.push(new Tag(this._io, this, this._root));
      i++;
    }
  }
}

SeratoCrate.ColumnTag = ColumnTag;

class Tag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.type = KaitaiStream.bytesToStr(this._io.readBytes(4), "ASCII");
    this.length = this._io.readU4be();
    switch (this.type) {
      case "otrk":
        this._raw_body = this._io.readBytes(this.length);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new TrackTag(_io__raw_body, this, this._root);
        break;
      case "tvcn":
        this._raw_body = this._io.readBytes(this.length);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new ColumnNameTag(_io__raw_body, this, this._root);
        break;
      case "ptrk":
        this._raw_body = this._io.readBytes(this.length);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new FilePathTag(_io__raw_body, this, this._root);
        break;
      case "osrt":
        this._raw_body = this._io.readBytes(this.length);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new ColumnSortTag(_io__raw_body, this, this._root);
        break;
      case "ovct":
        this._raw_body = this._io.readBytes(this.length);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new ColumnTag(_io__raw_body, this, this._root);
        break;
      case "brev":
        this._raw_body = this._io.readBytes(this.length);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new ColumnSortDirTag(_io__raw_body, this, this._root);
        break;
      case "vrsn":
        this._raw_body = this._io.readBytes(this.length);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new VersionTag(_io__raw_body, this, this._root);
        break;
      default:
        this._raw_body = this._io.readBytes(this.length);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new UnknownTag(_io__raw_body, this, this._root);
        break;
    }
  }
}

SeratoCrate.Tag = Tag;

class TrackTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.tags = [];
    var i = 0;
    while (!this._io.isEof()) {
      this.tags.push(new Tag(this._io, this, this._root));
      i++;
    }
  }
}

SeratoCrate.TrackTag = TrackTag;

class FilePathTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.filePath = KaitaiStream.bytesToStr(
      this._io.readBytesFull(),
      "UTF-16BE"
    );
  }
}

SeratoCrate.FilePathTag = FilePathTag;

class ColumnSortDirTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.isDescending = this._io.readU1();
  }
}

SeratoCrate.ColumnSortDirTag = ColumnSortDirTag;

class VersionTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.body = KaitaiStream.bytesToStr(this._io.readBytesFull(), "UTF-16BE");
  }
}

SeratoCrate.VersionTag = VersionTag;

class ColumnSortTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.tags = [];
    var i = 0;
    while (!this._io.isEof()) {
      this.tags.push(new Tag(this._io, this, this._root));
      i++;
    }
  }
}

SeratoCrate.ColumnSortTag = ColumnSortTag;

class UnknownTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.body = this._io.readBytesFull();
  }
}

SeratoCrate.UnknownTag = UnknownTag;

class ColumnNameTag {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.name = KaitaiStream.bytesToStr(this._io.readBytesFull(), "UTF-16BE");
  }
}

SeratoCrate.ColumnNameTag = ColumnNameTag;
