import { Crate } from "@dj-migrator/common";
import { useState } from "react";
import { Button } from "rsuite";

import { useExport } from "../stores/export-store";

import { ALL_PLAYLISTS_SELECTED } from "./export-crate-tree";

export function ImportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const directory = useExport((state) => state.directory);
  const crates = useExport((state) => state.crates);
  const selectedCratesPaths = useExport((state) => state.selectedCrates);

  async function handleClick() {
    if (!directory) return;

    setIsLoading(true);

    const selectedCrates =
      selectedCratesPaths[0] === ALL_PLAYLISTS_SELECTED
        ? crates
        : (selectedCratesPaths
            .map((path) => crates.find((crate) => crate.filePath === path))
            .filter((crate) => Boolean(crate)) as Crate[]);

    try {
      await window.electronAPI.parseCrates(directory, selectedCrates);

      // Close window once importing in complete
      window.close();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      loading={isLoading}
      appearance="primary"
      disabled={!selectedCratesPaths.length}
      onClick={handleClick}
    >
      Import
    </Button>
  );
}
