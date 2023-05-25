import { Icon } from "@rsuite/icons";
import { ImFolderOpen } from "react-icons/im";
import { Input, InputGroup } from "rsuite";

import { useImport } from "../stores/import-store";

import { parseIpcResponse } from "@/utils/ipc";

export function DirectorySelect() {
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

      const crateNames = crates.map((crate) => crate.name);

      // Update store with found crates
      useImport.getState().setCrates(crateNames);
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <InputGroup>
      <Input />
      <InputGroup.Button onClick={onSelect}>
        <Icon as={ImFolderOpen} />
      </InputGroup.Button>
    </InputGroup>
  );
}
