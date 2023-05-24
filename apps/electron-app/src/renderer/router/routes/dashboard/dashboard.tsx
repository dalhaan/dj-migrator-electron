import {
  DirectoryNotFoundError,
  InvalidSeratoDirError,
} from "@dj-migrator/common";
import { useState } from "react";
import { Button } from "rsuite";

import * as styles from "./dashboard.css";

import { PlaylistPanel } from "@/components/layout/playlist-panel";
import { TrackDisplay } from "@/components/track-display";
import { parseIpcResponse } from "@/utils/ipc";

export const Dashboard = () => {
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>

      <Button onClick={loadCrates}>Load crates</Button>
      <Button
        onClick={() => {
          window.open("/#/test", "_blank", "titleBarStyle: hidden");
        }}
      >
        Open window
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
