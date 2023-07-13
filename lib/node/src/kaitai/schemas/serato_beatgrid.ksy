meta:
  id: serato_beatgrid
  encoding: ASCII
  endian: be

seq:
  - id: header
    type: header
  - id: non_terminal_markers
    type: non_terminal_marker
    repeat: expr
    repeat-expr: header.no_markers - 1
  - id: terminal_marker
    type: terminal_marker
  - id: footer
    size: 1

types:
  header:
    seq:
      - id: magic
        contents: [0x01, 0x00]
      - id: no_markers
        type: u4
  non_terminal_marker:
    seq:
      - id: position
        type: f4
      - id: beats_until_next_marker
        type: u4
  terminal_marker:
    seq:
      - id: position
        type: f4
      - id: bpm
        type: f4
