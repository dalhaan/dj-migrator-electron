// Camelot wheel HSL adjustments:
// Camelot wheel colours follow the HSL colour wheel but is offset by 180degs and is counter-clockwise.

const offset = 180;
const saturationA = 100;
const saturationB = 100;
const lightnessA = 70;
const lightnessB = 50;
const spacing = -30;

export const KEY_COLOURS = {
  "1A": `hsl(${1 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,
  "2A": `hsl(${2 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,
  "3A": `hsl(${3 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,
  "4A": `hsl(${4 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,
  "5A": `hsl(${5 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,
  "6A": `hsl(${6 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,
  "7A": `hsl(${7 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,
  "8A": `hsl(${8 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,
  "9A": `hsl(${9 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,
  "10A": `hsl(${10 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,
  "11A": `hsl(${11 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,
  "12A": `hsl(${12 * spacing + offset}deg ${saturationA}% ${lightnessA}%)`,

  "1B": `hsl(${1 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
  "2B": `hsl(${2 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
  "3B": `hsl(${3 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
  "4B": `hsl(${4 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
  "5B": `hsl(${5 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
  "6B": `hsl(${6 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
  "7B": `hsl(${7 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
  "8B": `hsl(${8 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
  "9B": `hsl(${9 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
  "10B": `hsl(${10 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
  "11B": `hsl(${11 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
  "12B": `hsl(${12 * spacing + offset}deg ${saturationB}% ${lightnessB}%)`,
};

export const KEY_TO_CAMELOT: Record<string, string> = {
  Abm: "1A",
  "G#m": "1A",
  Ebm: "2A",
  Bbm: "3A",
  Fm: "4A",
  Cm: "5A",
  Gm: "6A",
  Dm: "7A",
  Am: "8A",
  Em: "9A",
  Bm: "10A",
  "F#m": "11A",
  Dbm: "12A",
  "C#m": "12A",

  B: "1B",
  "F#": "2B",
  Db: "3B",
  Ab: "4B",
  Eb: "5B",
  Bb: "6B",
  F: "7B",
  C: "8B",
  G: "9B",
  D: "10B",
  A: "11B",
  E: "12B",
};
