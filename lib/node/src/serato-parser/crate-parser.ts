import fs from "fs";
import path from "path";
import assert from "assert";
import { IPlaylist } from "@dj-migrator/common";
import { parseSeratoCrate } from "./parseSeratoCrate";

export function parseTrackNames(cratePath: string): string[] {
  // Assert the crate is valid
  const isValidCratePath = path.extname(cratePath) === ".crate";
  assert(
    isValidCratePath,
    `'${cratePath}' is not a valid crate. It must end in '.crate'`
  );

  const buffer = fs.readFileSync(cratePath);

  return parseSeratoCrate(buffer);
}

export function parseAsPlaylist(cratePath: string): IPlaylist {
  const playlist: IPlaylist = {
    name: path.basename(cratePath, path.extname(cratePath)),
    tracks: parseTrackNames(cratePath),
  };

  return playlist;
}
