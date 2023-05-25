import { useMemo } from "react";
import { CheckTree, Panel } from "rsuite";

import * as styles from "./import-crate-tree.css";

import { useImport } from "@/import-window/stores/import-store";

export function ImportCrateTree() {
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
          value: crate.filePath,
          label: crate.name,
        })),
      },
    ];
  }, [crates]);

  return (
    <Panel className={styles.panel} bordered bodyFill>
      <CheckTree
        data={data}
        height={360}
        // Always expand tree
        expandItemValues={["ALL"]}
        onChange={(playlists) =>
          useImport.getState().setSelectedCrates(playlists as string[])
        }
      />
    </Panel>
  );
}
