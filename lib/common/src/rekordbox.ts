import { Playlist } from "./intermediary";
import { IProgressCallback, Tracks } from "./serato";

export interface IConvertToRekordboxParams {
  playlists: Playlist[];
  trackMap: Tracks;
  outputXMLPath: string;
  saveCuesAsMemoryCues?: boolean;
  saveCuesAsHotCues?: boolean;
  progressCallback: IProgressCallback;
}
