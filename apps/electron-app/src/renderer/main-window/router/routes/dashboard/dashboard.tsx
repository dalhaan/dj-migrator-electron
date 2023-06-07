import * as styles from "./dashboard.css";

import { ExportButton } from "@/main-window/components/export-button";
import { ImportButton } from "@/main-window/components/import-button";
import { Player } from "@/main-window/components/player";
import { PlaylistPanel } from "@/main-window/components/playlist-panel";
// import { TrackPlayer } from "@/main-window/components/track-player";
import { TrackTable } from "@/main-window/components/track-table";
// import TestWorker from "@/workers/test-worker?worker";

// const testWorker = new TestWorker();

// testWorker.addEventListener("message", (event) => {
//   console.log(event);
// });

// const ExampleWorkerEventButton = () => {
//   function handleClick() {
//     testWorker.postMessage({
//       type: "EXAMPLE_MESSAGE",
//       data: "example data",
//     });
//   }

//   return <Button onClick={handleClick}>Worker event</Button>;
// };

export const Dashboard = () => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.buttonToolbar}>
        <ImportButton />
        <ExportButton />
      </div>

      <Player />
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
