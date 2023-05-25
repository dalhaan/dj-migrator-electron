import { Crate } from "@dj-migrator/common";
import { useState } from "react";
import { Button } from "rsuite";

import { useImport } from "../stores/import-store";

import { ALL_CRATES_SELECTED } from "./import-crate-tree";

export function ImportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const directory = useImport((state) => state.directory);
  const crates = useImport((state) => state.crates);
  const selectedCratesPaths = useImport((state) => state.selectedCrates);

  async function handleClick() {
    if (!directory) return;

    setIsLoading(true);

    const selectedCrates =
      selectedCratesPaths[0] === ALL_CRATES_SELECTED
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
