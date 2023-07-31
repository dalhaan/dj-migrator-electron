type StructType<Name extends string, Type, Output> = StructObject<
  { [key in Name]: Type } & Output
>;

type StructStringTypes = "ascii";
// "utf8" |
// "latin1" |
// "utf16be" |
// "utf16le";

type StructTypes = { [key in StructStringTypes]: string } & {
  uint: number;
  // uintbe: number;
  // uintle: number;
  uint8: number;
  // uint16be: number;
  // uint16le: number;
  // uint32be: number;
  // uint32le: number;
  // int: number;
  // int8: number;
  // int16be: number;
  // int16le: number;
  // int32be: number;
  // int32le: number;
};

type OptionsString = {
  nullTerminated?: boolean;
};

type Endianness = "BE" | "LE";

type Root<Output> = {
  [Key in keyof Output]: Output[Key];
};

type OptionsVariableLength<Output> = {
  size?: number | ((root: Root<Output>) => number);
};

export class StructObject<Output = { offset: number }> {
  private _buffer: Buffer;
  private _root: Root<Output>;
  private _endianness: Endianness | undefined;
  private _offset: number;

  constructor(buffer: Buffer, offset = 0) {
    this._buffer = buffer;
    this._offset = offset;
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
    if (endianness === undefined) {
      throw new Error("Endianness must be defined when using `uint`");
    }

    const size = this.calculateSize(options);

    if (endianness === "BE") {
      const value = this._buffer.readUIntBE(this._offset, size);
      // @ts-expect-error This is valid
      this._root[name] = value;
    } else if (endianness === "LE") {
      const value = this._buffer.readUIntLE(this._offset, size);
      // @ts-expect-error This is valid
      this._root[name] = value;
    }

    this._offset += size;

    return this as StructType<Name, StructTypes["uint"], Output>;
  }

  uint8<Name extends string>(
    name: Name
  ): StructType<Name, StructTypes["uint8"], Output> {
    const size = 1;

    const value = this._buffer.readUInt8(this._offset);

    // @ts-expect-error This is valid
    this._root[name] = value;

    this._offset += size;

    return this as StructType<Name, StructTypes["uint8"], Output>;
  }

  ascii<Name extends string>(
    name: Name,
    options?: OptionsVariableLength<Output> & OptionsString
  ): StructType<Name, StructTypes["ascii"], Output> {
    const size = this.calculateSize(options);

    if (options?.nullTerminated) {
      const nullIndex = this._buffer.indexOf(0x00, this._offset);
      const value = this._buffer.subarray(this._offset, nullIndex);

      // @ts-expect-error This is valid
      this._root[name] = value;

      this._offset = nullIndex + 1;
    } else {
      const value = this._buffer.subarray(this._offset, size);

      // @ts-expect-error This is valid
      this._root[name] = value;

      this._offset += size;
    }

    return this as StructType<Name, StructTypes["ascii"], Output>;
  }

  byte<Name extends string, Type extends keyof StructTypes = "uint8">(
    name: Name,
    options?:
      | ({ as?: StructStringTypes } & OptionsVariableLength<Output> &
          OptionsString)
      | ({
          as?: Type;
        } & OptionsVariableLength<Output>)
  ): StructType<Name, StructTypes[Type], Output> {
    const size = this.calculateSize(options);

    if (!options?.as) {
      const value = this._buffer.subarray(this._offset, this._offset + size);
      // @ts-expect-error This is valid
      this._root[name] = value;

      this._offset += size;
    } else {
      const { as, ...rest } = options;

      this[options.as](name, rest);
    }

    return this as StructType<Name, StructTypes[Type], Output>;
  }

  parse(): {
    [key in keyof Output]: Output[key];
  } {
    return this._root;
  }
}

export function struct(buffer: Buffer) {
  return new StructObject(buffer);
}
