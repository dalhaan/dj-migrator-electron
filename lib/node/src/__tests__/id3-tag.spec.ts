import { UnknownFrame } from "../unknown-frame";
import { ID3Tag } from "../id3-tag";
import { getSynch, toSynch } from "../utils";
import { GeobFrame } from "../geob-frame";
import {
  extendedHeader,
  footerNoPadding,
  footerPadding,
  geobSeratoBeatGridFrame,
  headerNoPadding,
  headerNoPaddingExtHeader,
  headerNoPaddingFooter,
  headerPadding,
  headerPaddingFooter,
  id3v23NoPaddingBuffer,
  id3v23NoPaddingExtHeaderBuffer,
  id3v23NoPaddingFooterBuffer,
  id3v23PaddingBuffer,
  id3v23PaddingFooterBuffer,
  rvadFrame,
  talbFrame,
  tbpmFrame,
  tconFrame,
  tit2Frame,
  tkeyFrame,
  tpe1Frame,
  tpubFrame,
  txxxFrame,
  tyerFrame,
} from "./fixtures/id3-2-3.fixture";

console.log(getSynch(0x21d));
console.log(toSynch(285 + 8).toString(16));

test("USyncSafeInt32BE -> UInt32BE", () => {
  const syncSafeInt = 410667;
  const parsed = getSynch(syncSafeInt);
  expect(parsed).toEqual(107051);
});

test("UInt32BE -> USyncSafeInt32BE", () => {
  const int = 107051;
  const syncSafeInt = toSynch(int);
  expect(syncSafeInt).toEqual(410667);
});

test("ID3v2.3 - no padding - parses", () => {
  const id3Tag = new ID3Tag(id3v23NoPaddingBuffer);
  // Header
  expect(id3Tag.id3TagSize).toEqual(271);
  expect(id3Tag.version.minor).toEqual(3);
  expect(id3Tag.version.patch).toEqual(0);
  expect(id3Tag.size).toEqual(261);
  expect(id3Tag.flags).toEqual(0);
  expect(id3Tag.flagExperimentalIndicator).toEqual(false);
  expect(id3Tag.flagHasExtendedHeader).toEqual(false);
  expect(id3Tag.flagHasFooter).toEqual(false);
  expect(id3Tag.flagUnsynchronisation).toEqual(false);
  expect(id3Tag.paddingSize).toEqual(0);

  // Frames
  testFrames(id3Tag);
});

test("ID3v2.3 - no padding - removing frame", () => {
  const id3Tag = new ID3Tag(id3v23NoPaddingBuffer);

  id3Tag.removeFrame<GeobFrame>(
    (frame) => frame.description === "Serato BeatGrid"
  );

  const { buffer, needToCreateNewBuffer } = id3Tag.writeFrames();

  const reparsed = new ID3Tag(buffer);

  const expectedPadding = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ];

  expect(needToCreateNewBuffer).toEqual(false);
  expect(reparsed.size).toEqual(id3Tag.size);
  expect(reparsed.id3TagSize).toEqual(id3Tag.id3TagSize);
  expect(buffer).toEqual(
    Buffer.from([
      // Header
      ...headerNoPadding,
      // TIT2 frame
      ...tit2Frame,
      // TPE1 frame
      ...tpe1Frame,
      // TALB frame
      ...talbFrame,
      // TCON frame
      ...tconFrame,
      // TPUB frame
      ...tpubFrame,
      // TYER frame
      ...tyerFrame,
      // TKEY frame
      ...tkeyFrame,
      // TXXX frame
      ...txxxFrame,
      // RVAD frame
      ...rvadFrame,
      // TBPM frame
      ...tbpmFrame,
      // Padding
      ...expectedPadding,
    ])
  );
});

