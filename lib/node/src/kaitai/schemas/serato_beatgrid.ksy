meta:
  id: serato_beatgrid

seq:
  - id: magic
    contents: [0x01, 0x00]
  - id: no_markers
    type: u4be
  - id: position
    type: f4be
  - id: bpm
    type: f4be
  - id: footer
    size: 1