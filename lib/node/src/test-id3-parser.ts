import fs from "fs/promises";
import assert from "assert";
import {
  base64Encode,
  getSynch,
  readUint32SyncSafe,
  toSynch,
  writeUInt32SyncSafeBE,
} from "./utils";
import { GeobFrame } from "./geob-frame";
import { ID3Frame } from "./id3-frame";
import { SeratoMarkers2 } from "./serato-serializer/serialize-serato-markers2";
import { ID3Tag } from "./id3-tag";

function buildHeader(
  version: { minor: number; patch: number },
  flags: number,
  size: number,
  identifier: "ID3" | "3DI" = "ID3"
): Buffer {
  const buffer = Buffer.alloc(ID3Frame.HEADER_SIZE);

  let offset = 0;

  // Identifier ["ID3": ascii24]
  offset += buffer.write(identifier, offset, "ascii");

  // Version [minor: UInt8, patch: UInt8]
  offset = buffer.writeUInt8(version.minor, offset);
  offset = buffer.writeUInt8(version.patch, offset);

  // Flags [abcd0000: UInt8]
  offset = buffer.writeUInt8(flags, offset);

  // Size [UIntSyncSafe32BE]
  offset = writeUInt32SyncSafeBE(buffer, size, offset);

  return buffer;
}

function buildFooter(
  version: { minor: number; patch: number },
  flags: number,
  size: number
) {
  return buildHeader(version, flags, size, "3DI");
}

function writeSeratoFrames(
  frames: GeobFrame[],
  id3Tag: ID3Tag,
  paddingSize = 0
) {
  // Find existing frames that will be replaced
  // const geobFrameDescriptions = frames.map((frame) => frame.description);
  // const matchingFrames = id3Tag.GEOB.filter((frame) =>
  //   geobFrameDescriptions.includes(frame.description)
  // ).sort((frameA, frameB) => frameA.frameOffset! - frameB.frameOffset!);
  const matchingFrames: [oldFrame: GeobFrame, newFrame: GeobFrame][] = [];
  const newFrames: GeobFrame[] = [];

  // Calculate total sizes of new frames and matching frames
  const totalSizeOfNewFrames = frames.reduce(
    (totalSize, frame) => totalSize + frame.size + ID3Frame.HEADER_SIZE,
    0
  );
  const totalSizeOfMatchingFrames = matchingFrames.reduce(
    (totalSize, [oldFrame]) => totalSize + oldFrame.size + ID3Frame.HEADER_SIZE,
    0
  );
  const totalSizeOfFrames = totalSizeOfNewFrames - totalSizeOfMatchingFrames;

  const remainingPadding = id3Tag.paddingSize - totalSizeOfFrames;

  for (const frame of frames) {
    const matchingOldFrame = id3Tag.GEOB.find(
      (oldFrame) => oldFrame.description === frame.description
    );

    if (matchingOldFrame) {
      // Only match first instance (incase there are multiple frames with same description)
      if (
        !matchingFrames.some(
          (matchedFrame) =>
            matchedFrame[0] === matchingOldFrame || matchedFrame[1] === frame
        )
      ) {
        matchingFrames.push([matchingOldFrame, frame]);
      }
    } else {
      newFrames.push(frame);
    }
  }

  // Sort by matching old frame offset
  matchingFrames.sort(
    ([oldFrameA], [oldFrameB]) =>
      oldFrameA.frameOffset! - oldFrameB.frameOffset!
  );

  // --------------
  // Update ID3 tag
  // --------------

  // Split ID3 tag & replace existing frames
  const segments: Buffer[] = [];
  let offset = 0;

  for (const [oldFrame, newFrame] of matchingFrames) {
    const segment = id3Tag.buffer.subarray(offset, oldFrame.frameOffset!);

    segments.push(segment, newFrame.serialize(id3Tag.version.minor));

    offset = oldFrame.frameOffset! + ID3Frame.HEADER_SIZE + 2 + oldFrame.size;
  }

  // Add remaining old farmes
  segments.push(id3Tag.buffer.subarray(offset));

  // Append new frames
  for (const frame of newFrames) {
    segments.push(frame.serialize(id3Tag.version.minor));
  }

  let newId3TagBuffer: Buffer | undefined;

  // There is enough padding to fit new frames
  if (remainingPadding >= 0) {
    const segmentsBuffer = Buffer.concat(segments);

    newId3TagBuffer = Buffer.alloc(id3Tag.id3TagSize);

    segmentsBuffer.copy(newId3TagBuffer);

    // Append footer
    if (id3Tag.flags.hasFooter) {
      const footer = buildFooter(
        id3Tag.version,
        id3Tag.flags.value,
        id3Tag.size
      );
      footer.copy(newId3TagBuffer, 10 + id3Tag.size);
    }

    // TODO: Write new ID3 tag to MP3 file buffer
  }
  // Not enough room, need to create new buffer for MP3 file.
  else {
    // Add padding
    const padding = Buffer.alloc(paddingSize);
    segments.push(padding);

    // Calculate new ID3 tag size
    let segmentsBuffer = Buffer.concat(segments);
    const newSize = segmentsBuffer.byteLength - 10;

    // Append footer
    if (id3Tag.flags.hasFooter) {
      segments.push(buildFooter(id3Tag.version, id3Tag.flags.value, newSize));
    }

    segmentsBuffer = Buffer.concat(segments);

    newId3TagBuffer = segmentsBuffer;

    // Update ID3 tag size
    writeUInt32SyncSafeBE(newId3TagBuffer, newSize, 6);
    // newId3TagBuffer.writeUInt32BE(toSynch(segmentsBuffer.byteLength - 10), 6);

    // TODO: Write new ID3 tag to MP3 file buffer
  }

  console.log("new frames:", frames);
  console.log("matching frames:", matchingFrames);
  console.log("total size of new frames:", totalSizeOfNewFrames);
  console.log("total size of matching frames:", totalSizeOfMatchingFrames);
  console.log("remaining padding:", remainingPadding);

  return {
    buffer: newId3TagBuffer,
    needToCreateNewBuffer: remainingPadding < 0,
  };
}