test("ID3v2.3 - no padding - adding text frame w/ padding", () => {
  const id3Tag = new ID3Tag(id3v23NoPaddingBuffer);

  const newTit2Frame = new UnknownFrame(
    "NEWW",
    0,
    Buffer.from([0x00, 0x44, 0x72, 0x65, 0x61, 0x6d])
  );
  id3Tag.addFrame(newTit2Frame);

  const { buffer, needToCreateNewBuffer } = id3Tag.writeFrames(8);

  const reparsed = new ID3Tag(buffer);

  const expectedHeader = [
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x02, 0x1d,
  ];

  const expectedNewwFrame = [
    0x4e, 0x45, 0x57, 0x57, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x44,
    0x72, 0x65, 0x61, 0x6d,
  ];

  const expectedPadding = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

  // Header
  expect(needToCreateNewBuffer).toEqual(true);
  expect(buffer.length).toEqual(reparsed.id3TagSize);
  expect(reparsed.size).toEqual(285);
  expect(reparsed.paddingSize).toEqual(8);
  expect(buffer).toEqual(
    Buffer.from([
      // Header
      ...expectedHeader,
      // TIT2 frame
      ...tit2Frame,
      // TPE1 frame
      ...tpe1Frame,
      // TALB frame
      ...talbFrame,
      // TCON frame
      ...tconFrame,
      // TPUB frame
      ...tpubFrame,
      // TYER frame
      ...tyerFrame,
      // TKEY frame
      ...tkeyFrame,
      // TXXX frame
      ...txxxFrame,
      // RVAD frame
      ...rvadFrame,
      // TBPM frame
      ...tbpmFrame,
      // GEOB Serato BeatGrid frame
      ...geobSeratoBeatGridFrame,
      ...expectedNewwFrame,
      // Padding (34B)
      ...expectedPadding,
    ])
  );
});

test("ID3v2.3 - no padding & ext header - parses", () => {
  const id3Tag = new ID3Tag(id3v23NoPaddingExtHeaderBuffer);
  console.log(id3Tag);
  // Header
  expect(id3Tag.id3TagSize).toEqual(279);
  expect(id3Tag.version.minor).toEqual(3);
  expect(id3Tag.version.patch).toEqual(0);
  expect(id3Tag.size).toEqual(269);
  expect(id3Tag.flags).toEqual(0b01000000);
  expect(id3Tag.flagExperimentalIndicator).toEqual(false);
  expect(id3Tag.flagHasExtendedHeader).toEqual(true);
  expect(id3Tag.flagHasFooter).toEqual(false);
  expect(id3Tag.flagUnsynchronisation).toEqual(false);
  expect(id3Tag.paddingSize).toEqual(0);
  expect(id3Tag.extendedHeader?.size).toEqual(8);
  expect(id3Tag.extendedHeader?.body).toEqual(
    Buffer.from([
      // Num flag bytes
      0x01,
      // Extended flags (0bcd0000)
      0b00010000,
      // Tag restrictions
      // Flag data length
      0x01,
      // Restrictions (ppqrrstt)
      0b00001000,
    ])
  );

  // Frames
  testFrames(id3Tag, 8);
});

test("ID3v2.3 - no padding & ext header - removing frame", () => {
  const id3Tag = new ID3Tag(id3v23NoPaddingExtHeaderBuffer);

  id3Tag.removeFrame<GeobFrame>(
    (frame) => frame.description === "Serato BeatGrid"
  );

  const { buffer, needToCreateNewBuffer } = id3Tag.writeFrames();

  const reparsed = new ID3Tag(buffer);

  const expectedPadding = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ];

  expect(needToCreateNewBuffer).toEqual(false);
  expect(reparsed.flagHasExtendedHeader).toEqual(true);
  expect(reparsed.size).toEqual(id3Tag.size);
  expect(reparsed.id3TagSize).toEqual(id3Tag.id3TagSize);
  expect(reparsed.extendedHeader?.size).toEqual(8);
  expect(reparsed.extendedHeader?.body).toEqual(
    Buffer.from([
      // Num flag bytes
      0x01,
      // Extended flags (0bcd0000)
      0b00010000,
      // Tag restrictions
      // Flag data length
      0x01,
      // Restrictions (ppqrrstt)
      0b00001000,
    ])
  );
  expect(buffer).toEqual(
    Buffer.from([
      // Header
      ...headerNoPaddingExtHeader,
      // Extended header
      ...extendedHeader,
      // TIT2 frame
      ...tit2Frame,
      // TPE1 frame
      ...tpe1Frame,
      // TALB frame
      ...talbFrame,
      // TCON frame
      ...tconFrame,
      // TPUB frame
      ...tpubFrame,
      // TYER frame
      ...tyerFrame,
      // TKEY frame
      ...tkeyFrame,
      // TXXX frame
      ...txxxFrame,
      // RVAD frame
      ...rvadFrame,
      // TBPM frame
      ...tbpmFrame,
      // Padding
      ...expectedPadding,
    ])
  );
});

