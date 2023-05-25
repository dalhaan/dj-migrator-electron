import { Icon } from "@rsuite/icons";
import { useState } from "react";
import { ImFolderOpen } from "react-icons/im";
import { Input, InputGroup } from "rsuite";

import { useImport } from "../stores/import-store";

import { parseIpcResponse } from "@/utils/ipc";

export function DirectorySelect() {
  const [directory, setDirectory] = useState<string | null>(null);

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
      setDirectory(directory);
    } catch (error) {
      // Reset state on error
      useImport.getState().setCrates([]);
      setDirectory(null);
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
