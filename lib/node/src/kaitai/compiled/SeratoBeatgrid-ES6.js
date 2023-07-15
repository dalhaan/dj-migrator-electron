const KaitaiStream = require("kaitai-struct/KaitaiStream");

export default class SeratoBeatgrid {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.header = new Header(this._io, this, this._root);
    if (this.header.noMarkers > 0) {
      this.nonTerminalMarkers = [];
      for (var i = 0; i < this.header.noMarkers - 1; i++) {
        this.nonTerminalMarkers.push(
          new NonTerminalMarker(this._io, this, this._root)
        );
      }
    }
    if (this.header.noMarkers > 0) {
      this.terminalMarker = new TerminalMarker(this._io, this, this._root);
    }
    this.footer = this._io.readBytes(1);
  }
}

class Header {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.magic = this._io.readBytes(2);
    if (!(KaitaiStream.byteArrayCompare(this.magic, [1, 0]) == 0)) {
      throw new KaitaiStream.ValidationNotEqualError(
        [1, 0],
        this.magic,
        this._io,
        "/types/header/seq/0"
      );
    }
    this.noMarkers = this._io.readU4be();
  }
}

SeratoBeatgrid.Header = Header;

class NonTerminalMarker {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.position = this._io.readF4be();
    this.beatsUntilNextMarker = this._io.readU4be();
  }
}

SeratoBeatgrid.NonTerminalMarker = NonTerminalMarker;

class TerminalMarker {
  constructor(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  _read() {
    this.position = this._io.readF4be();
    this.bpm = this._io.readF4be();
  }
}

SeratoBeatgrid.TerminalMarker = TerminalMarker;
