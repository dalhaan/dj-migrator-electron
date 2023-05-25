import { Icon } from "@rsuite/icons";
import { ImFolderOpen } from "react-icons/im";
import { Input, InputGroup } from "rsuite";

export function DirectorySelect() {
  return (
    <InputGroup>
      <Input />
      <InputGroup.Button>
        <Icon as={ImFolderOpen} />
      </InputGroup.Button>
    </InputGroup>
  );
}