async function main() {
  // START
  const file = await fs.readFile(
    "/Users/dallanfreemantle/Desktop/Deadline - Dreamer.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Justin Hawkes - Lift off the Roof.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/New DnB 5/Molecular - Skank.mp3"
    // "/Users/dallanfreemantle/Desktop/Serato USB Latest/music/DUBZ/Mefjus & Emperor vs Jam Thieves - Flashizm vs Criminal Thugs (Emperor Edit).mp3"
  );

  const id3Tag = new ID3Tag(file);
  console.log(id3Tag);

  const markers = new SeratoMarkers2();
  markers
    .addColorTag([255, 255, 255])
    .addCueTag(1, 1000, [204, 0, 0], "Cue 1")
    .addCueTag(2, 2000, [0, 204, 0], "Cue 2")
    .addCueTag(3, 3000, [0, 0, 204], "Cue 3")
    .addBpmLockTag(false);

  const updatedSeratoMarkers2 = new GeobFrame(
    0,
    "application/octet-stream",
    "",
    "Serato Markers2",
    base64Encode(markers.serialize())
  );

  const updatedID3Tag = writeSeratoFrames([updatedSeratoMarkers2], id3Tag, 0);

  if (!updatedID3Tag.needToCreateNewBuffer) {
    updatedID3Tag.buffer.copy(file);

    await fs.writeFile("/Users/dallanfreemantle/Desktop/new-audio.mp3", file);
  } else {
    // Create new buffer
    const buffer = Buffer.alloc(
      file.length - id3Tag.id3TagSize + updatedID3Tag.buffer.length
    );

    // Copy updated ID3 tag to start of new buffer
    updatedID3Tag.buffer.copy(buffer);

    // Append original MP3 file audio data to new buffer
    file.subarray(id3Tag.id3TagSize).copy(buffer, updatedID3Tag.buffer.length);

    await fs.writeFile("/Users/dallanfreemantle/Desktop/new-audio.mp3", buffer);
  }
  console.log(updatedID3Tag);
  // END

  // await fs.writeFile(
  //   "/Users/dallanfreemantle/Desktop/updated-id3.octet-stream",
  //   updatedID3Tag.buffer
  // );
  // const serialized = exampleBeatGrid.serialize(4);
  // const reparsed = GeobFrame.parse(serialized, 4);
  // console.log("example", exampleBeatGrid);
  // console.log("serialized", serialized);
  // console.log("reparsed", reparsed);

  // console.log(toSynch(203 + 68));

  // console.log(toSynch(203));
  // console.log(getSynch(7725));
  // console.log("old:", getSynch(410667));
  // console.log("new:", getSynch(410925));
  console.log("old:", getSynch(410667)); // 107051
  console.log("new:", toSynch(106680)); // 409912
}

main();