test("ID3v2.3 - no padding & ext header - adding text frame w/ padding", () => {
  const id3Tag = new ID3Tag(id3v23NoPaddingExtHeaderBuffer);

  const newTit2Frame = new UnknownFrame(
    "NEWW",
    0,
    Buffer.from([0x00, 0x44, 0x72, 0x65, 0x61, 0x6d])
  );
  id3Tag.addFrame(newTit2Frame);

  const { buffer, needToCreateNewBuffer } = id3Tag.writeFrames(8);

  const reparsed = new ID3Tag(buffer);

  const expectedHeader = [
    // "ID3"
    0x49, 0x44, 0x33,
    // Version
    0x03, 0x00,
    // Flags
    0b01000000,
    // Size
    0x00, 0x00, 0x02, 0x25,
  ];

  const expectedNewwFrame = [
    0x4e, 0x45, 0x57, 0x57, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x44,
    0x72, 0x65, 0x61, 0x6d,
  ];

  const expectedPadding = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

  // Header
  expect(needToCreateNewBuffer).toEqual(true);
  expect(buffer.length).toEqual(reparsed.id3TagSize);
  expect(reparsed.size).toEqual(293);
  expect(reparsed.paddingSize).toEqual(8);
  expect(buffer).toEqual(
    Buffer.from([
      // Header
      ...expectedHeader,
      // Extended header
      ...extendedHeader,
      // TIT2 frame
      ...tit2Frame,
      // TPE1 frame
      ...tpe1Frame,
      // TALB frame
      ...talbFrame,
      // TCON frame
      ...tconFrame,
      // TPUB frame
      ...tpubFrame,
      // TYER frame
      ...tyerFrame,
      // TKEY frame
      ...tkeyFrame,
      // TXXX frame
      ...txxxFrame,
      // RVAD frame
      ...rvadFrame,
      // TBPM frame
      ...tbpmFrame,
      // GEOB Serato BeatGrid frame
      ...geobSeratoBeatGridFrame,
      ...expectedNewwFrame,
      // Padding (34B)
      ...expectedPadding,
    ])
  );
});

test("ID3v2.3 - no padding & footer - parses", () => {
  const id3Tag = new ID3Tag(id3v23NoPaddingFooterBuffer);
  // Header
  expect(id3Tag.id3TagSize).toEqual(281);
  expect(id3Tag.version.minor).toEqual(3);
  expect(id3Tag.version.patch).toEqual(0);
  expect(id3Tag.size).toEqual(261);
  expect(id3Tag.flags).toEqual(0b00010000);
  expect(id3Tag.flagExperimentalIndicator).toEqual(false);
  expect(id3Tag.flagHasExtendedHeader).toEqual(false);
  expect(id3Tag.flagHasFooter).toEqual(true);
  expect(id3Tag.flagUnsynchronisation).toEqual(false);
  expect(id3Tag.paddingSize).toEqual(0);

  // Frames
  testFrames(id3Tag);
});

