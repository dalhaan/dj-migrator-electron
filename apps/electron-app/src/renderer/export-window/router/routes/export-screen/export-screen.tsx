import { Stack } from "rsuite";

import * as styles from "./export-screen.css";

export function ExportScreen() {
  return (
    <div className={styles.exportScreen}>
      <div className={styles.inner}>
        <Stack direction="column" alignItems="stretch" spacing={30}>
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
