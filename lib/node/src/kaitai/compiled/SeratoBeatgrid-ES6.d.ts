export default class SeratoBeatgrid {
  static Header: typeof Header;
  static NonTerminalMarker: typeof NonTerminalMarker;
  static TerminalMarker: typeof TerminalMarker;

  header: Header;
  nonTerminalMarkers?: NonTerminalMarker[];
  terminalMarker?: TerminalMarker;
  footer: number;

  constructor(stream: any);
}

class Header {
  magic: [number, number];
  noMarkers: number;

  constructor(...args: any);
}

class NonTerminalMarker {
  position: number;
  beatsUntilNextMarker: number;

  constructor(...args: any);
}

class TerminalMarker {
  position: number;
  bpm: number;

  constructor(...args: any);
}