test("ID3v2.3 - no padding & footer - removing frame", () => {
  const id3Tag = new ID3Tag(id3v23NoPaddingFooterBuffer);

  id3Tag.removeFrame<GeobFrame>(
    (frame) => frame.description === "Serato BeatGrid"
  );

  const { buffer, needToCreateNewBuffer } = id3Tag.writeFrames();

  const reparsed = new ID3Tag(buffer);

  const expectedPadding = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ];

  expect(needToCreateNewBuffer).toEqual(false);
  expect(reparsed.size).toEqual(id3Tag.size);
  expect(reparsed.id3TagSize).toEqual(id3Tag.id3TagSize);
  expect(buffer).toEqual(
    Buffer.from([
      // Header
      ...headerNoPaddingFooter,
      // TIT2 frame
      ...tit2Frame,
      // TPE1 frame
      ...tpe1Frame,
      // TALB frame
      ...talbFrame,
      // TCON frame
      ...tconFrame,
      // TPUB frame
      ...tpubFrame,
      // TYER frame
      ...tyerFrame,
      // TKEY frame
      ...tkeyFrame,
      // TXXX frame
      ...txxxFrame,
      // RVAD frame
      ...rvadFrame,
      // TBPM frame
      ...tbpmFrame,
      // Padding
      ...expectedPadding,
      ...footerNoPadding,
    ])
  );
});

test("ID3v2.3 - no padding & footer - adding text frame w/ padding", () => {
  const id3Tag = new ID3Tag(id3v23NoPaddingFooterBuffer);

  const newTit2Frame = new UnknownFrame(
    "NEWW",
    0,
    Buffer.from([0x00, 0x44, 0x72, 0x65, 0x61, 0x6d])
  );
  id3Tag.addFrame(newTit2Frame);

  const { buffer, needToCreateNewBuffer } = id3Tag.writeFrames(8);

  const reparsed = new ID3Tag(buffer);

  const expectedHeader = [
    0x49, 0x44, 0x33, 0x03, 0x00, 0x10, 0x00, 0x00, 0x02, 0x1d,
  ];

  const expectedNewwFrame = [
    0x4e, 0x45, 0x57, 0x57, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x44,
    0x72, 0x65, 0x61, 0x6d,
  ];

  const expectedPadding = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

  const expectedFooter = [
    0x33, 0x44, 0x49, 0x03, 0x00, 0x10, 0x00, 0x00, 0x02, 0x1d,
  ];

  // Header
  expect(needToCreateNewBuffer).toEqual(true);
  expect(buffer.length).toEqual(reparsed.id3TagSize);
  expect(reparsed.size).toEqual(285);
  expect(reparsed.paddingSize).toEqual(8);
  expect(buffer).toEqual(
    Buffer.from([
      // Header
      ...expectedHeader,
      // TIT2 frame
      ...tit2Frame,
      // TPE1 frame
      ...tpe1Frame,
      // TALB frame
      ...talbFrame,
      // TCON frame
      ...tconFrame,
      // TPUB frame
      ...tpubFrame,
      // TYER frame
      ...tyerFrame,
      // TKEY frame
      ...tkeyFrame,
      // TXXX frame
      ...txxxFrame,
      // RVAD frame
      ...rvadFrame,
      // TBPM frame
      ...tbpmFrame,
      // GEOB Serato BeatGrid frame
      ...geobSeratoBeatGridFrame,
      ...expectedNewwFrame,
      // Padding (34B)
      ...expectedPadding,
      ...expectedFooter,
    ])
  );
});

test("ID3v2.3 - padding - parses", () => {
  const id3Tag = new ID3Tag(id3v23PaddingBuffer);
  // Header
  expect(id3Tag.id3TagSize).toEqual(303);
  expect(id3Tag.version.minor).toEqual(3);
  expect(id3Tag.version.patch).toEqual(0);
  expect(id3Tag.size).toEqual(293);
  expect(id3Tag.flags).toEqual(0);
  expect(id3Tag.flagExperimentalIndicator).toEqual(false);
  expect(id3Tag.flagHasExtendedHeader).toEqual(false);
  expect(id3Tag.flagHasFooter).toEqual(false);
  expect(id3Tag.flagUnsynchronisation).toEqual(false);
  expect(id3Tag.paddingSize).toEqual(32);

  // Frames
  testFrames(id3Tag);
});

