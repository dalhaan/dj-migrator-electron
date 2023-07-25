export function toSynch(input: number) {
  let out = 0;
  let mask = 0x7f;
  while (mask ^ 0x7fffffff) {
    out = input & ~mask;
    out = out << 1;
    out = out | (input & mask);
    mask = ((mask + 1) << 8) - 1;
    input = out;
  }
  return out;
}

/**
 * Gets the "synch" representation of a number
 * @param num Number to convert
 */
export function getSynch(num: number): number {
  let out = 0;
  let mask = 0x7f000000;

  while (mask) {
    out >>= 1;
    out |= num & mask;
    mask >>= 8;
  }

  return out;
}

/**
 * Gets a "synch2 uint8 from a view
 * @param view View to read
 * @param offset Offset to read from
 */
export function readUint8SyncSafe(view: Buffer, offset: number = 0): number {
  return getSynch(view.readUInt8(offset));
}

/**
 * Gets a "synch2 uint32 from a view
 * @param view View to read
 * @param offset Offset to read from
 */
export function readUint32SyncSafe(view: Buffer, offset: number = 0): number {
  return getSynch(view.readUint32BE(offset));
}

/**
 *
 * Writes value to buf at the specified offset as Sync Safe big-endian. The value
 * must be a valid unsigned 32-bit integer. Behavior is undefined when value
 * is anything other than an unsigned 32-bit integer.
 *
 * @param buffer - Buffer to write number to.
 * @param value Number to be written to `buffer`.
 * @param offset Number of bytes to skip before starting to write. Must satisfy 0 <= `offset` <= `buffer`.length - 4.
 * @returns `offset` plus the number of bytes written.
 */
export function writeUInt32SyncSafeBE(
  buffer: Buffer,
  value: number,
  offset: number = 0
): number {
  return buffer.writeUInt32BE(toSynch(value), offset);
}

export function base64Encode(buffer: Buffer): Buffer {
  const lineLength = 72;

  const lines: string[] = [];
  let remainder = buffer.toString("base64");
  while (remainder) {
    const line = remainder.slice(0, lineLength);
    lines.push(line);
    remainder = remainder.slice(lineLength);
  }

  const encoded = lines.join("\n");
  const encodedBuffer = Buffer.from(encoded, "ascii");

  const magic = Buffer.from([0x01, 0x01]);

  return Buffer.concat([magic, encodedBuffer]);
}
