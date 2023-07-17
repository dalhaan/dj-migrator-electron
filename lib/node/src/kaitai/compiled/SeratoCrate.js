// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.SeratoCrate = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
var SeratoCrate = (function() {
  function SeratoCrate(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  SeratoCrate.prototype._read = function() {
    this.tags = [];
    var i = 0;
    while (!this._io.isEof()) {
      this.tags.push(new Tag(this._io, this, this._root));
      i++;
    }
  }

  var ColumnTag = SeratoCrate.ColumnTag = (function() {
    function ColumnTag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    ColumnTag.prototype._read = function() {
      this.tags = [];
      var i = 0;
      while (!this._io.isEof()) {
        this.tags.push(new Tag(this._io, this, this._root));
        i++;
      }
    }

    return ColumnTag;
  })();

  var Tag = SeratoCrate.Tag = (function() {
    function Tag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    Tag.prototype._read = function() {
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
        this.body = new FirstColumnTag(_io__raw_body, this, this._root);
        break;
      case "ovct":
        this._raw_body = this._io.readBytes(this.length);
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new ColumnTag(_io__raw_body, this, this._root);
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

    return Tag;
  })();

  var TrackTag = SeratoCrate.TrackTag = (function() {
    function TrackTag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    TrackTag.prototype._read = function() {
      this.tags = [];
      var i = 0;
      while (!this._io.isEof()) {
        this.tags.push(new Tag(this._io, this, this._root));
        i++;
      }
    }

    return TrackTag;
  })();

  var FilePathTag = SeratoCrate.FilePathTag = (function() {
    function FilePathTag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    FilePathTag.prototype._read = function() {
      this.filePath = KaitaiStream.bytesToStr(this._io.readBytesFull(), "ASCII");
    }

    return FilePathTag;
  })();

  var FirstColumnTag = SeratoCrate.FirstColumnTag = (function() {
    function FirstColumnTag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    FirstColumnTag.prototype._read = function() {
      this.tags = [];
      var i = 0;
      while (!this._io.isEof()) {
        this.tags.push(new Tag(this._io, this, this._root));
        i++;
      }
    }

    return FirstColumnTag;
  })();

  var VersionTag = SeratoCrate.VersionTag = (function() {
    function VersionTag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    VersionTag.prototype._read = function() {
      this.body = KaitaiStream.bytesToStr(this._io.readBytesFull(), "ASCII");
    }

    return VersionTag;
  })();

  var UnknownTag = SeratoCrate.UnknownTag = (function() {
    function UnknownTag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    UnknownTag.prototype._read = function() {
      this.body = this._io.readBytesFull();
    }

    return UnknownTag;
  })();

  var ColumnNameTag = SeratoCrate.ColumnNameTag = (function() {
    function ColumnNameTag(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    ColumnNameTag.prototype._read = function() {
      this.name = KaitaiStream.bytesToStr(this._io.readBytesFull(), "ASCII");
    }

    return ColumnNameTag;
  })();

  return SeratoCrate;
})();
return SeratoCrate;
}));
