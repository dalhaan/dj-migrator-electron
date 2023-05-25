import { DirectorySelect } from "@/import-window/components/directory-select";
import { ImportButton } from "@/import-window/components/import-button";
import { ImportCrateCheckTree } from "@/import-window/components/import-crate-check-tree";

export function ImportScreen() {
  return (
    <div>
      <h1>Import Screen</h1>

      <DirectorySelect />
      <ImportCrateCheckTree />
      <ImportButton />
    </div>
  );
}
