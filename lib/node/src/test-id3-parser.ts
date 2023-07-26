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
import { UnknownFrame } from "./unknown-frame";

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
    0,
    "application/octet-stream",
    "",
    "Serato Markers2",
    base64Encode(markers.serialize())
  );

  const exampleTitleFrame = new UnknownFrame(
    "TIT2",
    0,
    Buffer.from([0x00, 0x54, 0x72, 0x65, 0x61])
  );

  const updatedID3Tag = id3Tag.writeSeratoFrames(
    [updatedSeratoMarkers2, exampleTitleFrame],
    0
  );

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
