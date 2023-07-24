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
