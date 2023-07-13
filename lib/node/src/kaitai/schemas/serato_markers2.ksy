meta:
  id: serato_markers2
  encoding: ASCII
  endian: be

seq:
  - id: header
    type: header
  - id: tags
    type: tag
    repeat: until
    repeat-until: _io.size - _io.pos == 0 or _.look_ahead == 0

types:
  header:
    seq:
      - id: magic
        contents: [0x01, 0x01]
  tag:
    seq:
      - id: type
        type: strz
        encoding: ASCII
      - id: len
        type: u4
      - id: body
        size: len
        type:
          switch-on: type
          cases:
            '"COLOR"': color_tag
            '"CUE"': cue_tag
            '"BPMLOCK"': bpm_lock_tag
            _: unknown_tag
    instances:
      look_ahead:
        pos: _io.pos
        type: u1
        if: _io.size - _io.pos > 0
  color_tag:
    seq:
      - size: 1
      - id: color
        size: 3
  cue_tag:
    seq:
      - size: 1
      - id: index
        type: u1
      - id: position
        type: u4
      - size: 1
      - id: color
        size: 3
      - size: 2
      - id: name
        type: strz
  bpm_lock_tag:
    seq:
      - id: is_locked
        type: u1
  unknown_tag: {}
