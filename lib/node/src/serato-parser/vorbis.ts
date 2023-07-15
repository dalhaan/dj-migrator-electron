import * as musicMetadata from "music-metadata";

export function getSeratoTags(metadata: musicMetadata.IAudioMetadata) {
  const seratoTags: Record<"SeratoBeatGrid" | "SeratoMarkers2", string | null> =
    {
      SeratoBeatGrid: null,
      SeratoMarkers2: null,
    };

  if (!("vorbis" in metadata.native)) throw new Error("No Vorbis tags found");

  for (const tag of metadata.native.vorbis) {
    // Serato Markers2
    if (tag.id === "SERATO_MARKERS_V2") {
      seratoTags.SeratoMarkers2 = tag.value;
    }
  }

  return seratoTags;
}

/**
 * In FLAC Vorbis comments, marker data is stored as a base64 encoded string. Once decoded, the
 * header 'application/octet-stream\00\00Serato Markers2\00' is stripped from the decoded data
 *
 * Process:
 *   [base64 encoded data (with newline characters)]
 *                |
 *                \/    1. strip newline characters
 *      [base64 encoded data]
 *                |
 *                \/    2. decode base64
 *   'application/octet-stream\00\00Serato Markers2\00[base64 encoded marker data (with newline characters)]'
 *                |
 *                \/    3. strip header
 *          [base64 encoded marker data (with newline characters)]
 *                |
 *                \/    4. strip newline characters again
 *          [base64 encoded marker data]
 *                |
 *                \/    5. decode base64
 *          [marker data]
 */
export function decodeSeratoMarkers2Tag(data: string) {
  // Decode the base64 string
  const base64Decoded = Buffer.from(data, "base64");

  // Strip header 'application/octet-stream\00\00Serato Markers2\00' revealing the final base64 string
  const headerStripped = base64Decoded.subarray(42).toString();

  // Decode the remaining base64 string to get the actual marker data
  const base64DecodedAgain = Buffer.from(headerStripped, "base64");

  return base64DecodedAgain;
}
