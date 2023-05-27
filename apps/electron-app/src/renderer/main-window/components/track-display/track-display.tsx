import { Playlist, Tracks } from "@dj-migrator/common";
import { useEffect, useState, useTransition } from "react";
import { Table } from "rsuite";
import { SortType } from "rsuite/esm/Table";

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

function sortTracks(
  tableData: TableData[],
  sortColumn: keyof TableData,
  sortType: SortType
): TableData[] {
  switch (sortColumn) {
    case "trackNo": {
      return [
        ...tableData.sort((rowDataA, rowDataB) =>
          sortType === "asc"
            ? rowDataA.trackNo - rowDataB.trackNo
            : rowDataB.trackNo - rowDataA.trackNo
        ),
      ];
    }
    case "title": {
      return [
        ...tableData.sort((rowDataA, rowDataB) => {
          if (!rowDataA.title || !rowDataB.title) return 0;

          return sortType === "asc"
            ? rowDataA.title?.localeCompare(rowDataB.title)
            : rowDataB.title?.localeCompare(rowDataA.title);
        }),
      ];
    }
    case "artist": {
      return [
        ...tableData.sort((rowDataA, rowDataB) => {
          if (!rowDataA.artist || !rowDataB.artist) return 0;

          return sortType === "asc"
            ? rowDataA.artist?.localeCompare(rowDataB.artist)
            : rowDataB.artist?.localeCompare(rowDataA.artist);
        }),
      ];
    }
    case "bpm": {
      return [
        ...tableData.sort((rowDataA, rowDataB) => {
          if (!rowDataA.bpm || !rowDataB.bpm) return 0;

          return sortType === "asc"
            ? Number(rowDataA.bpm) - Number(rowDataB.bpm)
            : Number(rowDataB.bpm) - Number(rowDataA.bpm);
        }),
      ];
    }
    case "key": {
      return [
        ...tableData.sort((rowDataA, rowDataB) => {
          if (!rowDataA.key || !rowDataB.key) return 0;

          const keyA = KEY_TO_CAMELOT[rowDataA.key] || rowDataA.key;
          const keyB = KEY_TO_CAMELOT[rowDataB.key] || rowDataB.key;

          const matchesA = keyA.match(/^(\d{1,2})([AB])$/);
          const matchesB = keyB.match(/^(\d{1,2})([AB])$/);

          const camelotNumberA = matchesA?.[1];
          const camelotLetterA = matchesA?.[2];
          const camelotNumberB = matchesB?.[1];
          const camelotLetterB = matchesB?.[2];

          if (!camelotNumberA || !camelotNumberB) return 0;

          if (sortType === "asc") {
            const numberCompareValue =
              Number(camelotNumberA) - Number(camelotNumberB);

            if (numberCompareValue === 0 && camelotLetterA && camelotLetterB) {
              return camelotLetterA.localeCompare(camelotLetterB);
            }

            return numberCompareValue;
          } else {
            const numberCompareValue =
              Number(camelotNumberB) - Number(camelotNumberA);

            if (numberCompareValue === 0 && camelotLetterA && camelotLetterB) {
              return camelotLetterB.localeCompare(camelotLetterA);
            }

            return numberCompareValue;
          }
        }),
      ];
    }
    case "duration": {
      return [
        ...tableData.sort((rowDataA, rowDataB) => {
          if (!rowDataA.duration || !rowDataB.duration) return 0;

          return sortType === "asc"
            ? Number(rowDataA.duration) - Number(rowDataB.duration)
            : Number(rowDataB.duration) - Number(rowDataA.duration);
        }),
      ];
    }
    case "type": {
      return [
        ...tableData.sort((rowDataA, rowDataB) => {
          if (!rowDataA.type || !rowDataB.type) return 0;

          return sortType === "asc"
            ? rowDataA.type?.localeCompare(rowDataB.type)
            : rowDataB.type?.localeCompare(rowDataA.type);
        }),
      ];
    }
    case "bitrate": {
      return [
        ...tableData.sort((rowDataA, rowDataB) => {
          if (!rowDataA.bitrate || !rowDataB.bitrate) return 0;

          return sortType === "asc"
            ? Number(rowDataA.bitrate) - Number(rowDataB.bitrate)
            : Number(rowDataB.bitrate) - Number(rowDataA.bitrate);
        }),
      ];
    }
    case "cuePoints": {
      return [
        ...tableData.sort((rowDataA, rowDataB) => {
          if (!rowDataA.cuePoints || !rowDataB.cuePoints) return 0;

          return sortType === "asc"
            ? Number(rowDataA.cuePoints) - Number(rowDataB.cuePoints)
            : Number(rowDataB.cuePoints) - Number(rowDataA.cuePoints);
        }),
      ];
    }
    default: {
      return tableData;
    }
  }
}

