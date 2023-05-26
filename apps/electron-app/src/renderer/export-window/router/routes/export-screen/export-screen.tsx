import { Stack } from "rsuite";

import * as styles from "./export-screen.css";

import { ExportCrateTree } from "@/export-window/components/export-crate-tree";

export function ExportScreen() {
  return (
    <div className={styles.exportScreen}>
      <div className={styles.inner}>
        <Stack direction="column" alignItems="stretch" spacing={30}>
          <ExportCrateTree />
          {/* <DirectorySelect />
          <ImportCrateTree />
          <Stack.Item alignSelf="center">
            <ButtonToolbar>
              <ImportButton />
              <CancelButton />
            </ButtonToolbar>
          </Stack.Item> */}
        </Stack>
      </div>
    </div>
  );
}
