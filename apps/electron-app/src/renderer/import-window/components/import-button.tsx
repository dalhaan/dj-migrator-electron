import { Button } from "rsuite";

import { useImport } from "../stores/import-store";

export function ImportButton() {
  const selectedCrates = useImport((state) => state.selectedCrates);

  return <Button disabled={!selectedCrates.length}>Import</Button>;
}
