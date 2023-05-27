import { Playlist, Tracks } from "@dj-migrator/common";
import { useEffect, useState, useTransition } from "react";
import { Table } from "rsuite";

import * as styles from "./track-display.css";

import { KEY_COLOURS, KEY_TO_CAMELOT } from "@/main-window/utils/keys";
import { useLibrary } from "@/stores/libraryStore";

type TableData = {
  trackNo: number;
  title: string | undefined;
  artist: string | undefined;
  duration: number | undefined;
  bpm: string | undefined;
  key: string | undefined;
  type: string | undefined;
  bitrate: number | undefined;
  cuePoints: number | undefined;
};

function transformPlaylistToTableData(
  playlist: Playlist | null,
  tracks: Tracks
) {
  return playlist?.tracks
    .map((trackName, index) => {
      const track = tracks.get(trackName);

      if (!track) return;

      return {
        trackNo: index + 1,
        title: track.track.metadata.title,
        artist: track.track.metadata.artist,
        duration: track.track.metadata.duration,
        bpm: track.track.metadata.bpm,
        key: track.track.metadata.key,
        type: track.track.metadata.fileExtension,
        bitrate: track.track.metadata.bitrate,
        cuePoints: track.track.cuePoints.length,
      };
    })
    .filter((track) => Boolean(track)) as TableData[];
}

export function TrackDisplay() {
  const tracks = useLibrary((state) => state.tracks);
  const playlist = useLibrary((state) => state.selectedPlaylist);
  const [tableData, setTableData] = useState<TableData[] | undefined>();

  const [isPending, startTransition] = useTransition();

  // Mark transforming table data as a transition to unblock UI
  useEffect(() => {
    startTransition(() => {
      setTableData(transformPlaylistToTableData(playlist, tracks));
    });
  }, [playlist, tracks]);

  return (
    <Table
      className={styles.trackDisplay}
      data={tableData}
      bordered
      cellBordered
      fillHeight
      loading={isPending}
      virtualized
    >
      <Table.Column width={50} fullText resizable>
        <Table.HeaderCell>#</Table.HeaderCell>
        <Table.Cell dataKey="trackNo" />
      </Table.Column>

      <Table.Column width={200} fullText resizable>
        <Table.HeaderCell>Title</Table.HeaderCell>
        <Table.Cell dataKey="title" />
      </Table.Column>

      <Table.Column width={150} fullText resizable>
        <Table.HeaderCell>Artist</Table.HeaderCell>
        <Table.Cell dataKey="artist" />
      </Table.Column>

      <Table.Column width={60} fullText resizable>
        <Table.HeaderCell>BPM</Table.HeaderCell>
        <Table.Cell dataKey="bpm" />
      </Table.Column>

      <Table.Column width={60} fullText resizable>
        <Table.HeaderCell>Key</Table.HeaderCell>
        <Table.Cell>
          {(rowData) => (
            <span
              style={{
                color: KEY_COLOURS[KEY_TO_CAMELOT[rowData.key] || rowData.key],
              }}
            >
              {KEY_TO_CAMELOT[rowData.key] || rowData.key}
            </span>
          )}
        </Table.Cell>
      </Table.Column>

      <Table.Column width={110} fullText resizable>
        <Table.HeaderCell>Duration (mins)</Table.HeaderCell>
        <Table.Cell>
          {(rowData) => {
            if (!rowData["duration"]) {
              return null;
            }
            const minutes = Math.floor(rowData["duration"] / 60);
            const seconds = Math.floor(rowData["duration"] - minutes * 60);
            return `${minutes}:${seconds.toLocaleString("en-NZ", {
              minimumIntegerDigits: 2,
              useGrouping: false,
            })}`;
          }}
        </Table.Cell>
      </Table.Column>

      <Table.Column width={60} fullText resizable>
        <Table.HeaderCell>Type</Table.HeaderCell>
        <Table.Cell dataKey="type" />
      </Table.Column>

      <Table.Column width={100} fullText resizable>
        <Table.HeaderCell>Bitrate (kb/s)</Table.HeaderCell>
        <Table.Cell>{(rowData) => rowData["bitrate"] / 1000}</Table.Cell>
      </Table.Column>

      <Table.Column flexGrow={1} fullText>
        <Table.HeaderCell>Cue points</Table.HeaderCell>
        <Table.Cell dataKey="cuePoints" />
      </Table.Column>
    </Table>
  );
}
