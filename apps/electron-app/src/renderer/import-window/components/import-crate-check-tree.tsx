import { CheckTree } from "rsuite";

import { useExport } from "@/import-window/stores/export-store";

export function ImportCrateCheckTree() {
  return (
    <CheckTree
      data={[
        {
          value: "all",
          label: "All",
          children: [
            {
              value: "b",
              label: "Example B",
            },
            {
              value: "c",
              label: "Example C",
            },
          ],
        },
      ]}
      onChange={(playlists) =>
        useExport.getState().setSelectedPlaylists(playlists as string[])
      }
      defaultExpandAll
    />
  );
}
