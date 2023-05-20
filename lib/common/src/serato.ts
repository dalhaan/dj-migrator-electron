import { Track } from "./intermediary";

export class ColorEntry {
  static NAME = "COLOR";

  color: string;

  constructor(data: Buffer) {
    this.color = data.toString("hex", 1); // three byte hex colour
  }
}

export class CueEntry {
  static NAME = "CUE";

  index: number;
  position: number;
  color: string;

  constructor(data: Buffer) {
    this.index = data.readUIntBE(1, 1); // one byte integer
    this.position = data.readUInt32BE(2); // four byte integer
    this.color = data.toString("hex", 7, 10); // three byte hex colour
  }
}

export class BPMLockEntry {
  static NAME = "BPMLOCK";

  enabled: boolean;

  constructor(data: Buffer) {
    this.enabled = !!data.readUIntBE(0, 1); // one byte boolean
  }
}

export interface IPlaylist {
  name: string;
  tracks: string[];
}

export interface ITrackMap {
  [trackPath: string]: {
    key: number;
    absolutePath: string;
    track: Track; // TODO: replace with proper interface once it has been made
  };
}

export interface ILibraryData {
  playlists: IPlaylist[];
  trackMap: ITrackMap;
}

export interface IProgressCallback {
  (progress: number, message: string): void;
}

export interface IConvertFromSeratoParams {
  seratoDir: string;
  cratesToConvert: string[];
  progressCallback: IProgressCallback;
}
