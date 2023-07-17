# Serato BeatGrid Tag

https://github.com/Holzhaus/serato-tags/blob/master/docs/serato_beatgrid.md

**Example Serato BeatGrid tag with three markers:**

```
Hex View  00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F

00000000  01 00 00 00 00 03 3D 3C  3E 82 00 00 00 40 41 B0  ......=<>....@A.
00000010  E1 48 00 00 00 14 42 04  8F 39 43 2E 06 C8 00     .H....B..9C....
```

## Binary sequence breakdown

| Field                         | Type                                             | Conditions           |
| ----------------------------- | ------------------------------------------------ | -------------------- |
| Magic                         | `2 bytes`                                        |                      |
| Number of markers             | `u32be`                                          |                      |
| Non-terminal markers          | `[position: f32be, beatsUntilNextMarker: u32be]` | repeats noMarkers -1 |
| Terminal marker (last marker) | `[position: f32be, bpm: f32be]`                  |                      |
| Footer                        | `1 byte`                                         |                      |

## Parsed example

| Bits                      | Field                   | Parsed                                           |
| ------------------------- | ----------------------- | ------------------------------------------------ |
| `01 00`                   | Magic                   |                                                  |
| `00 00 00 03`             | Number of markers       | `3`                                              |
| `3D 3C 3E 82 00 00 00 40` | Marker 1 (non-terminal) | `[position: 0.045958, beatsUntilNextMarker: 64]` |
| `41 B0 E1 48 00 00 00 14` | Marker 2 (non-terminal) | `[position: 22.11, beatsUntilNextMarker: 20]`    |
| `42 04 8F 39 43 2E 06 C8` | Marker 3 (terminal)     | `[position: 33.1399, bpm: 174.026]`              |
| `00`                      | Footer                  |                                                  |

## Kaitai struct schema

[lib/node/src/kaitai/schemas/serato_beatgrid.ksy](../lib/node/src/kaitai/schemas/serato_beatgrid.ksy)

```yaml
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
```
