import {
  DirectoryNotFoundError,
  InvalidSeratoDirError,
} from "@dj-migrator/common";
import { useState } from "react";
import { Button } from "rsuite";

import * as styles from "./dashboard.css";

import { PlaylistPanel } from "@/components/layout/playlist-panel";
import { TrackDisplay } from "@/components/track-display";
import { useLibrary } from "@/stores/libraryStore";
import { parseIpcResponse } from "@/utils/ipc";

export const Dashboard = () => {
  const [error, setError] = useState<string | null>(null);
  const selectedPlaylist = useLibrary((state) => state.selectedPlaylist);

  async function loadCrates() {
    try {
      const directory = await window.electronAPI.openDirectoryDialog();

      if (!directory) return;

      const crates = parseIpcResponse(
        await window.electronAPI.findCrates(directory)
      );

      console.log(crates);

      await window.electronAPI.parseCrates(directory, crates);
    } catch (error) {
      if (error instanceof InvalidSeratoDirError) {
        setError(error.message);
      } else if (error instanceof DirectoryNotFoundError) {
        setError(error.message);
      } else {
        setError("Unknown error");
      }
    }
  }

  async function exportSelectedPlaylist() {
    if (!selectedPlaylist) return;

    try {
      const outputPath = await window.electronAPI.openSaveFileDialog({
        defaultPath: "RekordboxCollection.xml",
        filters: [
          {
            name: "XML",
            extensions: [".xml"],
          },
        ],
      });

      console.log(outputPath);

      if (!outputPath) return;

      console.log(`Exporting ${selectedPlaylist} to ${outputPath}`);

      await window.electronAPI.exportPlaylistsToRekordBoxXml(
        [selectedPlaylist?.name],
        outputPath,
        {
          saveCuesAsHotCues: true,
          saveCuesAsMemoryCues: true,
        }
      );

      console.log("Exported successfully");
    } catch (error) {
      setError("Unknown error");
    }
  }

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>

      <Button onClick={loadCrates}>Load crates</Button>
      <Button onClick={exportSelectedPlaylist}>Export selected playlist</Button>
      <Button
        onClick={() => {
          window.electronAPI.openImportWindow();
        }}
      >
        Open import window
      </Button>

      <p>{error}</p>
      <div className={styles.displayContainer}>
        <div className={styles.display}>
          <PlaylistPanel />
          <TrackDisplay />
        </div>
      </div>
    </div>
  );
};
