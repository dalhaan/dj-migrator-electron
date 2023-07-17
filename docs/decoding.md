# Decoding Serato Data

There are a few key pieces of Serato data we need to reverse engineer: crates, the tracks in each crate, their order and track specific data including cue points and beat grids.

Serato uses proprietary binary file formats for storing data, which we have had to reverse engineer in order to decode them. I reversed engineered the crate file format myself but need to give thanks to [Holzhaus](https://github.com/Holzhaus) for reverse engineering the track data, whose repo I stumbled upon which summarises the binary structures in detail.

I use [Kaitai Struct](https://kaitai.io/) for decoding and parsing these binary structures. Kaitai Struct allows you to define and parse binary structures using YAML. They also have a great browser IDE called [Kaitai Web IDE](https://ide.kaitai.io/), check them out!

## Crates

Serato stores crate information under the `_Serato_/Subcrates` directory in `.crate` binary files using a proprietary format. Each `.crate` file represents an individual crate and they include version information, crate columns and the filepaths for each track in the crate.

[Decoding Serato Crates](decoding-serato-crates.md)

## Track data

Big thanks to [Holzhaus](https://github.com/Holzhaus) for doing most of the leg work when decoding Serato's track data. [Link to Holzhaus's repo](https://github.com/Holzhaus/serato-tags).

Serato stores all of their track specific data (cue points, beat grids, waveform, etc) as binary data within audio files' metadata. For MP3 and WAV files, these are stored as GEOB ID3 tags. For FLAC files, these are stored as VORBIS tags.

Serato stores its data in seven different tags:

- Serato Analysis: Serato version information
- Serato Autotags: BPM and gain values
- [Serato BeatGrid: Beat grid markers](decoding-serato-beatgrid-tag.md)
- [Serato Markers2: Hot cues, loops, etc](decoding-serato-markers2-tag.md)
- Serato Markers\_: Hot cues, loops, etc
- Serato Offsets\_
- Serato Overview: Waveform data

The only tags that we need are the [Serato Markers2](decoding-serato-markers2-tag.md) and [Serato BeatGrid](decoding-serato-beatgrid-tag.md) tags, for converting the hot cues and beat grids.

[Decoding Serato Markers2 Tag](decoding-serato-markers2-tag.md)

[Decoding Serato BeatGrid Tag](decoding-serato-beatgrid-tag.md)
