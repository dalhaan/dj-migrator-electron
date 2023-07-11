// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.Seratomarkers2 = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
var Seratomarkers2 = (function() {
  function Seratomarkers2(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  Seratomarkers2.prototype._read = function() {
    this.header = new Header(this._io, this, this._root);
    this.tags = [];
    var i = 0;
    do {
      var _ = new Tag(this._io, this, this._root);
      this.tags.push(_);
      i++;
    } while (!(_.type == "BPMLOCK"));
    this.terminator = this._io.readBytes(1);
  }

  var ColorTag = Seratomarkers2.ColorTag = (function() {
    function ColorTag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    ColorTag.prototype._read = function() {
      this._unnamed0 = this._io.readBytes(1);
      this.color = this._io.readBytes(3);
    }

    return ColorTag;
  })();

  var Tag = Seratomarkers2.Tag = (function() {
    function Tag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    Tag.prototype._read = function() {
      this.type = KaitaiStream.bytesToStr(this._io.readBytesTerm(0, false, true, true), "ASCII");
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

    return Tag;
  })();

  var Header = Seratomarkers2.Header = (function() {
    function Header(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    Header.prototype._read = function() {
      this.magic = this._io.readBytes(2);
      if (!((KaitaiStream.byteArrayCompare(this.magic, [1, 1]) == 0))) {
        throw new KaitaiStream.ValidationNotEqualError([1, 1], this.magic, this._io, "/types/header/seq/0");
      }
    }

    return Header;
  })();

  var UnknownTag = Seratomarkers2.UnknownTag = (function() {
    function UnknownTag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    UnknownTag.prototype._read = function() {
    }

    return UnknownTag;
  })();

  var BpmLockTag = Seratomarkers2.BpmLockTag = (function() {
    function BpmLockTag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    BpmLockTag.prototype._read = function() {
      this.isLocked = this._io.readU1();
    }

    return BpmLockTag;
  })();

  var CueTag = Seratomarkers2.CueTag = (function() {
    function CueTag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    CueTag.prototype._read = function() {
      this._unnamed0 = this._io.readBytes(1);
      this.index = this._io.readU1();
      this.position = this._io.readU4be();
      this._unnamed3 = this._io.readBytes(1);
      this.color = this._io.readBytes(3);
    }

    return CueTag;
  })();

  return Seratomarkers2;
})();
return Seratomarkers2;
}));
