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
  color: string | undefined;
  name: string | undefined;

  constructor({
    index,
    position,
    color,
    name,
  }: {
    index: number;
    position: number;
    color?: string;
    name?: string;
  }) {
    this.index = index;
    this.position = position;
    this.color = color;
    this.name = name;
  }
}

export class Track {
  metadata: IMetadata;
  cuePoints: CuePoint[];

  constructor(metadata: IMetadata, cuePoints: CuePoint[]) {
    this.metadata = metadata;
    this.cuePoints = cuePoints;
  }
}

export type Playlist = {
  name: string;
  tracks: string[];
};
