import * as styles from "./dashboard.css";

import { ExportButton } from "@/main-window/components/export-button";
import { ImportButton } from "@/main-window/components/import-button";
import { PlaylistPanel } from "@/main-window/components/playlist-panel";
// import { TrackPlayer } from "@/main-window/components/track-player";
import { TrackTable } from "@/main-window/components/track-table";
import { WebGLWaveformPlayer } from "@/main-window/components/webgl-waveform-player";

export const Dashboard = () => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.buttonToolbar}>
        <ImportButton />
        <ExportButton />
      </div>

      <WebGLWaveformPlayer />
      {/* <TrackPlayer /> */}
      <div className={styles.displayContainer}>
        <div className={styles.display}>
          <PlaylistPanel />
          <TrackTable />
        </div>
      </div>
    </div>
  );
};
