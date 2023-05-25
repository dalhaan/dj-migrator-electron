import { Crate } from "@dj-migrator/common";
import { Button } from "rsuite";

import { useImport } from "../stores/import-store";

export function ImportButton() {
  const directory = useImport((state) => state.directory);
  const crates = useImport((state) => state.crates);
  const selectedCratesPaths = useImport((state) => state.selectedCrates);

  async function handleClick() {
    if (!directory) return;

    const selectedCrates = selectedCratesPaths
      .map((path) => crates.find((crate) => crate.filePath === path))
      .filter((crate) => Boolean(crate)) as Crate[];

    window.electronAPI.parseCrates(directory, selectedCrates);
  }

  return (
    <Button
      appearance="primary"
      disabled={!selectedCratesPaths.length}
      onClick={handleClick}
    >
      Import
    </Button>
  );
}
