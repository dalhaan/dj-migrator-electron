import { IPlaylist, IProgressCallback, ITrackMap } from "./serato";

export interface IConvertToRekordboxParams {
  playlists: IPlaylist[];
  trackMap: ITrackMap;
  outputXMLPath: string;
  saveCuesAsMemoryCues?: boolean;
  saveCuesAsHotCues?: boolean;
  progressCallback: IProgressCallback;
}
