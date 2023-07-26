import { ID3Frame } from "./id3-frame";

export class RemovedFrame extends ID3Frame {
  constructor() {
    super("RMVD", 0, 0);
  }

  static parse(buffer: Buffer, id3Version: number, frameOffset?: number) {
    return new RemovedFrame();
  }

  serialize(id3Version: number) {
    return Buffer.alloc(0);
  }
}
