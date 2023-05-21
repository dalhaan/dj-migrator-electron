import { Nav, Panel, Sidenav } from "rsuite";

import * as styles from "./playlist-panel.css";

import { SeratoPlaylistsDisplay } from "@/components/serato/SeratoPlaylistDisplay";

export function PlaylistPanel() {
  return (
    <Panel className={styles.playlistPanel} bordered>
      <Sidenav defaultOpenKeys={["SeratoCrates"]}>
        <Sidenav.Body>
          <Nav>
            <SeratoPlaylistsDisplay />
          </Nav>
        </Sidenav.Body>
      </Sidenav>
    </Panel>
  );
}
