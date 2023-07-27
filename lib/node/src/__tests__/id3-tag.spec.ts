import { UnknownFrame } from "../unknown-frame";
import { ID3Tag } from "../id3-tag";
import { getSynch, toSynch } from "../utils";
import { GeobFrame } from "../geob-frame";

// ID3 segments with o padding
const headerNoPadding = [
  0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x02, 0x05,
];
const headerNoPaddingFooter = [
  0x49, 0x44, 0x33, 0x03, 0x00, 0x10, 0x00, 0x00, 0x02, 0x05,
];
const footerNoPadding = [
  0x33, 0x49, 0x44, 0x03, 0x00, 0x10, 0x00, 0x00, 0x02, 0x05,
];

const tit2Frame = [
  0x54, 0x49, 0x54, 0x32, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x44, 0x72,
  0x65, 0x61, 0x6d, 0x65, 0x72,
];
const tpe1Frame = [
  0x54, 0x50, 0x45, 0x31, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x44, 0x65,
  0x61, 0x64, 0x6c, 0x69, 0x6e, 0x65,
];
const talbFrame = [
  0x54, 0x41, 0x4c, 0x42, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x44, 0x72,
  0x65, 0x61, 0x6d, 0x65, 0x72,
];
const tconFrame = [
  0x54, 0x43, 0x4f, 0x4e, 0x00, 0x00, 0x00, 0x0f, 0x00, 0x00, 0x00, 0x45, 0x6c,
  0x65, 0x63, 0x74, 0x72, 0x6f, 0x2f, 0x44, 0x61, 0x6e, 0x63, 0x65, 0x00,
];
const tpubFrame = [
  0x54, 0x50, 0x55, 0x42, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x44, 0x65,
  0x61, 0x64, 0x6c, 0x69, 0x6e, 0x65,
];
const tyerFrame = [
  0x54, 0x59, 0x45, 0x52, 0x00, 0x00, 0x00, 0x05, 0x00, 0x00, 0x00, 0x32, 0x30,
  0x32, 0x30,
];
const tkeyFrame = [
  0x54, 0x4b, 0x45, 0x59, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x45, 0x62,
  0x6d,
];
const txxxFrame = [
  0x54, 0x58, 0x58, 0x58, 0x00, 0x00, 0x00, 0x15, 0x00, 0x00, 0x00, 0x53, 0x45,
  0x52, 0x41, 0x54, 0x4f, 0x5f, 0x50, 0x4c, 0x41, 0x59, 0x43, 0x4f, 0x55, 0x4e,
  0x54, 0x00, 0x31, 0x33, 0x00,
];
const rvadFrame = [
  0x52, 0x56, 0x41, 0x44, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x10, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];
const tbpmFrame = [
  0x54, 0x42, 0x50, 0x4d, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x31, 0x37,
  0x34,
];
const geobSeratoBeatGridFrame = [
  0x47, 0x45, 0x4f, 0x42, 0x00, 0x00, 0x00, 0x3a, 0x00, 0x00, 0x00, 0x61, 0x70,
  0x70, 0x6c, 0x69, 0x63, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x6f, 0x63, 0x74,
  0x65, 0x74, 0x2d, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x00, 0x00, 0x53, 0x65,
  0x72, 0x61, 0x74, 0x6f, 0x20, 0x42, 0x65, 0x61, 0x74, 0x47, 0x72, 0x69, 0x64,
  0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x01, 0x3d, 0x3c, 0x3e, 0x82, 0x43, 0x2e,
  0x00, 0x00, 0x00,
];

// ID3 segments with padding
const headerPadding = [
  0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x02, 0x25,
];
const headerPaddingFooter = [
  0x49, 0x44, 0x33, 0x03, 0x00, 0x10, 0x00, 0x00, 0x02, 0x25,
];
const footerPadding = [
  0x33, 0x49, 0x44, 0x03, 0x00, 0x10, 0x00, 0x00, 0x02, 0x25,
];

const id3v23NoPaddingBuffer = Buffer.from([
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
  // GEOB Serato BeatGrid frame
  ...geobSeratoBeatGridFrame,
]);

