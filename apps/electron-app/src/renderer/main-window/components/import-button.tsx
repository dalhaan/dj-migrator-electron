import { Icon } from "@rsuite/icons";
import { MdDownload } from "react-icons/md";
import { IconButton } from "rsuite";

export function ImportButton() {
  return (
    <IconButton
      icon={<Icon as={MdDownload} />}
      placement="right"
      appearance="primary"
      onClick={() => {
        window.electronAPI.openImportWindow();
      }}
    >
      Import
    </IconButton>
  );
}
