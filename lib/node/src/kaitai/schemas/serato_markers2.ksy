meta:
  id: serato_markers2
  encoding: ASCII
  endian: be

seq:
  - id: header
    type: header
    doc: |
      The header only contains a magic signature.
  - id: tags
    type: tag
    repeat: until
    repeat-until: _io.size - _io.pos == 0 or _.look_ahead == 0
    doc: |
      The rest of the body contains the markers. The parsing
      repeats until the end of the stream or a terminating null
      byte is encountered.

types:
  header:
    seq:
      - id: magic
        contents: [0x01, 0x01]
  tag:
    seq:
      - id: type
        type: strz
        doc: |
          The type is a null-terminated string which indicates
          what type of marker it is and its structure.
          The type can be "COLOR", "CUE", "BPMLOCK", and others.
      - id: len
        type: u4
        doc: |
          The length of the marker's body.
      - id: body
        size: len
        type:
          switch-on: type
          cases:
            '"COLOR"': color_tag
            '"CUE"': cue_tag
            '"BPMLOCK"': bpm_lock_tag
            _: unknown_tag
        doc: |
          The body contains the markers data. The structure is
          different depending on the marker type.
    instances:
      look_ahead:
        pos: _io.pos
        type: u1
        if: _io.size - _io.pos > 0
        doc: |
          This instance looks ahead by one byte to find the
          terminating null byte which indicates the end of
          the markers. This is a hack because Kaitai doesn't
          currently support repeating a sequence until a
          terminating byte or ByteArray is encountered like
          strz.
  color_tag:
    seq:
      - size: 1
      - id: color
        type: color
    doc: |
      The color tag describes the tracks color in Serato.
      The color is a three byte i8 array: [r,g,b].
  cue_tag:
    seq:
      - size: 1
      - id: index
        type: u1
      - id: position
        type: u4
      - size: 1
      - id: color
        type: color
      - size: 2
      - id: name
        type: strz
    doc: |
      The cue tag describes a cue point in Serato.
      The cue tag contains its index, position (ms), color
      (three byte i8 array: [r,g,b]), and name (null-terminated
      ASCII string).
  bpm_lock_tag:
    seq:
      - id: is_locked
        type: u1
    doc: |
      The bpmlock tag describes whether the beatgrid is locked.
      The `is_locked` value is a boolean.
  unknown_tag: {}
  color:
    seq:
      - id: red
        type: u1
      - id: green
        type: u1
      - id: blue
        type: u1
    doc: |
      Colors are represented as a three-byte i8 array of [r, g, b]
