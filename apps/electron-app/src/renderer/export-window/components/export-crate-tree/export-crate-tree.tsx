import { useMemo } from "react";
import { CheckTree, Panel } from "rsuite";

import * as styles from "./export-crate-tree.css";

import { useExport } from "@/export-window/stores/export-store";
import { useLibrary } from "@/stores/libraryStore";

export const ALL_PLAYLISTS_SELECTED = "ALL";

export function ExportCrateTree() {
  const playlists = useLibrary((state) => state.playlists);
  const selectedPlaylists = useExport((state) => state.selectedPlaylists);

  const data = useMemo(() => {
    if (playlists.length === 0) {
      return [];
    }

    return [
      {
        value: ALL_PLAYLISTS_SELECTED,
        label: "All",
        children: playlists.map((playlist) => ({
          value: playlist.name,
          label: playlist.name,
        })),
      },
    ];
  }, [playlists]);

  return (
    <Panel className={styles.panel} bordered bodyFill>
      <CheckTree
        data={data}
        value={selectedPlaylists}
        onChange={(playlists) =>
          useExport.getState().setSelectedPlaylists(playlists as string[])
        }
        height={360}
        expandItemValues={[ALL_PLAYLISTS_SELECTED]} // Always expand tree
      />
    </Panel>
  );
}
