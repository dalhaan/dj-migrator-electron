# Decoding Serato Crates

**Example Serato `.crate` file with one track:**

```
Hex View  00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F

00000000  76 72 73 6E 00 00 00 38  00 31 00 2E 00 30 00 2F  vrsn...8.1...0./
00000010  00 53 00 65 00 72 00 61  00 74 00 6F 00 20 00 53  .S.e.r.a.t.o. .S
00000020  00 63 00 72 00 61 00 74  00 63 00 68 00 4C 00 69  .c.r.a.t.c.h.L.i
00000030  00 76 00 65 00 20 00 43  00 72 00 61 00 74 00 65  .v.e. .C.r.a.t.e
00000040  6F 73 72 74 00 00 00 19  74 76 63 6E 00 00 00 08  osrt....tvcn....
00000050  00 73 00 6F 00 6E 00 67  62 72 65 76 00 00 00 01  .s.o.n.gbrev....
00000060  00 6F 76 63 74 00 00 00  1E 74 76 63 6E 00 00 00  .ovct....tvcn...
00000070  08 00 73 00 6F 00 6E 00  67 74 76 63 77 00 00 00  ..s.o.n.gtvcw...
00000080  06 00 35 00 35 00 31 6F  76 63 74 00 00 00 24 74  ..5.5.1ovct...$t
00000090  76 63 6E 00 00 00 12 00  70 00 6C 00 61 00 79 00  vcn.....p.l.a.y.
000000A0  43 00 6F 00 75 00 6E 00  74 74 76 63 77 00 00 00  C.o.u.n.ttvcw...
000000B0  02 00 30 6F 76 63 74 00  00 00 18 74 76 63 6E 00  ..0ovct....tvcn.
000000C0  00 00 06 00 62 00 70 00  6D 74 76 63 77 00 00 00  ....b.p.mtvcw...
000000D0  02 00 30 6F 76 63 74 00  00 00 1E 74 76 63 6E 00  ..0ovct....tvcn.
000000E0  00 00 0C 00 6C 00 65 00  6E 00 67 00 74 00 68 74  ....l.e.n.g.t.ht
000000F0  76 63 77 00 00 00 02 00  30 6F 76 63 74 00 00 00  vcw.....0ovct...
00000100  1E 74 76 63 6E 00 00 00  0C 00 61 00 72 00 74 00  .tvcn.....a.r.t.
00000110  69 00 73 00 74 74 76 63  77 00 00 00 02 00 30 6F  i.s.ttvcw.....0o
00000120  76 63 74 00 00 00 1C 74  76 63 6E 00 00 00 0A 00  vct....tvcn.....
00000130  61 00 6C 00 62 00 75 00  6D 74 76 63 77 00 00 00  a.l.b.u.mtvcw...
00000140  02 00 30 6F 76 63 74 00  00 00 20 74 76 63 6E 00  ..0ovct... tvcn.
00000150  00 00 0E 00 63 00 6F 00  6D 00 6D 00 65 00 6E 00  ....c.o.m.m.e.n.
00000160  74 74 76 63 77 00 00 00  02 00 30 6F 74 72 6B 00  ttvcw.....0otrk.
00000170  00 00 78 70 74 72 6B 00  00 00 70 00 6D 00 75 00  ..xptrk...p.m.u.
00000180  73 00 69 00 63 00 2F 00  44 00 6E 00 42 00 20 00  s.i.c./.D.n.B. .
00000190  54 00 6F 00 20 00 47 00  65 00 74 00 20 00 57 00  T.o. .G.e.t. .W.
000001A0  65 00 69 00 72 00 64 00  20 00 54 00 6F 00 20 00  e.i.r.d. .T.o. .
000001B0  49 00 49 00 2F 00 41 00  6C 00 69 00 78 00 20 00  I.I./.A.l.i.x. .
000001C0  50 00 65 00 72 00 65 00  7A 00 20 00 2D 00 20 00  P.e.r.e.z. .-. .
000001D0  47 00 6F 00 6F 00 64 00  20 00 54 00 6F 00 20 00  G.o.o.d. .T.o. .
000001E0  4D 00 65 00 2E 00 6D 00  70 00 33 6F              M.e...m.p.3
```

