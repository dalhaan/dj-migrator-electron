import { readUint32SyncSafe } from "./utils";

type VariableSizeType = {
  ascii: string;
  latin1: string;
  ucs2: string;
  hex: string;
  base64: string;
  utf8: string;
  utf16le: string;
  utf16be: string;
  uintbe: number;
  uintle: number;
  intbe: number;
  intle: number;
  B: Buffer;
};

type FixedSizeType = {
  ascii: string;
  latin1: string;
  ucs2: string;
  hex: string;
  base64: string;
  utf8: string;
  utf16le: string;
  utf16be: string;
  uintbe: number;
  uintle: number;
  uint8: number;
  uint16be: number;
  uint16le: number;
  uint32be: number;
  uint32le: number;
  intbe: number;
  intle: number;
  int8: number;
  int16be: number;
  int16le: number;
  int32be: number;
  int32le: number;
  usyncsafeint32be: number;
  floatbe: number;
  floatle: number;
  doublebe: number;
  doublele: number;
  B: number;
};

type TupleType = ReadonlyArray<
  keyof FixedSizeType | Readonly<[keyof VariableSizeType, number]>
>;

type PropsToType<Tuple extends TupleType> = {
  [key in keyof Tuple]: Tuple[key] extends keyof FixedSizeType
    ? FixedSizeType[Tuple[key]]
    : Tuple[key][0] extends keyof VariableSizeType
    ? VariableSizeType[Tuple[key][0]]
    : never;
};

export function struct<const Tuple extends TupleType>(
  buffer: Buffer,
  props: Tuple,
  offset = 0
): [...PropsToType<Tuple>, number] {
  const values: (
    | VariableSizeType[keyof VariableSizeType]
    | FixedSizeType[keyof FixedSizeType]
  )[] = [];

  for (const prop of props) {
    const isVariable = Array.isArray(prop);

    switch (isVariable ? prop[0] : prop) {
      case "uint8": {
        values.push(buffer.readUInt8(offset));
        offset += 1;
        break;
      }
      case "uint16be": {
        values.push(buffer.readUInt16BE(offset));
        offset += 2;
        break;
      }
      case "uint16le": {
        values.push(buffer.readUInt16LE(offset));
        offset += 2;
        break;
      }
      case "uint32be": {
        values.push(buffer.readUInt32BE(offset));
        offset += 4;
        break;
      }
      case "uint32le": {
        values.push(buffer.readUInt32LE(offset));
        offset += 4;
        break;
      }
      case "int8": {
        values.push(buffer.readInt8(offset));
        offset += 1;
        break;
      }
      case "int16be": {
        values.push(buffer.readInt16BE(offset));
        offset += 2;
        break;
      }
      case "int16le": {
        values.push(buffer.readInt16LE(offset));
        offset += 2;
        break;
      }
      case "int32be": {
        values.push(buffer.readInt32BE(offset));
        offset += 4;
        break;
      }
      case "int32le": {
        values.push(buffer.readInt32LE(offset));
        offset += 4;
        break;
      }
      case "usyncsafeint32be": {
        values.push(readUint32SyncSafe(buffer, offset));
        offset += 4;
        break;
      }
      case "floatbe": {
        values.push(buffer.readFloatBE(offset));
        offset += 4;
        break;
      }
      case "floatle": {
        values.push(buffer.readFloatLE(offset));
        offset += 4;
        break;
      }
      case "doublebe": {
        values.push(buffer.readDoubleBE(offset));
        offset += 8;
        break;
      }
      case "doublele": {
        values.push(buffer.readDoubleLE(offset));
        offset += 8;
        break;
      }
      case "ascii": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(buffer.subarray(offset, offset + length).toString("ascii"));
        offset += length;

        break;
      }
      case "latin1": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(
          buffer.subarray(offset, offset + length).toString("latin1")
        );
        offset += length;

        break;
      }
      case "ucs2": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(buffer.subarray(offset, offset + length).toString("ucs2"));
        offset += length;

        break;
      }
      case "hex": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(buffer.subarray(offset, offset + length).toString("hex"));
        offset += length;

        break;
      }
      case "base64": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(
          buffer.subarray(offset, offset + length).toString("base64")
        );
        offset += length;

        break;
      }

      case "utf8": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(buffer.subarray(offset, offset + length).toString("utf8"));
        offset += length;

        break;
      }
      case "utf16be": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(
          buffer
            .subarray(offset, offset + length)
            .swap16()
            .toString("utf16le")
        );
        offset += length;

        break;
      }
      case "utf16le": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(
          buffer.subarray(offset, offset + length).toString("utf16le")
        );
        offset += length;

        break;
      }
      case "uintbe": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(buffer.readUIntBE(offset, length));
        offset += length;

        break;
      }
      case "uintle": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(buffer.readUIntLE(offset, length));
        offset += length;

        break;
      }
      case "intbe": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(buffer.readIntBE(offset, length));
        offset += length;

        break;
      }
      case "intle": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
        }

        values.push(buffer.readIntLE(offset, length));
        offset += length;

        break;
      }

      case "B": {
        let length = 1;

        if (Array.isArray(prop)) {
          length = prop[1];
          values.push(buffer.subarray(offset, offset + length));
        } else {
          const byte = buffer.at(offset);
          if (byte === undefined) throw new Error();
          values.push(byte);
        }

        offset += length;

        break;
      }
    }
  }

  values.push(offset);

  return values as any;
}
