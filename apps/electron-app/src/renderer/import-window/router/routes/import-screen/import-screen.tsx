import { ButtonToolbar, Stack } from "rsuite";

import * as styles from "./import-screen.css";

import { CancelButton } from "@/import-window/components/cancel-button";
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
            <ButtonToolbar>
              <ImportButton />
              <CancelButton />
            </ButtonToolbar>
          </Stack.Item>
        </Stack>
      </div>
    </div>
  );
}
