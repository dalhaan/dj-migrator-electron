import SeratoCrate from "../kaitai/compiled/SeratoCrate-ES6";
const KaitaiStream = require("kaitai-struct/KaitaiStream");

export function parseSeratoCrate(data: Buffer) {
  const parsed = new SeratoCrate(new KaitaiStream(data));

  const trackFilePaths: string[] = [];

  for (const tag of parsed.tags) {
    if (tag.body instanceof SeratoCrate.TrackTag) {
      for (const trackTagTag of tag.body.tags) {
        if (trackTagTag.body instanceof SeratoCrate.FilePathTag) {
          trackFilePaths.push(trackTagTag.body.filePath);
        }
      }
    }
  }

  return trackFilePaths;
}
