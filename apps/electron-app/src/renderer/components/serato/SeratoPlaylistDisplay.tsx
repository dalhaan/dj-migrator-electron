import { Icon } from "@rsuite/icons";
import { BsFillBoxFill } from "react-icons/bs";
import { Nav } from "rsuite";

import { useSerato } from "@/stores/seratoStore";

export function SeratoPlaylistsDisplay() {
  const crates = useSerato((state) => state.crates);

  return (
    <Nav.Menu
      eventKey="SeratoCrates"
      title={`Serato Crates (${crates.length})`}
      icon={<Icon as={BsFillBoxFill} />}
    >
      {crates.map((crate) => (
        <Nav.Item key={`SeratoCrateSidenav:${crate}`} eventKey={crate}>
          {crate}
        </Nav.Item>
      ))}
    </Nav.Menu>
  );
}
