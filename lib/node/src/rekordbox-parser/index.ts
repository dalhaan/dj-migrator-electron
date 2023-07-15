import {
  IConvertToRekordboxParams,
  IProgressCallback,
  Playlist,
  Tracks,
} from "@dj-migrator/common";
import fs from "fs";
import path from "path";
import { create as createXML } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

/**
 * Gets today's date in the format YYYY-MM-DD
 */
function getTodaysDate(): string {
  const date: Date = new Date();

  const day: string =
    date.getDay() < 10 ? `0${date.getDay()}` : `${date.getDay()}`;
  const month: string =
    date.getMonth() < 10 ? `0${date.getMonth()}` : `${date.getMonth()}`;

  return `${date.getFullYear()}-${month}-${day}`;
}

function buildCollectionTag(
  tracks: Tracks,
  collectionXML: XMLBuilder,
  saveCuesAsMemoryCues: boolean,
  saveCuesAsHotCues: boolean,
  progressCallback?: IProgressCallback
): XMLBuilder {
  collectionXML = collectionXML.ele("COLLECTION", {
    Entries: `${tracks.size}`,
  });

  let i = 0;
  for (const track of tracks.values()) {
    // Update progress callback
    const progress = (i / tracks.size) * 100;
    const progressMessage = `Building collection tags (track ${i + 1} of ${
      tracks.size
    })`;
    progressCallback?.(progress, progressMessage);

    const fileExtension = track.track.metadata.fileExtension.replace(".", "");
    const fileKind = `${fileExtension.toUpperCase()} File`;

    const encodedLocation = track.track.metadata.location
      .split(path.sep) // TODO: not sure this is necessary as Serato may always use forward slashes even on Windows
      .map((component) => encodeURIComponent(component))
      .join("/");
    const location = `file://localhost${encodedLocation}`;
    const trackKey = String(track.key);

    // Add the track to the collection
    collectionXML = collectionXML.ele("TRACK", {
      TrackID: trackKey, // This field only needs to match the playlist track keys as Rekordbox will auto-assign it
      Name: track.track.metadata.title || "",
      Artist: track.track.metadata.artist || "",
      Composer: "",
      Album: track.track.metadata.album || "",
      Grouping: "",
      Genre: track.track.metadata.genre?.[0] || "",
      Kind: fileKind,
      Size: `${track.track.metadata.size}`,
      TotalTime: track.track.metadata.duration
        ? `${Math.ceil(track.track.metadata.duration)}`
        : "59999", // TODO: this being '0' is preventing the cues from loading
      DiscNumber: "0",
      TrackNumber: "0",
      Year: "0",
      AverageBpm: track.track.metadata.bpm || "",
      DateAdded: getTodaysDate(),
      BitRate: track.track.metadata.bitrate
        ? `${track.track.metadata.bitrate / 1000}`
        : "0",
      SampleRate: `${track.track.metadata.sampleRate || 0}`,
      Comments: track.track.metadata.comment?.[0] || "",
      PlayCount: "0",
      Rating: "0",
      Location: location,
      Remixer: "",
      Tonality: track.track.metadata.key || "",
      Label: "",
      Mix: "",
    });

    // Beat Grid
    for (const beatGrid of track.track.beatGrids) {
      collectionXML = collectionXML
        .ele("TEMPO", {
          Inizio: String(beatGrid.position),
          Bpm: String(beatGrid.bpm),
          Metro: "4/4",
          Battito: "1",
        })
        .up();
    }

    // Add the track's cue points as memory cues
    for (const cuePoint of track.track.cuePoints) {
      if (saveCuesAsMemoryCues) {
        collectionXML = collectionXML
          .ele("POSITION_MARK", {
            Name: "",
            Type: "0",
            Start: `${cuePoint.position / 1000}`,
            Num: "-1",
          })
          .up();
      }

      if (saveCuesAsHotCues) {
        collectionXML = collectionXML
          .ele("POSITION_MARK", {
            Name: "",
            Type: "0",
            Start: `${cuePoint.position / 1000}`,
            Num: `${cuePoint.index}`,
            Red: "40",
            Green: "226",
            Blue: "20",
          })
          .up();
      }
    }

    collectionXML = collectionXML.up();
    i++;
  }

  progressCallback?.(100, "Finished building collection tags");

  return collectionXML;
}

function buildPlaylistsTag(
  playlists: Playlist[],
  tracks: Tracks,
  collectionXML: XMLBuilder,
  progressCallback?: IProgressCallback
): XMLBuilder {
  collectionXML = collectionXML
    .up()
    .ele("PLAYLISTS")
    .ele("NODE", { Type: "0", Name: "ROOT", Count: `${playlists.length}` });

  let i = 0;
  for (const playlist of playlists) {
    // Update progress callback
    const progress = (i / playlists.length) * 100;
    const progressMessage = `Building playlist tags (playlist ${i + 1} of ${
      playlists.length
    })`;

    progressCallback?.(progress, progressMessage);

    const filteredTracks = playlist.tracks;

    collectionXML = collectionXML.ele("NODE", {
      Name: playlist.name,
      Type: "1",
      KeyType: "0",
      Entries: `${filteredTracks.length}`,
    });

    for (const track of filteredTracks) {
      const trackObject = tracks.get(track);

      // Track may not be in track map if it does not exist or is not an mp3
      if (trackObject) {
        collectionXML = collectionXML
          .ele("TRACK", { Key: trackObject.key })
          .up();
      }
    }

    collectionXML = collectionXML.up();
    i++;
  }

  progressCallback?.(100, "Finished building playlist tags");

  return collectionXML;
}

export function convertToRekordbox({
  playlists,
  tracks,
  outputXMLPath,
  saveCuesAsMemoryCues = true,
  saveCuesAsHotCues = false,
  progressCallback,
}: IConvertToRekordboxParams): Promise<void> {
  // Build RekordBox collection XML
  let collectionXML = createXML({ version: "1.0", encoding: "UTF-8" })
    .ele("DJ_PLAYLISTS", { Version: "1.0.0" })
    .ele("PRODUCT", {
      Name: "rekordbox",
      Version: "5.6.0",
      Company: "Pioneer DJ",
    })
    .up();

  // Add tracks to RekordBox collection XML
  collectionXML = buildCollectionTag(
    tracks,
    collectionXML,
    saveCuesAsMemoryCues,
    saveCuesAsHotCues,
    progressCallback
  );

  // Add playlists to RekordBox collection XML
  collectionXML = buildPlaylistsTag(
    playlists,
    tracks,
    collectionXML,
    progressCallback
  );
  const xml = collectionXML.end({ prettyPrint: true });

  // Write collection XML to file
  fs.writeFileSync(outputXMLPath, xml);

  console.log(
    `RekordBox collection XML saved to: '${path.resolve(outputXMLPath)}'`
  );
  return Promise.resolve();
}
