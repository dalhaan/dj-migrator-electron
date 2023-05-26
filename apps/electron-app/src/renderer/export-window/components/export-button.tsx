import { Icon } from "@rsuite/icons";
import { useState } from "react";
import { MdUpload } from "react-icons/md";
import { IconButton } from "rsuite";

import { useExport } from "../stores/export-store";

import { ALL_PLAYLISTS_SELECTED } from "./export-crate-tree";

import { useLibrary } from "@/stores/libraryStore";

export function ExportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const playlists = useLibrary((state) => state.playlists);
  const selectedPlaylists = useExport((state) => state.selectedPlaylists);

  async function handleClick() {
    if (selectedPlaylists.length === 0 || playlists.length === 0) return;

    setIsLoading(true);

    try {
      const outputPath = await window.electronAPI.openSaveFileDialog({
        defaultPath: "RekordboxCollection.xml",
        filters: [
          {
            name: "XML",
            extensions: [".xml"],
          },
        ],
      });

      if (!outputPath) return;

      const playlistsToExport =
        selectedPlaylists[0] === ALL_PLAYLISTS_SELECTED
          ? playlists.map((playlist) => playlist.name)
          : selectedPlaylists;

      await window.electronAPI.exportPlaylistsToRekordBoxXml(
        playlistsToExport,
        outputPath,
        {
          saveCuesAsHotCues: true,
          saveCuesAsMemoryCues: true,
        }
      );

      // Close window once exporting is complete
      window.close();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <IconButton
      icon={<Icon as={MdUpload} />}
      placement="right"
      appearance="primary"
      loading={isLoading}
      disabled={selectedPlaylists.length === 0}
      onClick={handleClick}
    >
      Export
    </IconButton>
  );
}