test("ID3v2.3 - padding - replacing text frame", () => {
  const id3Tag = new ID3Tag(id3v23PaddingBuffer);

  const newTit2Frame = new UnknownFrame(
    "TIT2",
    0,
    Buffer.from([0x00, 0x44, 0x72, 0x65, 0x61, 0x6d])
  );
  id3Tag.addFrame(newTit2Frame);

  const { buffer, needToCreateNewBuffer } = id3Tag.writeFrames(0);

  const expectedTit2Frame = [
    0x54, 0x49, 0x54, 0x32, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x44,
    0x72, 0x65, 0x61, 0x6d,
  ];

  const expectedPadding = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ];

  // Header
  expect(needToCreateNewBuffer).toEqual(false);
  expect(buffer).toEqual(
    Buffer.from([
      // Header
      ...headerPadding,
      // TIT2 frame
      ...expectedTit2Frame,
      // TPE1 frame
      ...tpe1Frame,
      // TALB frame
      ...talbFrame,
      // TCON frame
      ...tconFrame,
      // TPUB frame
      ...tpubFrame,
      // TYER frame
      ...tyerFrame,
      // TKEY frame
      ...tkeyFrame,
      // TXXX frame
      ...txxxFrame,
      // RVAD frame
      ...rvadFrame,
      // TBPM frame
      ...tbpmFrame,
      // GEOB Serato BeatGrid frame
      ...geobSeratoBeatGridFrame,
      // Padding (34B)
      ...expectedPadding,
    ])
  );
});

test("ID3v2.3 - padding - adding text frame w/ padding", () => {
  const id3Tag = new ID3Tag(id3v23PaddingBuffer);

  const newTit2Frame = new UnknownFrame(
    "NEWW",
    0,
    Buffer.from([0x00, 0x44, 0x72, 0x65, 0x61, 0x6d])
  );
  id3Tag.addFrame(newTit2Frame);

  const { buffer, needToCreateNewBuffer } = id3Tag.writeFrames(8);

  const reparsed = new ID3Tag(buffer);

  const expectedNewwFrame = [
    0x4e, 0x45, 0x57, 0x57, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x44,
    0x72, 0x65, 0x61, 0x6d,
  ];

  const expectedPadding = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ];

  // Header
  expect(needToCreateNewBuffer).toEqual(false);
  expect(buffer.length).toEqual(reparsed.id3TagSize);
  expect(reparsed.size).toEqual(293);
  expect(reparsed.paddingSize).toEqual(16);
  expect(buffer).toEqual(
    Buffer.from([
      // Header
      ...headerPadding,
      // TIT2 frame
      ...tit2Frame,
      // TPE1 frame
      ...tpe1Frame,
      // TALB frame
      ...talbFrame,
      // TCON frame
      ...tconFrame,
      // TPUB frame
      ...tpubFrame,
      // TYER frame
      ...tyerFrame,
      // TKEY frame
      ...tkeyFrame,
      // TXXX frame
      ...txxxFrame,
      // RVAD frame
      ...rvadFrame,
      // TBPM frame
      ...tbpmFrame,
      // GEOB Serato BeatGrid frame
      ...geobSeratoBeatGridFrame,
      ...expectedNewwFrame,
      // Padding (34B)
      ...expectedPadding,
    ])
  );
});

test("ID3v2.3 - padding & footer - parses", () => {
  const id3Tag = new ID3Tag(id3v23PaddingFooterBuffer);
  // Header
  expect(id3Tag.id3TagSize).toEqual(313);
  expect(id3Tag.version.minor).toEqual(3);
  expect(id3Tag.version.patch).toEqual(0);
  expect(id3Tag.size).toEqual(293);
  expect(id3Tag.flags).toEqual(0b00010000);
  expect(id3Tag.flagExperimentalIndicator).toEqual(false);
  expect(id3Tag.flagHasExtendedHeader).toEqual(false);
  expect(id3Tag.flagHasFooter).toEqual(true);
  expect(id3Tag.flagUnsynchronisation).toEqual(false);
  expect(id3Tag.paddingSize).toEqual(32);

  // Frames
  testFrames(id3Tag);
});

