import { Button } from "rsuite";

export function CancelButton() {
  function handleClick() {
    window.close();
  }

  return (
    <Button appearance="subtle" onClick={handleClick}>
      Cancel
    </Button>
  );
}
