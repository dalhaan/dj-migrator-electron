import * as musicMetadata from "music-metadata";

export function getGeobTags(metadata: musicMetadata.IAudioMetadata) {
  const id3Version = Object.keys(metadata.native).find((tagType) =>
    tagType.startsWith("ID3v2")
  );

  if (!id3Version) throw new Error("No ID3v2 tags found");

  const geobTags = metadata.native[id3Version].filter(
    (tag) => tag.id === "GEOB"
  );

  return geobTags;
}

export function getSeratoTags(metadata: musicMetadata.IAudioMetadata) {
  const geobTags = getGeobTags(metadata);

  const seratoTags: Record<"SeratoBeatGrid" | "SeratoMarkers2", Buffer | null> =
    {
      SeratoBeatGrid: null,
      SeratoMarkers2: null,
    };

  for (const tag of geobTags) {
    const data = tag.value.data as Buffer;

    // Serato Markers2
    if (data.toString().startsWith("erato Markers2")) {
      seratoTags.SeratoMarkers2 = data;
    }
    // Serato BeatGrid
    else if (data.toString().startsWith("erato BeatGrid")) {
      seratoTags.SeratoBeatGrid = data;
    }
  }

  return seratoTags;
}

export function decodeSeratoMarkers2Tag(data: Buffer) {
  const bodyBase64 = data.subarray(data.indexOf(0x00) + 1); // First NULL byte (0x00) marks end of the GEOB header

  const body = Buffer.from(bodyBase64.toString(), "base64");

  return body;
}

export function decodeSeratoBeatGridTag(data: Buffer) {
  const body = data.subarray(data.indexOf(0x00) + 1); // First NULL byte (0x00) marks end of the GEOB header

  return body;
}
