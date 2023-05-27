import * as styles from "./dashboard.css";

import { ExportButton } from "@/main-window/components/export-button";
import { ImportButton } from "@/main-window/components/import-button";
import { PlaylistPanel } from "@/main-window/components/playlist-panel";
import { TrackTable } from "@/main-window/components/track-table";

export const Dashboard = () => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.buttonToolbar}>
        <ImportButton />
        <ExportButton />
      </div>

      <div className={styles.displayContainer}>
        <div className={styles.display}>
          <PlaylistPanel />
          <TrackTable />
        </div>
      </div>
    </div>
  );
};
