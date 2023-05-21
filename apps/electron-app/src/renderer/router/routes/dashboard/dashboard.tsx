import {
  DirectoryNotFoundError,
  InvalidSeratoDirError,
} from "@dj-migrator/common";
import { useState } from "react";
import { Button } from "rsuite";

import { SeratoPlaylistsDisplay } from "@/components/serato/SeratoPlaylistDisplay";
import { useSerato } from "@/stores/seratoStore";
import { parseIpcResponse } from "@/utils/ipc";

export const Dashboard = () => {
  const crates = useSerato((state) => state.crates);
  const [error, setError] = useState<string | null>(null);

  async function loadCrates() {
    try {
      // Prompt user to select Serato directory
      const foundCrates = parseIpcResponse(
        await window.electronAPI.loadCrates()
      );

      if (!foundCrates) return;

      // Update crates state
      useSerato.getState().setCrates(foundCrates);

      // Reset error
      setError(null);
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
    <div>
      <h1>Dashboard</h1>

      <Button onClick={loadCrates}>Load crates</Button>

      <SeratoPlaylistsDisplay />

      <p>{error}</p>
    </div>
  );
};
