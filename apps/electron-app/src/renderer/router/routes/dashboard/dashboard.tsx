import {
  DirectoryNotFoundError,
  InvalidSeratoDirError,
} from "@dj-migrator/common";
import { useState } from "react";
import { Button } from "rsuite";

import { useSerato } from "@/stores/seratoStore";
import { parseIpcResponse } from "@/utils/ipc";

export const Dashboard = () => {
  const crates = useSerato((state) => state.crates);
  const [error, setError] = useState<string | null>(null);

  async function loadCrates() {
    try {
      const foundCrates = parseIpcResponse(
        await window.electronAPI.loadCrates()
      );

      useSerato.getState().setCrates(foundCrates);

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

      <p>{JSON.stringify(crates)}</p>

      <p>{error}</p>
    </div>
  );
};
