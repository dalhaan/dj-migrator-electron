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
  name: string | undefined;

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

export type Tracks = Map<
  string,
  {
    key: number;
    absolutePath: string;
    track: Track; // TODO: replace with proper interface once it has been made
  }
>;

export interface ILibraryData {
  playlists: IPlaylist[];
  trackMap: Tracks;
}

export interface IProgressCallback {
  (progress: number, message: string): void;
}

export interface IConvertFromSeratoParams {
  seratoDir: string;
  cratesToConvert?: string[];
  progressCallback?: IProgressCallback;
}

// ====================
// Errors
// ====================

export type IpcErrorTypes = "InvalidSeratoDirError" | "DirectoryNotFound";

export type IpcError = {
  type: IpcErrorTypes;
  error?: string;
};

export type IpcSuccess<ResponseType> = {
  type: "success";
  response: ResponseType;
};

export type IpcResponse<ResponseType> = IpcError | IpcSuccess<ResponseType>;

export function ipcResponse<ResponseType>(
  type: "success",
  response: ResponseType
): IpcSuccess<ResponseType>;
export function ipcResponse(type: IpcErrorTypes, error?: string): IpcError;
export function ipcResponse(
  type: "success" | IpcErrorTypes,
  value: unknown
): unknown {
  return type === "success"
    ? {
        type,
        response: value,
      }
    : {
        type,
        error: value,
      };
}

export class DirectoryNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class InvalidSeratoDirError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "InvalidSeratoDirError";
  }
}

export type Crate = {
  name: string;
  filePath: string;
  tracks: string[];
};
