import assert from "assert";
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
  uint16be: number;
  uint32be: number;
  usyncsafeint32be: number;
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
// usyncsafeint32be: number;
// int: number;
// int8: number;
// int16be: number;
// int16le: number;
// int32be: number;
// int32le: number;
// };

type Endianness = "BE" | "LE";

type Root<Output extends StructOutput> = {
  [Key in keyof Output]: Output[Key];
};

type Size<Output extends StructOutput> =
  | number
  | ((root: Root<Output>) => number)
  | "EOS";

type OptionsBase<Output extends StructOutput, ParsedType> = {
  peek?: number | ((root: Root<Output>) => number);
  /**
   * Runtime assertion of parsed value.
   */
  assert?: ParsedType;
};

type OptionsString = {
  nullTerminated?: boolean;
};

type OptionsVariableLength<Output extends StructOutput> = {
  size?: Size<Output>;
};

type ByteOptionsFixedSizeTypes<
  Output extends StructOutput,
  As extends keyof StructFixedSizeTypes = keyof StructFixedSizeTypes
> = OptionsBase<Output, StructFixedSizeTypes[As]> & {
  as?: keyof StructFixedSizeTypes;
};

type ByteOptionsDynamicSizeTypes<
  Output extends StructOutput,
  As extends keyof StructDynamicSizeTypes = keyof StructDynamicSizeTypes
> = {
  as?: As;
} & OptionsBase<Output, StructDynamicSizeTypes[As]> &
  OptionsVariableLength<Output>;

type ByteOptionsStringTypes<Output extends StructOutput> = {
  as?: StructStringTypes;
} & OptionsBase<Output, string> &
  OptionsVariableLength<Output> &
  OptionsString;

type ByteOptions<Output extends StructOutput> =
  | ByteOptionsFixedSizeTypes<Output>
  | ByteOptionsDynamicSizeTypes<Output>
  | ByteOptionsStringTypes<Output>;

export class StructObject<Output extends StructOutput = { offset: number }> {
  private _buffer: Buffer;
  private _root: Root<Output>;
  private _endianness: Endianness | undefined;
  // private _offset: number;

  constructor(buffer: Buffer, offset = 0) {
    this._buffer = buffer;
    this._root = { offset } as Root<Output>;
  }

  calculateSize(options?: OptionsVariableLength<Output>) {
    let size = 1;

    if (typeof options?.size === "function") {
      size = options.size(this._root);
    } else if (typeof options?.size === "number") {
      size = options.size;
    } else if (options?.size === "EOS") {
      size = this._buffer.length - this._root.offset;
    }

    return size;
  }

  calculateOffset(options?: Pick<OptionsBase<Output, any>, "peek">) {
    let offset = this._root.offset;

    if (typeof options?.peek === "function") {
      offset = options.peek(this._root);
    } else if (typeof options?.peek === "number") {
      offset = options.peek;
    }

    return offset;
  }

  endianness(endian: Endianness): StructObject<Output> {
    this._endianness = endian;
    return this;
  }

  uint<Name extends string>(
    name: Name,
    options?: OptionsBase<Output, number> &
      OptionsVariableLength<Output> & {
        endianness?: Endianness;
      }
  ): StructType<Name, StructTypes["uint"], Output> {
    let value: number | undefined;

    const size = this.calculateSize(options);
    const offset = this.calculateOffset(options);

    const endianness = options?.endianness || this._endianness;

    if (size > 1 && endianness === undefined) {
      throw new Error("Endianness must be defined when using `uint`");
    }

    if (endianness === "BE") {
      value = this._buffer.readUIntBE(offset, size);
    } else if (endianness === "LE") {
      value = this._buffer.readUIntLE(offset, size);
    } else {
      value = this._buffer.readUInt8(offset);
    }

    if (options?.assert) {
      assert.strictEqual(
        value,
        options.assert,
        `${name} !== ${options.assert}`
      );
    }

    this._root[name] = value as Output[Name];

    if (options?.peek === undefined) {
      this._root.offset += size;
    }

    return this as StructType<Name, StructTypes["uint"], Output>;
  }

