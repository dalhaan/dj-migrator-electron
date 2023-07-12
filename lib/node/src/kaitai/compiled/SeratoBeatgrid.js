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
    this.magic = this._io.readBytes(2);
    if (!((KaitaiStream.byteArrayCompare(this.magic, [1, 0]) == 0))) {
      throw new KaitaiStream.ValidationNotEqualError([1, 0], this.magic, this._io, "/seq/0");
    }
    this.noMarkers = this._io.readU4be();
    this.position = this._io.readF4be();
    this.bpm = this._io.readF4be();
    this.footer = this._io.readBytes(1);
  }

  return SeratoBeatgrid;
})();
return SeratoBeatgrid;
}));