test("ID3v2.3 - padding & footer - replacing text frame", () => {
  const id3Tag = new ID3Tag(id3v23PaddingFooterBuffer);

  const newTit2Frame = new UnknownFrame(
    "TIT2",
    0,
    Buffer.from([0x00, 0x44, 0x72, 0x65, 0x61, 0x6d])
  );
  id3Tag.addFrame(newTit2Frame);

  const { buffer, needToCreateNewBuffer } = id3Tag.writeFrames(0);

  const expectedTit2Frame = [
    0x54, 0x49, 0x54, 0x32, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x44,
    0x72, 0x65, 0x61, 0x6d,
  ];

  const expectedPadding = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ];

  // Header
  expect(needToCreateNewBuffer).toEqual(false);
  expect(buffer).toEqual(
    Buffer.from([
      // Header
      ...headerPaddingFooter,
      // TIT2 frame
      ...expectedTit2Frame,
      // TPE1 frame
      ...tpe1Frame,
      // TALB frame
      ...talbFrame,
      // TCON frame
      ...tconFrame,
      // TPUB frame
      ...tpubFrame,
      // TYER frame
      ...tyerFrame,
      // TKEY frame
      ...tkeyFrame,
      // TXXX frame
      ...txxxFrame,
      // RVAD frame
      ...rvadFrame,
      // TBPM frame
      ...tbpmFrame,
      // GEOB Serato BeatGrid frame
      ...geobSeratoBeatGridFrame,
      // Padding (34B)
      ...expectedPadding,
      ...footerPadding,
    ])
  );
});

test("ID3v2.3 - padding & footer - replacing GEOB frame", () => {
  const id3Tag = new ID3Tag(id3v23PaddingFooterBuffer);

  const newSeratoBeatGridFrame = new GeobFrame(
    0,
    0,
    "application/octet-stream",
    "",
    "Serato BeatGrid",
    Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
  );
  id3Tag.addFrame(newSeratoBeatGridFrame);

  const { buffer, needToCreateNewBuffer } = id3Tag.writeFrames(0);

  const expectedGeobFrameBuffer = [
    0x47, 0x45, 0x4f, 0x42, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x61,
    0x70, 0x70, 0x6c, 0x69, 0x63, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x6f,
    0x63, 0x74, 0x65, 0x74, 0x2d, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x00,
    0x00, 0x53, 0x65, 0x72, 0x61, 0x74, 0x6f, 0x20, 0x42, 0x65, 0x61, 0x74,
    0x47, 0x72, 0x69, 0x64, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
  ];

  const expectedPadding = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00,
  ];

  // Header
  expect(needToCreateNewBuffer).toEqual(false);
  expect(buffer).toEqual(
    Buffer.from([
      // Header
      ...headerPaddingFooter,
      // TIT2 frame
      ...tit2Frame,
      // TPE1 frame
      ...tpe1Frame,
      // TALB frame
      ...talbFrame,
      // TCON frame
      ...tconFrame,
      // TPUB frame
      ...tpubFrame,
      // TYER frame
      ...tyerFrame,
      // TKEY frame
      ...tkeyFrame,
      // TXXX frame
      ...txxxFrame,
      // RVAD frame
      ...rvadFrame,
      // TBPM frame
      ...tbpmFrame,
      // GEOB Serato BeatGrid frame
      ...expectedGeobFrameBuffer,
      // Padding (41B)
      ...expectedPadding,
      ...footerPadding,
    ])
  );
});

