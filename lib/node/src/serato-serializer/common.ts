export const NULL_BYTE = new Uint8Array([0x00]);

export interface Serializable {
  serialize(): Buffer;
}
