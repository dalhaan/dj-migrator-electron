# Decoding Serato Tags

Big thanks to [Holzhaus](https://github.com/Holzhaus) for doing most of the leg work when decoding Serato's data. [Link to Holzhaus's repo](https://github.com/Holzhaus/serato-tags).

Serato stores all of their track specific data (cue points, beat grids, waveform, etc) as binary data within the audio files metadata. For MP3 and WAV files, these are stored as GEOB ID3 tags. For FLAC files, these are stored as VORBIS tags.

We use [Kaitai Struct](https://kaitai.io/) for decoding these tags. Kaitai Struct allows you to define and parse binary structures using YAML.

Serato stores its data in seven different tags:

- Serato Analysis: Serato version information
- Serato Autotags: BPM and gain values
- [Serato BeatGrid: Beat grid markers](serato-beatgrid-tag.md)
- [Serato Markers2: Hot cues, loops, etc](serato-markers2-tag.md)
- Serato Markers\_: Hot cues, loops, etc
- Serato Offsets\_
- Serato Overview: Waveform data

The only tags that we need are the [Serato Markers2](serato-markers2-tag.md) and [Serato BeatGrid](serato-beatgrid-tag.md) tags, for converting the hot cues and beat grids.

## Decoding documentation

- [Serato Markers2](serato-markers2-tag.md)
- [Serato BeatGrid](serato-beatgrid-tag.md)
