import { IPlaylist, Track } from "@dj-migrator/common";
import { Icon } from "@rsuite/icons";
import { BsFillBoxFill } from "react-icons/bs";
import { Nav } from "rsuite";

import { useLibrary } from "@/stores/libraryStore";
import { useSerato } from "@/stores/seratoStore";

export function SeratoPlaylistsDisplay() {
  const library = useSerato((state) => state.library);

  console.log(library);

  function handleCrateClick(playlist: IPlaylist) {
    console.log("selected", playlist);
    useLibrary
      .getState()
      .setTracks(
        playlist.tracks
          .map((track) => library?.trackMap[track]?.track)
          .filter((track) => Boolean(track)) as Track[]
      );
  }

  return (
    <Nav.Menu
      eventKey="SeratoCrates"
      title={`Serato Crates (${library?.playlists.length})`}
      icon={<Icon as={BsFillBoxFill} />}
    >
      {library?.playlists.map((library) => (
        <Nav.Item
          key={`SeratoCrateSidenav:${library.name}`}
          eventKey={library.name}
          onClick={() => handleCrateClick(library)}
        >
          {library.name} ({library.tracks.length})
        </Nav.Item>
      ))}
    </Nav.Menu>
  );
}
