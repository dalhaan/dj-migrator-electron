// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.SeratoBeatgrid = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
var SeratoBeatgrid = (function() {
  function SeratoBeatgrid(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  SeratoBeatgrid.prototype._read = function() {
    this.header = new Header(this._io, this, this._root);
    this.nonTerminalMarkers = [];
    for (var i = 0; i < (this.header.noMarkers - 1); i++) {
      this.nonTerminalMarkers.push(new NonTerminalMarker(this._io, this, this._root));
    }
    this.terminalMarker = new TerminalMarker(this._io, this, this._root);
    this.footer = this._io.readBytes(1);
  }

  var Header = SeratoBeatgrid.Header = (function() {
    function Header(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    Header.prototype._read = function() {
      this.magic = this._io.readBytes(2);
      if (!((KaitaiStream.byteArrayCompare(this.magic, [1, 0]) == 0))) {
        throw new KaitaiStream.ValidationNotEqualError([1, 0], this.magic, this._io, "/types/header/seq/0");
      }
      this.noMarkers = this._io.readU4be();
    }

    return Header;
  })();

  var NonTerminalMarker = SeratoBeatgrid.NonTerminalMarker = (function() {
    function NonTerminalMarker(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    NonTerminalMarker.prototype._read = function() {
      this.position = this._io.readF4be();
      this.beatsUntilNextMarker = this._io.readU4be();
    }

    return NonTerminalMarker;
  })();

  var TerminalMarker = SeratoBeatgrid.TerminalMarker = (function() {
    function TerminalMarker(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    TerminalMarker.prototype._read = function() {
      this.position = this._io.readF4be();
      this.bpm = this._io.readF4be();
    }

    return TerminalMarker;
  })();

  /**
   * The header of the Serato BeatGrid ID3 tag contains a magic signature
   * and the number of beatgrid markers.
   */

  /**
   * Every marker except the last marker is a non-terminal marker which
   * only has its position and the number of beats until the next marker.
   * The BPM of this section is calculated from the number of beats until
   * the next marker multiplied by the time until the next marker:
   * `beats_until_next_marker * (60 / (next_marker_position - position))`
   */

  /**
   * Only the last marker is a terminal marker which has its position and
   * the BPM for the rest of the track.
   */

  /**
   * The last byte of the body is the terminating byte. This seems to be
   * random and probably has some meaning but we don't need it.
   */

  return SeratoBeatgrid;
})();
return SeratoBeatgrid;
}));
