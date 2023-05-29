import { Playlist, Tracks } from "@dj-migrator/common";
import {
  ComponentPropsWithoutRef,
  useEffect,
  useState,
  useTransition,
} from "react";
import { Table } from "rsuite";
import { SortType } from "rsuite/esm/Table";

import * as styles from "./track-display.css";

import { KEY_COLOURS, KEY_TO_CAMELOT } from "@/main-window/utils/keys";
import { useLibrary, useMainStore } from "@/stores/libraryStore";
import { formatTime } from "@/utils/formatters";
import { defaultSort, sortCamelotKeys } from "@/utils/sorting-utils";

type TableData = {
  id: string;
  location: string;
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
): TableData[] | undefined {
  return playlist?.tracks
    .map((trackName, index) => {
      const track = tracks.get(trackName);

      if (!track) return;

      return {
        id: trackName,
        location: track.track.metadata.location,
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
  tableData: TableData[] | undefined,
  sortColumn: keyof TableData,
  sortType: SortType
): TableData[] | undefined {
  if (!tableData) return;

  switch (sortColumn) {
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

          // Get camelot key of track
          const keyA = KEY_TO_CAMELOT[rowDataA.key] || rowDataA.key;
          const keyB = KEY_TO_CAMELOT[rowDataB.key] || rowDataB.key;

          return sortCamelotKeys(keyA, keyB, sortType);
        }),
      ];
    }

    default: {
      return [
        ...tableData.sort((rowDataA, rowDataB) => {
          const valueA = rowDataA[sortColumn as keyof TableData];
          const valueB = rowDataB[sortColumn as keyof TableData];

          if (!valueA || !valueB) return 0;

          return defaultSort(valueA, valueB, sortType);
        }),
      ];
    }
  }
}

function ClickableCell({
  rowData,
  ...props
}: ComponentPropsWithoutRef<typeof Table.Cell>) {
  const selectedTrackId = useMainStore((state) => state.selectedTrackId);

  const trackData = rowData as TableData;

  function handleDoubleClick() {
    useMainStore.getState().setSelectedTrackId(trackData.id);
  }

  return (
    <Table.Cell
      onDoubleClick={handleDoubleClick}
      className={
        selectedTrackId === trackData.id ? styles.selectedTrack : undefined
      }
      {...props}
    />
  );
}

function TrackCell({
  rowData,
  dataKey,
  ...props
}: ComponentPropsWithoutRef<typeof Table.Cell>) {
  return (
    <ClickableCell rowData={rowData} dataKey={dataKey} {...props}>
      {dataKey ? rowData[dataKey] : ""}
    </ClickableCell>
  );
}

function KeyCell({
  rowData,
  dataKey,
  ...props
}: ComponentPropsWithoutRef<typeof Table.Cell>) {
  return (
    <ClickableCell rowData={rowData} dataKey={dataKey} {...props}>
      {rowData.key ? (
        <span
          style={{
            color: KEY_COLOURS[KEY_TO_CAMELOT[rowData.key] || rowData.key],
          }}
        >
          {KEY_TO_CAMELOT[rowData.key] || rowData.key}
        </span>
      ) : null}
    </ClickableCell>
  );
}

function DurationCell({
  rowData,
  dataKey,
  ...props
}: ComponentPropsWithoutRef<typeof Table.Cell>) {
  return (
    <ClickableCell rowData={rowData} dataKey={dataKey} {...props}>
      {rowData["duration"] ? formatTime(rowData["duration"]) : null}
    </ClickableCell>
  );
}

function BitrateCell({
  rowData,
  dataKey,
  ...props
}: ComponentPropsWithoutRef<typeof Table.Cell>) {
  return (
    <ClickableCell rowData={rowData} dataKey={dataKey} {...props}>
      {rowData["bitrate"] ? rowData["bitrate"] / 1000 : null}
    </ClickableCell>
  );
}

export function TrackTable() {
  const tracks = useLibrary((state) => state.tracks);
  const playlist = useMainStore((state) => state.selectedPlaylist);
  const [tableData, setTableData] = useState<TableData[] | undefined>();
  const [sortType, setSortType] = useState<SortType>("asc");
  const [sortColumn, setSortColumn] = useState<keyof TableData>("trackNo");

  const [isPending, startTransition] = useTransition();

  function onSortColumn(dataKey: string, sortType?: SortType) {
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
        <TrackCell dataKey="trackNo" />
      </Table.Column>

      <Table.Column width={200} fullText resizable sortable>
        <Table.HeaderCell>Title</Table.HeaderCell>
        <TrackCell dataKey="title" />
      </Table.Column>

      <Table.Column width={150} fullText resizable sortable>
        <Table.HeaderCell>Artist</Table.HeaderCell>
        <TrackCell dataKey="artist" />
      </Table.Column>

      <Table.Column width={60} fullText resizable sortable>
        <Table.HeaderCell>BPM</Table.HeaderCell>
        <TrackCell dataKey="bpm" />
      </Table.Column>

      <Table.Column width={60} fullText resizable sortable>
        <Table.HeaderCell>Key</Table.HeaderCell>
        <KeyCell dataKey="key" />
      </Table.Column>

      <Table.Column width={110} fullText resizable sortable>
        <Table.HeaderCell>Duration (mins)</Table.HeaderCell>
        <DurationCell dataKey="duration" />
      </Table.Column>

      <Table.Column width={60} fullText resizable sortable>
        <Table.HeaderCell>Type</Table.HeaderCell>
        <TrackCell dataKey="type" />
      </Table.Column>

      <Table.Column width={100} fullText resizable sortable>
        <Table.HeaderCell>Bitrate (kb/s)</Table.HeaderCell>
        <BitrateCell dataKey="bitrate" />
      </Table.Column>

      <Table.Column flexGrow={1} fullText sortable>
        <Table.HeaderCell>Cue points</Table.HeaderCell>
        <TrackCell dataKey="cuePoints" />
      </Table.Column>
    </Table>
  );
}