export function TrackDisplay() {
  const tracks = useLibrary((state) => state.tracks);
  const playlist = useLibrary((state) => state.selectedPlaylist);
  const [tableData, setTableData] = useState<TableData[] | undefined>();
  const [sortType, setSortType] = useState<SortType>("asc");
  const [sortColumn, setSortColumn] = useState<keyof TableData>("trackNo");

  const [isPending, startTransition] = useTransition();

  function onSortColumn(dataKey: string, sortType?: SortType) {
    console.log(dataKey, sortType);
    if (sortType) {
      setSortType(sortType);
      setSortColumn(dataKey as keyof TableData);
    }
  }

  // Mark transforming table data as a transition to unblock UI
  useEffect(() => {
    startTransition(() => {
      setTableData(
        sortTracks(
          transformPlaylistToTableData(playlist, tracks),
          sortColumn,
          sortType
        )
      );
    });
  }, [playlist, tracks, sortColumn, sortType]);

  return (
    <Table
      className={styles.trackDisplay}
      data={tableData}
      bordered
      cellBordered
      fillHeight
      loading={isPending}
      sortColumn={sortColumn}
      sortType={sortType}
      onSortColumn={onSortColumn}
      virtualized
    >
      <Table.Column width={50} fullText resizable sortable>
        <Table.HeaderCell>#</Table.HeaderCell>
        <Table.Cell dataKey="trackNo" />
      </Table.Column>

      <Table.Column width={200} fullText resizable sortable>
        <Table.HeaderCell>Title</Table.HeaderCell>
        <Table.Cell dataKey="title" />
      </Table.Column>

      <Table.Column width={150} fullText resizable sortable>
        <Table.HeaderCell>Artist</Table.HeaderCell>
        <Table.Cell dataKey="artist" />
      </Table.Column>

      <Table.Column width={60} fullText resizable sortable>
        <Table.HeaderCell>BPM</Table.HeaderCell>
        <Table.Cell dataKey="bpm" />
      </Table.Column>

      <Table.Column width={60} fullText resizable sortable>
        <Table.HeaderCell>Key</Table.HeaderCell>
        <Table.Cell dataKey="key">
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

      <Table.Column width={110} fullText resizable sortable>
        <Table.HeaderCell>Duration (mins)</Table.HeaderCell>
        <Table.Cell dataKey="duration">
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

      <Table.Column width={60} fullText resizable sortable>
        <Table.HeaderCell>Type</Table.HeaderCell>
        <Table.Cell dataKey="type" />
      </Table.Column>

      <Table.Column width={100} fullText resizable sortable>
        <Table.HeaderCell>Bitrate (kb/s)</Table.HeaderCell>
        <Table.Cell dataKey="bitrate">
          {(rowData) => rowData["bitrate"] / 1000}
        </Table.Cell>
      </Table.Column>

      <Table.Column flexGrow={1} fullText sortable>
        <Table.HeaderCell>Cue points</Table.HeaderCell>
        <Table.Cell dataKey="cuePoints" />
      </Table.Column>
    </Table>
  );
}
