import { Icon } from "@rsuite/icons";
import { ImFolderOpen } from "react-icons/im";
import { IconButton } from "rsuite";

import { useImport } from "../../stores/import-store";

import * as styles from "./directory-select.css";

import { parseIpcResponse } from "@/utils/ipc";

export function DirectorySelect() {
  const directory = useImport((state) => state.directory);

  /**
   * Prompt user to select Serato dir and update store with the found crates
   */
  async function onSelect() {
    try {
      const directory = await window.electronAPI.openDirectoryDialog();

      if (!directory) return;

      const crates = parseIpcResponse(
        await window.electronAPI.findCrates(directory)
      );

      // Update store with found crates
      useImport.getState().setCrates(crates);
      useImport.getState().setDirectory(directory);
    } catch (error) {
      // Reset state on error
      useImport.getState().reset();
    }
  }
  return (
    <IconButton
      className={styles.directorySelect}
      icon={<Icon as={ImFolderOpen} />}
      appearance="ghost"
      placement="right"
      block
      onClick={onSelect}
    >
      <span>{directory || "Select directory"}</span>
    </IconButton>
  );
}
