meta:
  id: seratomarkers2
  file-extension: seratotag
seq:
  - id: header
    type: header
  - id: tags
    type: tag
    repeat: until
    repeat-until: _.type == "BPMLOCK"
  - id: terminator
    size: 1
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
        type: u4be
      - id: body
        size: len
        type:
          switch-on: type
          cases:
            '"COLOR"': color_tag
            '"CUE"': cue_tag
            '"BPMLOCK"': bpm_lock_tag
            _: unknown_tag

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
        type: u4be
      - size: 1
      - id: color
        size: 3
  bpm_lock_tag:
    seq:
      - id: is_locked
        type: u1

  unknown_tag: {}
