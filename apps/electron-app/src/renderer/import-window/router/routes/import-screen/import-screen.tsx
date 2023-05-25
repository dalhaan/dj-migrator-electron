import { Stack } from "rsuite";

import * as styles from "./import-screen.css";

import { DirectorySelect } from "@/import-window/components/directory-select";
import { ImportButton } from "@/import-window/components/import-button";
import { ImportCrateTree } from "@/import-window/components/import-crate-tree";

export function ImportScreen() {
  return (
    <div className={styles.importScreen}>
      <div className={styles.inner}>
        <Stack direction="column" alignItems="stretch" spacing={30}>
          <DirectorySelect />
          <ImportCrateTree />
          <Stack.Item alignSelf="center">
            <ImportButton />
          </Stack.Item>
        </Stack>
      </div>
    </div>
  );
}
