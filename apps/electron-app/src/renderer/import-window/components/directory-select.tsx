import { Icon } from "@rsuite/icons";
import { ImFolderOpen } from "react-icons/im";
import { Input, InputGroup } from "rsuite";

import { useImport } from "../stores/import-store";

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
      useImport.getState().setCrates([]);
      useImport.getState().setDirectory(null);
    }
  }
  return (
    <InputGroup>
      <Input value={directory || ""} />
      <InputGroup.Button onClick={onSelect}>
        <Icon as={ImFolderOpen} />
      </InputGroup.Button>
    </InputGroup>
  );
}