test("ID3v2.3 - padding & footer - adding text frame w/ padding", () => {
  const id3Tag = new ID3Tag(id3v23PaddingFooterBuffer);

  const newTit2Frame = new UnknownFrame(
    "NEWW",
    0,
    Buffer.from([0x00, 0x44, 0x72, 0x65, 0x61, 0x6d])
  );
  id3Tag.addFrame(newTit2Frame);

  const { buffer, needToCreateNewBuffer } = id3Tag.writeFrames(8);

  const reparsed = new ID3Tag(buffer);

  const expectedNewwFrame = [
    0x4e, 0x45, 0x57, 0x57, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x44,
    0x72, 0x65, 0x61, 0x6d,
  ];

  const expectedPadding = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ];

  // Header
  expect(needToCreateNewBuffer).toEqual(false);
  expect(buffer.length).toEqual(reparsed.id3TagSize);
  expect(reparsed.size).toEqual(293);
  expect(reparsed.paddingSize).toEqual(16);
  expect(buffer).toEqual(
    Buffer.from([
      // Header
      ...headerPaddingFooter,
      // TIT2 frame
      ...tit2Frame,
      // TPE1 frame
      ...tpe1Frame,
      // TALB frame
      ...talbFrame,
      // TCON frame
      ...tconFrame,
      // TPUB frame
      ...tpubFrame,
      // TYER frame
      ...tyerFrame,
      // TKEY frame
      ...tkeyFrame,
      // TXXX frame
      ...txxxFrame,
      // RVAD frame
      ...rvadFrame,
      // TBPM frame
      ...tbpmFrame,
      // GEOB Serato BeatGrid frame
      ...geobSeratoBeatGridFrame,
      ...expectedNewwFrame,
      // Padding (34B)
      ...expectedPadding,
      ...footerPadding,
    ])
  );
});

