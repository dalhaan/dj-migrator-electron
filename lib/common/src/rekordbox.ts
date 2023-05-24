import { IPlaylist, IProgressCallback, Tracks } from "./serato";

export interface IConvertToRekordboxParams {
  playlists: IPlaylist[];
  trackMap: Tracks;
  outputXMLPath: string;
  saveCuesAsMemoryCues?: boolean;
  saveCuesAsHotCues?: boolean;
  progressCallback: IProgressCallback;
}
