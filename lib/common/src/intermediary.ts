export interface IMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string[];
  bpm?: string;
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

  constructor({
    index,
    position,
    color,
  }: {
    index: number;
    position: number;
    color?: string;
  }) {
    this.index = index;
    this.position = position;
    this.color = color;
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
