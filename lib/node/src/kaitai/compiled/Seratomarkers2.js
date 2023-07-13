// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.SeratoMarkers2 = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
var SeratoMarkers2 = (function() {
  function SeratoMarkers2(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  SeratoMarkers2.prototype._read = function() {
    this.header = new Header(this._io, this, this._root);
    this.tags = [];
    var i = 0;
    do {
      var _ = new Tag(this._io, this, this._root);
      this.tags.push(_);
      i++;
    } while (!( (((this._io.size - this._io.pos) == 0) || (_.lookAhead == 0)) ));
  }

  /**
   * The color tag describes the tracks color in Serato.
   * The color is a three byte i8 array: [r,g,b].
   */

  var ColorTag = SeratoMarkers2.ColorTag = (function() {
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

  var Tag = SeratoMarkers2.Tag = (function() {
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

    /**
     * This instance looks ahead by one byte to find the
     * terminating null byte which indicates the end of
     * the markers. This is a hack because Kaitai doesn't
     * currently support repeating a sequence until a
     * terminating byte or ByteArray is encountered like
     * strz.
     */
    Object.defineProperty(Tag.prototype, 'lookAhead', {
      get: function() {
        if (this._m_lookAhead !== undefined)
          return this._m_lookAhead;
        if ((this._io.size - this._io.pos) > 0) {
          var _pos = this._io.pos;
          this._io.seek(this._io.pos);
          this._m_lookAhead = this._io.readU1();
          this._io.seek(_pos);
        }
        return this._m_lookAhead;
      }
    });

    /**
     * The type is a null-terminated string which indicates
     * what type of marker it is and its structure.
     * The type can be "COLOR", "CUE", "BPMLOCK", and others.
     */

    /**
     * The length of the marker's body.
     */

    /**
     * The body contains the markers data. The structure is
     * different depending on the marker type.
     */

    return Tag;
  })();

  var Header = SeratoMarkers2.Header = (function() {
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

  var UnknownTag = SeratoMarkers2.UnknownTag = (function() {
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

  /**
   * The bpmlock tag describes whether the beatgrid is locked.
   * The `is_locked` value is a boolean.
   */

  var BpmLockTag = SeratoMarkers2.BpmLockTag = (function() {
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

  /**
   * The cue tag describes a cue point in Serato.
   * The cue tag contains its index, position (ms), color
   * (three byte i8 array: [r,g,b]), and name (null-terminated
   * ASCII string).
   */

  var CueTag = SeratoMarkers2.CueTag = (function() {
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
      this._unnamed5 = this._io.readBytes(2);
      this.name = KaitaiStream.bytesToStr(this._io.readBytesTerm(0, false, true, true), "ASCII");
    }

    return CueTag;
  })();

  /**
   * The header only contains a magic signature.
   */

  /**
   * The rest of the body contains the markers. The parsing
   * repeats until the end of the stream or a terminating null
   * byte is encountered.
   */

  return SeratoMarkers2;
})();
return SeratoMarkers2;
}));
