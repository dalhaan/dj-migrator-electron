import { CuePoint } from "@dj-migrator/common";
import SeratoMarkers2 from "../kaitai/compiled/SeratoMarkers2-ES6";
const KaitaiStream = require("kaitai-struct/KaitaiStream");

export function parseSeratoMarkers2Tag(data: Buffer) {
  const parsed = new SeratoMarkers2(new KaitaiStream(data));

  const cuePoints: CuePoint[] = [];

  if (parsed.tags) {
    for (const tag of parsed.tags) {
      // CuePoint
      if (tag.body instanceof SeratoMarkers2.CueTag) {
        cuePoints.push(
          new CuePoint({
            index: tag.body.index,
            position: tag.body.position,
            color: [
              tag.body.color.red,
              tag.body.color.green,
              tag.body.color.blue,
            ],
            name: tag.body.name || undefined,
          })
        );
      }
    }
  }

  return cuePoints;
}