> `.crate` files tend of have many duplicate column names after the track list, which may be the result of a bug within Serato itself, but these have been omitted from the example.

## Binary sequence breakdown

**`Tag` (repeats until the end of the file):**

| Field       | Type                                                                                                                              | Example                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Type        | `ASCII string (4 chars)`                                                                                                          | "vrsn" \| "osrt" \| "ovct" \| "tvcn" \| "otrk" \| "ptrk" |
| Body length | `u32be`                                                                                                                           |                                                          |
| Body        | `Version tag` \| `First column tag` \| `Column tag` \| `Column name tag` \| `Track tag` \| `File path tag` (determined by `Type`) |                                                          |

**`vrsn` - Version tag:**

| Field   | Type             | Conditions                        |
| ------- | ---------------- | --------------------------------- |
| Version | `UTF-16BE chars` | Repeats until the end of the body |

**`osrt` - First column tag:**

| Field | Type  | Conditions                        |
| ----- | ----- | --------------------------------- |
| Tags  | `Tag` | Repeats until the end of the body |

**`ovct` - Column tag:**

| Field | Type  | Conditions                        |
| ----- | ----- | --------------------------------- |
| Tags  | `Tag` | Repeats until the end of the body |

**`tvcn` - Column name tag:**

| Field | Type             | Conditions                        |
| ----- | ---------------- | --------------------------------- |
| Name  | `UTF-16BE chars` | Repeats until the end of the body |

**`otrk` - Track tag:**

| Field | Type  | Conditions                        |
| ----- | ----- | --------------------------------- |
| Tags  | `Tag` | Repeats until the end of the body |

**`ptrk` - File path tag:**

| Field     | Type             | Conditions                        |
| --------- | ---------------- | --------------------------------- |
| File path | `UTF-16BE chars` | Repeats until the end of the body |

## Parsed example (partial)

| Bits                                                                                                                                                                                                                                                                                                                                              | Field       | Parsed                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------- |
| `6F 74 72 6B`                                                                                                                                                                                                                                                                                                                                     | Type        | otrk                                                     |
| `00 00 00 78`                                                                                                                                                                                                                                                                                                                                     | Body length | 120                                                      |
| `70 74 72 6B`                                                                                                                                                                                                                                                                                                                                     | Type        | ptrk                                                     |
| `00 00 00 70`                                                                                                                                                                                                                                                                                                                                     | Body length | 112                                                      |
| `00 6D 00 75 00 73 00 69 00 63 00 2F 00 44 00 6E 00 42 00 20 00 54 00 6F 00 20 00 47 00 65 00 74 00 20 00 57 00 65 00 69 00 72 00 64 00 20 00 54 00 6F 00 20 00 49 00 49 00 2F 00 41 00 6C 00 69 00 78 00 20 00 50 00 65 00 72 00 65 00 7A 00 20 00 2D 00 20 00 47 00 6F 00 6F 00 64 00 20 00 54 00 6F 00 20 00 4D 00 65 00 2E 00 6D 00 70 00 33` | File path   | music/DnB To Get Weird To II/Alix Perez - Good To Me.mp3 |

## Kaitai struct schema

[lib/node/src/kaitai/schemas/serato_crate.ksy](../lib/node/src/kaitai/schemas/serato_crate.ksy)

```yaml
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
            '"osrt"': first_column_tag
            '"tvcn"': column_name_tag
            '"ovct"': column_tag
            '"otrk"': track_tag
            '"ptrk"': file_path_tag
            _: unknown_tag

  version_tag:
    seq:
      - id: body
        type: str
        size-eos: true
  first_column_tag:
    seq:
      - id: tags
        type: tag
        repeat: eos
  column_name_tag:
    seq:
      - id: name
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
  unknown_tag:
    seq:
      - id: body
        size-eos: true
```
