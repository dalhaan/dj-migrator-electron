type StructType<Name extends string, Type, Output> = StructObject<
  { [key in Name]: Type } & Output
>;

type StructStringTypes = "ascii" | "utf8" | "latin1" | "utf16be" | "utf16le";

type StructTypes = { [key in StructStringTypes]: string } & {
  uint: number;
  uintbe: number;
  uintle: number;
  uint8: number;
  uint16be: number;
  uint16le: number;
  uint32be: number;
  uint32le: number;
  int: number;
  int8: number;
  int16be: number;
  int16le: number;
  int32be: number;
  int32le: number;
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

declare class StructObject<Output = { offset: number }> {
  private _buffer: Buffer;
  private _root: Root<Output>;
  private _endianness: Endianness;

  endianness(endian: Endianness): StructObject<Output>;

  uint<Name extends string>(
    name: Name,
    options?: OptionsVariableLength<Output> & {
      endianness: Endianness;
    }
  ): StructType<Name, StructTypes["uint"], Output>;

  uint8<Name extends string>(
    name: Name,
    options?: OptionsVariableLength<Output>
  ): StructType<Name, StructTypes["uint8"], Output>;

  ascii<Name extends string>(
    name: Name,
    options?: OptionsVariableLength<Output> & OptionsString
  ): StructType<Name, StructTypes["ascii"], Output>;

  byte<Name extends string, Type extends keyof StructTypes = "uint8">(
    name: Name,
    options?:
      | ({ as?: StructStringTypes } & OptionsVariableLength<Output> &
          OptionsString)
      | ({
          as?: Type;
        } & OptionsVariableLength<Output>)
  ): StructType<Name, StructTypes[Type], Output>;

  parse(): {
    [key in keyof Output]: Output[key];
  };
}

const struct = null as unknown as StructObject;

const a = struct
  .endianness("BE")
  .ascii("type", {
    nullTerminated: true,
  })
  .uint("size")
  .byte("BNum")
  .byte("BStr", {
    as: "ascii",
    nullTerminated: true,
  })
  .ascii("test")
  .parse();

const buf = Buffer.alloc(0);
