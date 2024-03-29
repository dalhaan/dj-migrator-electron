export interface IMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string[];
  bpm?: number;
  key?: string;
  location: string;
  sampleRate?: number;
  bitrate?: number;
  comment?: string[];
  size?: number;
  duration?: number;
  fileExtension: string;
}

export class CuePoint {
  index: number;
  position: number;
  color: [red: number, green: number, blue: number] | undefined;
  name: string | undefined;

  constructor({
    index,
    position,
    color,
    name,
  }: {
    index: number;
    position: number;
    color?: [red: number, green: number, blue: number];
    name?: string;
  }) {
    this.index = index;
    this.position = position;
    this.color = color;
    this.name = name;
  }
}

export class BeatGrid {
  position: number;
  bpm: number;

  constructor({ position, bpm }: { position: number; bpm: number }) {
    this.position = position;
    this.bpm = bpm;
  }
}

export class Track {
  metadata: IMetadata;
  cuePoints: CuePoint[] = [];
  beatGrids: BeatGrid[] = [];

  constructor(
    metadata: IMetadata,
    cuePoints: CuePoint[],
    beatGrids?: BeatGrid[]
  ) {
    this.metadata = metadata;
    this.cuePoints = cuePoints;

    if (beatGrids) {
      this.beatGrids = beatGrids;
    }
  }
}

export type Playlist = {
  name: string;
  tracks: string[];
};
