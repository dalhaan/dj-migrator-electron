/**
 * Converts a decimal to a hex string.
 * Hex strings are trimmed by default so the hex string
 * is padded with "0"s to ensure it is a full byte.
 */
export function decimalToHex(decimal: number) {
  return decimal.toString(16).padStart(2, "0");
}

/**
 * Converts RGB color to hex color.
 *
 * @param red - red component 0-255
 * @param green - green component 0-255
 * @param blue  - blue component 0-255
 */
export function rbgToHex(red: number, green: number, blue: number) {
  return `#${decimalToHex(red)}${decimalToHex(green)}${decimalToHex(blue)}`;
}
