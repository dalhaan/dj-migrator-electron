import { readUint32SyncSafe } from "./utils";

type StructOutput = Record<string, any> & { offset: number };

type StructType<
  Name extends string,
  Type,
  Output extends StructOutput
> = StructObject<{ [key in Name]: Type } & Output>;

type StructStringTypes = "ascii";
type StructFixedSizeTypes = {
  uint8: number;
  uint32be: number;
  usafesyncint32be: number;
};
type StructDynamicSizeTypes = {
  uint: number;
};
// "utf8" |
// "latin1" |
// "utf16be" |
// "utf16le";

type StructTypes = {
  [key in StructStringTypes]: string;
} & StructFixedSizeTypes &
  StructDynamicSizeTypes;
//  {
//     uint: number;
// uintbe: number;
// uintle: number;
// uint8: number;
// uint16be: number;
// uint16le: number;
// uint32be: number;
// uint32le: number;
// usafesyncint32be: number;
// int: number;
// int8: number;
// int16be: number;
// int16le: number;
// int32be: number;
// int32le: number;
// };

type OptionsString = {
  nullTerminated?: boolean;
};

type Endianness = "BE" | "LE";

type Root<Output extends StructOutput> = {
  [Key in keyof Output]: Output[Key];
};

type Size<Output extends StructOutput> =
  | number
  | ((root: Root<Output>) => number);

type OptionsVariableLength<Output extends StructOutput> = {
  size?: Size<Output>;
};

type ByteOptionsFixedSizeTypes = {
  as?: keyof StructFixedSizeTypes;
};

type ByteOptionsDynamicSizeTypes<Output extends StructOutput> = {
  as?: keyof StructDynamicSizeTypes;
} & OptionsVariableLength<Output>;

type ByteOptionsStringTypes<Output extends StructOutput> = {
  as?: StructStringTypes;
} & OptionsVariableLength<Output> &
  OptionsString;

type ByteOptions<Output extends StructOutput> =
  | ByteOptionsFixedSizeTypes
  | ByteOptionsDynamicSizeTypes<Output>
  | ByteOptionsStringTypes<Output>;

type Test<Options extends ByteOptions<{ offset: number }>> = Options extends {
  as: infer Type;
}
  ? Type
  : Buffer;

type No = Test<{}>;

export class StructObject<Output extends StructOutput = { offset: number }> {
  private _buffer: Buffer;
  private _root: Root<Output>;
  private _endianness: Endianness | undefined;
  // private _offset: number;

  constructor(buffer: Buffer, offset = 0) {
    this._buffer = buffer;
    // this._root.offset = offset;
    this._root = { offset } as any;
  }

  calculateSize(options?: OptionsVariableLength<Output>) {
    let size = 1;

    if (typeof options?.size === "function") {
      size = options.size(this._root);
    } else if (typeof options?.size === "number") {
      size = options.size;
    }

    return size;
  }

  endianness(endian: Endianness): StructObject<Output> {
    this._endianness = endian;
    return this;
  }

  uint<Name extends string>(
    name: Name,
    options?: OptionsVariableLength<Output> & {
      endianness?: Endianness;
    }
  ): StructType<Name, StructTypes["uint"], Output> {
    const endianness = options?.endianness || this._endianness;

    const size = this.calculateSize(options);

    if (size > 1 && endianness === undefined) {
      throw new Error("Endianness must be defined when using `uint`");
    }

    if (endianness === "BE") {
      const value = this._buffer.readUIntBE(this._root.offset, size);

      this._root[name] = value as Output[Name];
    } else if (endianness === "LE") {
      const value = this._buffer.readUIntLE(this._root.offset, size);

      this._root[name] = value as Output[Name];
    } else {
      const value = this._buffer.readUInt8(this._root.offset);

      this._root[name] = value as Output[Name];
    }

    this._root.offset += size;

    return this as StructType<Name, StructTypes["uint"], Output>;
  }

  uint8<Name extends string>(
    name: Name
  ): StructType<Name, StructTypes["uint8"], Output> {
    const size = 1;

    const value = this._buffer.readUInt8(this._root.offset);

    this._root[name] = value as Output[Name];

    this._root.offset += size;

    return this as StructType<Name, StructTypes["uint8"], Output>;
  }

  uint32be<Name extends string>(
    name: Name
  ): StructType<Name, StructTypes["uint32be"], Output> {
    const size = 4;

    const value = this._buffer.readUInt32BE(this._root.offset);

    this._root[name] = value as Output[Name];

    this._root.offset += size;

    return this as StructType<Name, StructTypes["uint32be"], Output>;
  }

  usafesyncint32be<Name extends string>(
    name: Name
  ): StructType<Name, StructTypes["usafesyncint32be"], Output> {
    const size = 4;

    const value = readUint32SyncSafe(this._buffer, this._root.offset);

    this._root[name] = value as Output[Name];

    this._root.offset += size;

    return this as StructType<Name, StructTypes["usafesyncint32be"], Output>;
  }

  ascii<Name extends string>(
    name: Name,
    options?: OptionsVariableLength<Output> & OptionsString
  ): StructType<Name, StructTypes["ascii"], Output> {
    const size = this.calculateSize(options);

    if (options?.nullTerminated) {
      const nullIndex = this._buffer.indexOf(0x00, this._root.offset);
      const value = this._buffer
        .subarray(this._root.offset, nullIndex)
        .toString("ascii");

      this._root[name] = value as Output[Name];

      this._root.offset = nullIndex + 1;
    } else {
      const value = this._buffer
        .subarray(this._root.offset, this._root.offset + size)
        .toString("ascii");

      this._root[name] = value as Output[Name];

      this._root.offset += size;
    }

    return this as StructType<Name, StructTypes["ascii"], Output>;
  }

  byte<
    Name extends string,
    Options extends ByteOptions<Output>,
    Type = Options extends { as: infer As extends keyof StructTypes }
      ? StructTypes[As]
      : Options extends { size: Size<Output> }
      ? Buffer
      : number
  >(name: Name, options?: Options): StructType<Name, Type, Output> {
    if (!options || (options && !("as" in options))) {
      let size = 1;

      if (options && "size" in options) {
        size = this.calculateSize(options);

        const value = this._buffer.subarray(
          this._root.offset,
          this._root.offset + size
        );

        this._root[name] = value as Output[Name];
      } else {
        const value = this._buffer.readUInt8(this._root.offset);

        this._root[name] = value as Output[Name];
      }

      this._root.offset += size;
    } else if ("as" in options && options.as) {
      const { as, ...rest } = options;

      this[options.as](name, rest);
    }

    return this;
  }

  parse(): {
    [key in keyof Output]: Output[key];
  } {
    const rootCopy = { ...this._root };

    // Reset root and retain offset
    this._root = { offset: this._root.offset } as any;

    return rootCopy;
  }
}

export function struct(buffer: Buffer) {
  return new StructObject(buffer);
}

// struct(Buffer.alloc(0)).uint("test", {
//   size: 5,
// });