function testFrames(id3Tag: ID3Tag, offset = 0) {
  // Frames
  expect(id3Tag.frames.length).toEqual(11);

  // TIT2
  const tit2Frame = id3Tag.frames.find(
    (frame) => frame.type === "TIT2"
  ) as UnknownFrame;
  expect(tit2Frame?.frameOffset).toEqual(10 + offset);
  expect(tit2Frame?.size).toEqual(8);
  expect(tit2Frame?.flags).toEqual(0);
  expect(tit2Frame?.body).toEqual(
    Buffer.from([0x00, 0x44, 0x72, 0x65, 0x61, 0x6d, 0x65, 0x72])
  );

  // TPE1
  const tpe1Frame = id3Tag.frames.find(
    (frame) => frame.type === "TPE1"
  ) as UnknownFrame;
  expect(tpe1Frame?.frameOffset).toEqual(28 + offset);
  expect(tpe1Frame?.size).toEqual(9);
  expect(tpe1Frame?.flags).toEqual(0);
  expect(tpe1Frame?.body).toEqual(
    Buffer.from([0x00, 0x44, 0x65, 0x61, 0x64, 0x6c, 0x69, 0x6e, 0x65])
  );

  // TALB
  const talbFrame = id3Tag.frames.find(
    (frame) => frame.type === "TALB"
  ) as UnknownFrame;
  expect(talbFrame?.frameOffset).toEqual(47 + offset);
  expect(talbFrame?.size).toEqual(8);
  expect(talbFrame?.flags).toEqual(0);
  expect(talbFrame?.body).toEqual(
    Buffer.from([0x00, 0x44, 0x72, 0x65, 0x61, 0x6d, 0x65, 0x72])
  );

  // TCON
  const tconFrame = id3Tag.frames.find(
    (frame) => frame.type === "TCON"
  ) as UnknownFrame;
  expect(tconFrame?.frameOffset).toEqual(65 + offset);
  expect(tconFrame?.size).toEqual(15);
  expect(tconFrame?.flags).toEqual(0);
  expect(tconFrame?.body).toEqual(
    Buffer.from([
      0x00, 0x45, 0x6c, 0x65, 0x63, 0x74, 0x72, 0x6f, 0x2f, 0x44, 0x61, 0x6e,
      0x63, 0x65, 0x00,
    ])
  );

  // TPUB
  const tpubFrame = id3Tag.frames.find(
    (frame) => frame.type === "TPUB"
  ) as UnknownFrame;
  expect(tpubFrame?.frameOffset).toEqual(90 + offset);
  expect(tpubFrame?.size).toEqual(9);
  expect(tpubFrame?.flags).toEqual(0);
  expect(tpubFrame?.body).toEqual(
    Buffer.from([0x00, 0x44, 0x65, 0x61, 0x64, 0x6c, 0x69, 0x6e, 0x65])
  );

  // TYER
  const tyerFrame = id3Tag.frames.find(
    (frame) => frame.type === "TYER"
  ) as UnknownFrame;
  expect(tyerFrame?.frameOffset).toEqual(109 + offset);
  expect(tyerFrame?.size).toEqual(5);
  expect(tyerFrame?.flags).toEqual(0);
  expect(tyerFrame?.body).toEqual(Buffer.from([0x00, 0x32, 0x30, 0x32, 0x30]));

  // TKEY
  const tkeyFrame = id3Tag.frames.find(
    (frame) => frame.type === "TKEY"
  ) as UnknownFrame;
  expect(tkeyFrame?.frameOffset).toEqual(124 + offset);
  expect(tkeyFrame?.size).toEqual(4);
  expect(tkeyFrame?.flags).toEqual(0);
  expect(tkeyFrame?.body).toEqual(Buffer.from([0x00, 0x45, 0x62, 0x6d]));

  // TXXX
  const txxxFrame = id3Tag.frames.find(
    (frame) => frame.type === "TXXX"
  ) as UnknownFrame;
  expect(txxxFrame?.frameOffset).toEqual(138 + offset);
  expect(txxxFrame?.size).toEqual(21);
  expect(txxxFrame?.flags).toEqual(0);
  expect(txxxFrame?.body).toEqual(
    Buffer.from([
      0x00, 0x53, 0x45, 0x52, 0x41, 0x54, 0x4f, 0x5f, 0x50, 0x4c, 0x41, 0x59,
      0x43, 0x4f, 0x55, 0x4e, 0x54, 0x00, 0x31, 0x33, 0x00,
    ])
  );

  // RVAD
  const rvadFrame = id3Tag.frames.find(
    (frame) => frame.type === "RVAD"
  ) as UnknownFrame;
  expect(rvadFrame?.frameOffset).toEqual(169 + offset);
  expect(rvadFrame?.size).toEqual(10);
  expect(rvadFrame?.flags).toEqual(0);
  expect(rvadFrame?.body).toEqual(
    Buffer.from([0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
  );

  // TBPM
  const tbpmFrame = id3Tag.frames.find(
    (frame) => frame.type === "TBPM"
  ) as UnknownFrame;
  expect(tbpmFrame?.frameOffset).toEqual(189 + offset);
  expect(tbpmFrame?.size).toEqual(4);
  expect(tbpmFrame?.flags).toEqual(0);
  expect(tbpmFrame?.body).toEqual(Buffer.from([0x00, 0x31, 0x37, 0x34]));

  // GEOB - Serato BeatGrid
  const geobSeratoBeatGridFrame = id3Tag.frames.find(
    (frame): frame is GeobFrame =>
      frame.type === "GEOB" &&
      (frame as GeobFrame).description === "Serato BeatGrid"
  );
  expect(geobSeratoBeatGridFrame?.frameOffset).toEqual(203 + offset);
  expect(geobSeratoBeatGridFrame?.size).toEqual(58);
  expect(geobSeratoBeatGridFrame?.flags).toEqual(0);
  expect(geobSeratoBeatGridFrame?.textEncoding).toEqual(0);
  expect(geobSeratoBeatGridFrame?.mimeType).toEqual("application/octet-stream");
  expect(geobSeratoBeatGridFrame?.fileName).toEqual("");
  expect(geobSeratoBeatGridFrame?.body).toEqual(
    Buffer.from([
      0x01, 0x00, 0x00, 0x00, 0x00, 0x01, 0x3d, 0x3c, 0x3e, 0x82, 0x43, 0x2e,
      0x00, 0x00, 0x00,
    ])
  );
}
