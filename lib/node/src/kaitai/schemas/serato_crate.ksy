meta:
  id: serato_crate
  encoding: UTF-16BE
  endian: be

seq:
  - id: tags
    type: tag
    repeat: eos

types:
  tag:
    seq:
      - id: type
        type: str
        encoding: ASCII
        size: 4
      - id: length
        type: u4
      - id: body
        size: length
        type:
          switch-on: type
          cases:
            '"vrsn"': version_tag
            '"osrt"': column_sort_tag
            '"tvcn"': column_name_tag
            '"tvcw"': column_width_tag
            '"ovct"': column_tag
            '"otrk"': track_tag
            '"ptrk"': file_path_tag
            '"brev"': column_sort_dir_tag
            _: unknown_tag

  version_tag:
    seq:
      - id: body
        type: str
        size-eos: true
  column_sort_tag:
    seq:
      - id: tags
        type: tag
        repeat: eos
  column_name_tag:
    seq:
      - id: name
        type: str
        size-eos: true
  column_width_tag:
    seq:
      - id: width
        type: str
        size-eos: true
  column_tag:
    seq:
      - id: tags
        type: tag
        repeat: eos
  track_tag:
    seq:
      - id: tags
        type: tag
        repeat: eos
  file_path_tag:
    seq:
      - id: file_path
        type: str
        size-eos: true
  column_sort_dir_tag:
    seq:
      - id: is_descending
        type: u1
  unknown_tag:
    seq:
      - id: body
        size-eos: true
