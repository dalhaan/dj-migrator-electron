import { Button } from "rsuite";

import * as styles from "./dashboard.css";

import { PlaylistPanel } from "@/components/layout/playlist-panel";
import { TrackDisplay } from "@/components/track-display";
import { useLibrary } from "@/stores/libraryStore";

export const Dashboard = () => {
  const playlists = useLibrary((state) => state.playlists);

  return (
    <div className={styles.dashboard}>
      <div className={styles.buttonToolbar}>
        <Button
          appearance="primary"
          onClick={() => {
            window.electronAPI.openImportWindow();
          }}
        >
          Import
        </Button>
        <Button
          disabled={playlists.length === 0}
          onClick={() => {
            window.electronAPI.openExportWindow();
          }}
        >
          Export
        </Button>
      </div>

      <div className={styles.displayContainer}>
        <div className={styles.display}>
          <PlaylistPanel />
          <TrackDisplay />
        </div>
      </div>
    </div>
  );
};
