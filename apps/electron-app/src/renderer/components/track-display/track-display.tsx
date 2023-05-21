import { useMemo } from "react";
import { Panel, Table } from "rsuite";

import * as styles from "./track-display.css";

import { useLibrary } from "@/stores/libraryStore";

export function TrackDisplay() {
  const tracks = useLibrary((state) => state.tracks);

  const tableData = useMemo(() => {
    return tracks.map((track, index) => ({
      trackNo: index + 1,
      title: track.metadata.title,
      artist: track.metadata.artist,
      duration: track.metadata.duration,
      bpm: track.metadata.bpm,
      key: track.metadata.key,
      type: track.metadata.fileExtension,
      bitrate: track.metadata.bitrate,
      cuePoints: track.cuePoints.length,
    }));
  }, [tracks]);

  console.log(tableData);

  return (
    <Panel bordered bodyFill>
      <Table
        className={styles.trackDisplay}
        data={tableData}
        width={930}
        height={700}
      >
        <Table.Column width={40} fullText>
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

        <Table.Column width={150} fullText>
          <Table.HeaderCell>Duration (mins)</Table.HeaderCell>
          <Table.Cell>
            {(rowData) => {
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

        <Table.Column width={100} fullText>
          <Table.HeaderCell>Cue points</Table.HeaderCell>
          <Table.Cell dataKey="cuePoints" />
        </Table.Column>
      </Table>
    </Panel>
  );
}