  uint8<Name extends string>(
    name: Name,
    options?: OptionsBase<Output, number>
  ): StructType<Name, StructTypes["uint8"], Output> {
    const size = 1;
    const offset = this.calculateOffset(options);

    const value = this._buffer.readUInt8(offset);

    if (options?.assert) {
      assert.strictEqual(
        value,
        options.assert,
        `${name} !== ${options.assert}`
      );
    }

    this._root[name] = value as Output[Name];

    if (options?.peek === undefined) {
      this._root.offset += size;
    }

    return this as StructType<Name, StructTypes["uint8"], Output>;
  }

  uint16be<Name extends string>(
    name: Name,
    options?: OptionsBase<Output, number>
  ): StructType<Name, StructTypes["uint16be"], Output> {
    const size = 2;
    const offset = this.calculateOffset(options);

    const value = this._buffer.readUInt16BE(offset);

    if (options?.assert) {
      assert.strictEqual(
        value,
        options.assert,
        `${name} !== ${options.assert}`
      );
    }

    this._root[name] = value as Output[Name];

    if (options?.peek === undefined) {
      this._root.offset += size;
    }

    return this as StructType<Name, StructTypes["uint16be"], Output>;
  }

  uint32be<Name extends string>(
    name: Name,
    options?: OptionsBase<Output, number>
  ): StructType<Name, StructTypes["uint32be"], Output> {
    const size = 4;
    const offset = this.calculateOffset(options);

    const value = this._buffer.readUInt32BE(offset);

    if (options?.assert) {
      assert.strictEqual(
        value,
        options.assert,
        `${name} !== ${options.assert}`
      );
    }

    this._root[name] = value as Output[Name];

    if (options?.peek === undefined) {
      this._root.offset += size;
    }

    return this as StructType<Name, StructTypes["uint32be"], Output>;
  }

  usyncsafeint32be<Name extends string>(
    name: Name,
    options?: OptionsBase<Output, number>
  ): StructType<Name, StructTypes["usyncsafeint32be"], Output> {
    const size = 4;
    const offset = this.calculateOffset(options);

    const value = readUint32SyncSafe(this._buffer, offset);

    if (options?.assert) {
      assert.strictEqual(
        value,
        options.assert,
        `${name} !== ${options.assert}`
      );
    }

    this._root[name] = value as Output[Name];

    if (options?.peek === undefined) {
      this._root.offset += size;
    }

    return this as StructType<Name, StructTypes["usyncsafeint32be"], Output>;
  }

  ascii<Name extends string>(
    name: Name,
    options?: OptionsBase<Output, string> &
      OptionsVariableLength<Output> &
      OptionsString
  ): StructType<Name, StructTypes["ascii"], Output> {
    let value: string | undefined;

    const size = this.calculateSize(options);
    const offset = this.calculateOffset(options);

    if (options?.nullTerminated) {
      const nullIndex = this._buffer.indexOf(0x00, offset);
      value = this._buffer.subarray(offset, nullIndex).toString("ascii");

      this._root[name] = value as Output[Name];

      if (options.peek === undefined) {
        this._root.offset = nullIndex + 1;
      }
    } else {
      value = this._buffer.subarray(offset, offset + size).toString("ascii");

      this._root[name] = value as Output[Name];

      if (options?.peek === undefined) {
        this._root.offset += size;
      }
    }

    if (options?.assert) {
      assert.strictEqual(
        value,
        options.assert,
        `${name} !== ${options.assert}`
      );
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
    const offset = this.calculateOffset(options);

    if (!options || (options && !("as" in options))) {
      let size = 1;

      if (options && "size" in options) {
        size = this.calculateSize(options);

        const value = this._buffer.subarray(offset, offset + size);

        this._root[name] = value as Output[Name];
      } else {
        const value = this._buffer.readUInt8(offset);

        this._root[name] = value as Output[Name];
      }

      if (options?.peek === undefined) {
        this._root.offset += size;
      }
    } else if ("as" in options && options.as) {
      const { as, ...rest } = options;

      this[options.as](name, rest as any);
    }

    return this;
  }

  parse(): {
    [key in keyof Output]: Output[key];
  } {
    const rootCopy = { ...this._root };

    // Reset root and retain offset
    this._root = { offset: this._root.offset } as Output;

    return rootCopy;
  }
}

export function struct(buffer: Buffer) {
  return new StructObject(buffer);
}

// struct(Buffer.alloc(0)).uint("test", {
//   size: 5,
// });