const id3v23NoPaddingFooterBuffer = Buffer.from([
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
  // GEOB Serato BeatGrid frame
  ...geobSeratoBeatGridFrame,
  ...footerNoPadding,
]);

const id3v23PaddingBuffer = Buffer.from([
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
  // Padding (32B)
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
]);

const id3v23PaddingFooterBuffer = Buffer.from([
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
  // Padding (32B)
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  ...footerPadding,
]);

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
  expect(id3Tag.flags.value).toEqual(0);
  expect(id3Tag.flags.experimentalIndicator).toEqual(false);
  expect(id3Tag.flags.hasExtendedHeader).toEqual(false);
  expect(id3Tag.flags.hasFooter).toEqual(false);
  expect(id3Tag.flags.unsynchronisation).toEqual(false);
  expect(id3Tag.paddingSize).toEqual(0);

  // Frames
  testFrames(id3Tag);
});

test("ID3v2.3 - no padding & footer - parses", () => {
  const id3Tag = new ID3Tag(id3v23NoPaddingFooterBuffer);
  // Header
  expect(id3Tag.id3TagSize).toEqual(281);
  expect(id3Tag.version.minor).toEqual(3);
  expect(id3Tag.version.patch).toEqual(0);
  expect(id3Tag.size).toEqual(261);
  expect(id3Tag.flags.value).toEqual(0b00010000);
  expect(id3Tag.flags.experimentalIndicator).toEqual(false);
  expect(id3Tag.flags.hasExtendedHeader).toEqual(false);
  expect(id3Tag.flags.hasFooter).toEqual(true);
  expect(id3Tag.flags.unsynchronisation).toEqual(false);
  expect(id3Tag.paddingSize).toEqual(0);

  // Frames
  testFrames(id3Tag);
});

test("ID3v2.3 - padding - parses", () => {
  const id3Tag = new ID3Tag(id3v23PaddingBuffer);
  // Header
  expect(id3Tag.id3TagSize).toEqual(303);
  expect(id3Tag.version.minor).toEqual(3);
  expect(id3Tag.version.patch).toEqual(0);
  expect(id3Tag.size).toEqual(293);
  expect(id3Tag.flags.value).toEqual(0);
  expect(id3Tag.flags.experimentalIndicator).toEqual(false);
  expect(id3Tag.flags.hasExtendedHeader).toEqual(false);
  expect(id3Tag.flags.hasFooter).toEqual(false);
  expect(id3Tag.flags.unsynchronisation).toEqual(false);
  expect(id3Tag.paddingSize).toEqual(32);

  // Frames
  testFrames(id3Tag);
});

