import { useState } from "react";
import { Button } from "rsuite";

import * as styles from "./dashboard.css";

import { PlaylistPanel } from "@/components/layout/playlist-panel";
import { TrackDisplay } from "@/components/track-display";
import { useLibrary } from "@/stores/libraryStore";

export const Dashboard = () => {
  const [error, setError] = useState<string | null>(null);
  const selectedPlaylist = useLibrary((state) => state.selectedPlaylist);

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
      <div className={styles.buttonToolbar}>
        <Button
          appearance="primary"
          onClick={() => {
            window.electronAPI.openImportWindow();
          }}
        >
          Open import window
        </Button>
        <Button disabled={!selectedPlaylist} onClick={exportSelectedPlaylist}>
          Export selected playlist
        </Button>
      </div>

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
