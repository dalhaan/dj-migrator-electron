import { Playlist } from "@dj-migrator/common";
import { Icon } from "@rsuite/icons";
import { BsFillBoxFill } from "react-icons/bs";
import { Nav, Panel, Sidenav } from "rsuite";

import * as styles from "./playlist-panel.css";

import { useLibrary, useMainStore } from "@/stores/libraryStore";

export function PlaylistPanel() {
  const selectedPlaylist = useMainStore((state) => state.selectedPlaylist);

  const playlists = useLibrary((state) => state.playlists);

  function handleCrateClick(playlist: Playlist) {
    useMainStore.getState().setSelectedPlaylist(playlist);
  }

  return (
    <Panel className={styles.playlistPanel} bordered bodyFill>
      <Sidenav defaultOpenKeys={["playlists"]} appearance="subtle">
        <Sidenav.Body>
          <Nav activeKey={selectedPlaylist?.name}>
            <Nav.Menu
              eventKey="playlists"
              title={`Playlists (${playlists.length})`}
              icon={<Icon as={BsFillBoxFill} />}
            >
              {playlists.map((playlist) => (
                <Nav.Item
                  key={`SeratoCrateSidenav:${playlist.name}`}
                  eventKey={playlist.name}
                  onSelect={() => handleCrateClick(playlist)}
                >
                  {playlist.name} ({playlist.tracks.length})
                </Nav.Item>
              ))}
            </Nav.Menu>
          </Nav>
        </Sidenav.Body>
      </Sidenav>
    </Panel>
  );
}
