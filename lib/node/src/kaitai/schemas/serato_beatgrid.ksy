meta:
  id: serato_beatgrid
  encoding: ASCII
  endian: be

seq:
  - id: header
    type: header
    doc: |
      The header of the Serato BeatGrid ID3 tag contains a magic signature
      and the number of beatgrid markers.
  - id: non_terminal_markers
    type: non_terminal_marker
    repeat: expr
    repeat-expr: header.no_markers - 1
    if: header.no_markers > 0
    doc: |
      Every marker except the last marker is a non-terminal marker which
      only has its position and the number of beats until the next marker.
      The BPM of this section is calculated from the number of beats until
      the next marker multiplied by the time until the next marker:
      `beats_until_next_marker * (60 / (next_marker_position - position))`
  - id: terminal_marker
    type: terminal_marker
    if: header.no_markers > 0
    doc: |
      Only the last marker is a terminal marker which has its position and
      the BPM for the rest of the track.
  - id: footer
    size: 1
    doc: |
      The last byte of the body is the terminating byte. This seems to be
      random and probably has some meaning but we don't need it.

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