test("ID3v2.3 - padding & footer - parses", () => {
  const id3Tag = new ID3Tag(id3v23PaddingFooterBuffer);
  // Header
  expect(id3Tag.id3TagSize).toEqual(313);
  expect(id3Tag.version.minor).toEqual(3);
  expect(id3Tag.version.patch).toEqual(0);
  expect(id3Tag.size).toEqual(293);
  expect(id3Tag.flags.value).toEqual(0b00010000);
  expect(id3Tag.flags.experimentalIndicator).toEqual(false);
  expect(id3Tag.flags.hasExtendedHeader).toEqual(false);
  expect(id3Tag.flags.hasFooter).toEqual(true);
  expect(id3Tag.flags.unsynchronisation).toEqual(false);
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

test("ID3v2.3 - padding - replacing GEOB frame", () => {
  const id3Tag = new ID3Tag(id3v23PaddingBuffer);

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
      ...expectedGeobFrameBuffer,
      // Padding (41B)
      ...expectedPadding,
    ])
  );
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

function testFrames(id3Tag: ID3Tag) {
  // Frames
  expect(id3Tag.frames.length).toEqual(11);

  // TIT2
  const tit2Frame = id3Tag.frames.find(
    (frame) => frame.type === "TIT2"
  ) as UnknownFrame;
  expect(tit2Frame?.frameOffset).toEqual(10);
  expect(tit2Frame?.size).toEqual(8);
  expect(tit2Frame?.flags).toEqual(0);
  expect(tit2Frame?.body).toEqual(
    Buffer.from([0x00, 0x44, 0x72, 0x65, 0x61, 0x6d, 0x65, 0x72])
  );

  // TPE1
  const tpe1Frame = id3Tag.frames.find(
    (frame) => frame.type === "TPE1"
  ) as UnknownFrame;
  expect(tpe1Frame?.frameOffset).toEqual(28);
  expect(tpe1Frame?.size).toEqual(9);
  expect(tpe1Frame?.flags).toEqual(0);
  expect(tpe1Frame?.body).toEqual(
    Buffer.from([0x00, 0x44, 0x65, 0x61, 0x64, 0x6c, 0x69, 0x6e, 0x65])
  );

  // TALB
  const talbFrame = id3Tag.frames.find(
    (frame) => frame.type === "TALB"
  ) as UnknownFrame;
  expect(talbFrame?.frameOffset).toEqual(47);
  expect(talbFrame?.size).toEqual(8);
  expect(talbFrame?.flags).toEqual(0);
  expect(talbFrame?.body).toEqual(
    Buffer.from([0x00, 0x44, 0x72, 0x65, 0x61, 0x6d, 0x65, 0x72])
  );

  // TCON
  const tconFrame = id3Tag.frames.find(
    (frame) => frame.type === "TCON"
  ) as UnknownFrame;
  expect(tconFrame?.frameOffset).toEqual(65);
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
  expect(tpubFrame?.frameOffset).toEqual(90);
  expect(tpubFrame?.size).toEqual(9);
  expect(tpubFrame?.flags).toEqual(0);
  expect(tpubFrame?.body).toEqual(
    Buffer.from([0x00, 0x44, 0x65, 0x61, 0x64, 0x6c, 0x69, 0x6e, 0x65])
  );

  // TYER
  const tyerFrame = id3Tag.frames.find(
    (frame) => frame.type === "TYER"
  ) as UnknownFrame;
  expect(tyerFrame?.frameOffset).toEqual(109);
  expect(tyerFrame?.size).toEqual(5);
  expect(tyerFrame?.flags).toEqual(0);
  expect(tyerFrame?.body).toEqual(Buffer.from([0x00, 0x32, 0x30, 0x32, 0x30]));

  // TKEY
  const tkeyFrame = id3Tag.frames.find(
    (frame) => frame.type === "TKEY"
  ) as UnknownFrame;
  expect(tkeyFrame?.frameOffset).toEqual(124);
  expect(tkeyFrame?.size).toEqual(4);
  expect(tkeyFrame?.flags).toEqual(0);
  expect(tkeyFrame?.body).toEqual(Buffer.from([0x00, 0x45, 0x62, 0x6d]));

  // TXXX
  const txxxFrame = id3Tag.frames.find(
    (frame) => frame.type === "TXXX"
  ) as UnknownFrame;
  expect(txxxFrame?.frameOffset).toEqual(138);
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
  expect(rvadFrame?.frameOffset).toEqual(169);
  expect(rvadFrame?.size).toEqual(10);
  expect(rvadFrame?.flags).toEqual(0);
  expect(rvadFrame?.body).toEqual(
    Buffer.from([0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
  );

  // TBPM
  const tbpmFrame = id3Tag.frames.find(
    (frame) => frame.type === "TBPM"
  ) as UnknownFrame;
  expect(tbpmFrame?.frameOffset).toEqual(189);
  expect(tbpmFrame?.size).toEqual(4);
  expect(tbpmFrame?.flags).toEqual(0);
  expect(tbpmFrame?.body).toEqual(Buffer.from([0x00, 0x31, 0x37, 0x34]));

  // GEOB - Serato BeatGrid
  const geobSeratoBeatGridFrame = id3Tag.frames.find(
    (frame): frame is GeobFrame =>
      frame.type === "GEOB" &&
      (frame as GeobFrame).description === "Serato BeatGrid"
  );
  expect(geobSeratoBeatGridFrame?.frameOffset).toEqual(203);
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
