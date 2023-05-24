import { useMemo } from "react";
import { Table } from "rsuite";

import * as styles from "./track-display.css";

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

export function TrackDisplay() {
  const tracks = useLibrary((state) => state.tracks);
  const playlist = useLibrary((state) => state.selectedPlaylist);

  const tableData: TableData[] | undefined = useMemo(() => {
    console.log(playlist);
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
  }, [playlist, tracks]);

  return (
    <Table
      className={styles.trackDisplay}
      data={tableData}
      bordered
      cellBordered
      fillHeight
    >
      <Table.Column width={50} fullText>
        <Table.HeaderCell>#</Table.HeaderCell>
        <Table.Cell dataKey="trackNo" />
      </Table.Column>

      <Table.Column width={200} fullText>
        <Table.HeaderCell>Title</Table.HeaderCell>
        <Table.Cell dataKey="title" />
      </Table.Column>

      <Table.Column width={150} fullText>
        <Table.HeaderCell>Artist</Table.HeaderCell>
        <Table.Cell dataKey="artist" />
      </Table.Column>

      <Table.Column width={110} fullText>
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

      <Table.Column width={60} fullText>
        <Table.HeaderCell>BPM</Table.HeaderCell>
        <Table.Cell dataKey="bpm" />
      </Table.Column>

      <Table.Column width={60} fullText>
        <Table.HeaderCell>Key</Table.HeaderCell>
        <Table.Cell dataKey="key" />
      </Table.Column>

      <Table.Column width={60} fullText>
        <Table.HeaderCell>Type</Table.HeaderCell>
        <Table.Cell dataKey="type" />
      </Table.Column>

      <Table.Column width={100} fullText>
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
