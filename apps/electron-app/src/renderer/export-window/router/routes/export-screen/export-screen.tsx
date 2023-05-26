import { ButtonToolbar, Stack } from "rsuite";

import * as styles from "./export-screen.css";

import { CancelButton } from "@/export-window/components/cancel-button";
import { ExportButton } from "@/export-window/components/export-button";
import { ExportCrateTree } from "@/export-window/components/export-crate-tree";

export function ExportScreen() {
  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <Stack direction="column" alignItems="stretch" spacing={30}>
          <ExportCrateTree />
          <Stack.Item alignSelf="center">
            <ButtonToolbar>
              <ExportButton />
              <CancelButton />
            </ButtonToolbar>
          </Stack.Item>
        </Stack>
      </div>
    </div>
  );
}
