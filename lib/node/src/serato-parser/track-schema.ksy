meta:
  id: seratotag
  file-extension: seratotag
seq:
  - id: header
    type: header
  - id: sections
    type: entry
    repeat: expr
    repeat-expr: 3
types:
  header:
    seq:
      - id: magic
        size: 2
  entry:
    seq:
      - id: type
        type: strz
        encoding: ASCII
      - id: len
        type: u4be
      - id: body
        size: len
        type:
          switch-on: type
          cases:
            '"COLOR"': color_tag
            '"CUE"': cue_tag
            _: unknown_tag

  color_tag:
    seq:
      - id: color
        size: 4
  cue_tag:
    seq:
      - id: index
        type: u1
      - id: position
        type: u4be
      - id: color
        size: 4,

  unknown_tag: {}
