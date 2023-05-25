import { CheckTree } from "rsuite";

import { useImport } from "@/import-window/stores/import-store";

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
        useImport.getState().setSelectedPlaylists(playlists as string[])
      }
      defaultExpandAll
    />
  );
}
