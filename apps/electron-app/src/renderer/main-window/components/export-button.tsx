import { Icon } from "@rsuite/icons";
import { MdUpload } from "react-icons/md";
import { IconButton } from "rsuite";

import { useLibrary } from "@/stores/libraryStore";

export function ExportButton() {
  const playlists = useLibrary((state) => state.playlists);

  return (
    <IconButton
      icon={<Icon as={MdUpload} />}
      placement="right"
      disabled={playlists.length === 0}
      onClick={() => {
        window.electronAPI.openExportWindow();
      }}
    >
      Export
    </IconButton>
  );
}
