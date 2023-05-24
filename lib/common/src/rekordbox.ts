import { Playlist } from "./intermediary";
import { IProgressCallback, Tracks } from "./serato";

export interface IConvertToRekordboxParams {
  playlists: Playlist[];
  tracks: Tracks;
  outputXMLPath: string;
  saveCuesAsMemoryCues?: boolean;
  saveCuesAsHotCues?: boolean;
  progressCallback?: IProgressCallback;
}
