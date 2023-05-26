import * as styles from "./dashboard.css";

import { ExportButton } from "@/main-window/components/export-button";
import { ImportButton } from "@/main-window/components/import-button";
import { PlaylistPanel } from "@/main-window/components/playlist-panel";
import { TrackDisplay } from "@/main-window/components/track-display";
import { TrackPlayer } from "@/main-window/components/track-player";

export const Dashboard = () => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.buttonToolbar}>
        <ImportButton />
        <ExportButton />
      </div>

      <TrackPlayer />
      <div className={styles.displayContainer}>
        <div className={styles.display}>
          <PlaylistPanel />
          <TrackDisplay />
        </div>
      </div>
    </div>
  );
};
