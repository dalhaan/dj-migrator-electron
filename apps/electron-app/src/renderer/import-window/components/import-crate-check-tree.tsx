import { useMemo } from "react";
import { CheckTree } from "rsuite";

import { useImport } from "@/import-window/stores/import-store";

export function ImportCrateCheckTree() {
  const crates = useImport((state) => state.crates);

  const data = useMemo(() => {
    if (crates.length === 0) {
      return [];
    }

    return [
      {
        value: "ALL",
        label: "All",
        children: crates.map((crate) => ({
          value: crate,
          label: crate,
        })),
      },
    ];
  }, [crates]);

  return (
    <CheckTree
      data={data}
      // Always expand tree
      expandItemValues={["ALL"]}
      onChange={(playlists) =>
        useImport.getState().setSelectedCrates(playlists as string[])
      }
    />
  );
}
