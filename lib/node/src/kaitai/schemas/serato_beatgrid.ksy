meta:
  id: serato_beatgrid

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
        type: u4be
  non_terminal_marker:
    seq:
      - id: position
        type: f4be
      - id: beats_until_next_marker
        type: u4be
  terminal_marker:
    seq:
      - id: position
        type: f4be
      - id: bpm
        type: f4be
        