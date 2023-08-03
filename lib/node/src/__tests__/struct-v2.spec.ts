import { StructObject, struct } from "../structv2";

test("Struct V2 - calculate size", () => {
  const buf = Buffer.from("HelloTheMate", "ascii");

  const st = struct(buf)
    .ascii("hello", {
      size: 5,
    })
    .ascii("the", {
      size: 3,
    })
    .ascii("mate", {
      size: "EOS",
    });

  const helloSize = st.calculateSize({ size: (root) => root.hello.length });
  const theSize = st.calculateSize({ size: (root) => root.the.length });
  const mateSize = st.calculateSize({ size: (root) => root.mate.length });
  const fixedSize = st.calculateSize({ size: 10 });
  const defaultSize = st.calculateSize();

  expect(helloSize).toEqual(5);
  expect(theSize).toEqual(3);
  expect(mateSize).toEqual(4);
  expect(fixedSize).toEqual(10);
  expect(defaultSize).toEqual(1);
});

test("Struct V2 - ascii", () => {
  const buf = Buffer.from("HelloThereMate", "ascii");

  // Size

  const { hello, there, mate, offset } = struct(buf)
    .ascii("hello", {
      size: 5,
    })
    .ascii("there", {
      size: (root) => root.hello.length,
    })
    .ascii("mate", {
      size: "EOS",
    })
    .parse();

  expect(hello).toEqual("Hello");
  expect(there).toEqual("There");
  expect(mate).toEqual("Mate");
  expect(offset).toEqual(14);
});

test("Struct V2 - uint8", () => {
  const buf = Buffer.from([0x1, 0x2, 0x3, 0x4]);

  const { first, second, third, fourth, offset } = struct(buf)
    .uint8("first")
    .uint8("second")
    .uint8("third")
    .uint8("fourth")
    .parse();

  expect(first).toEqual(1);
  expect(second).toEqual(2);
  expect(third).toEqual(3);
  expect(fourth).toEqual(4);
  expect(offset).toEqual(4);
});

test("Struct V2 - uint", () => {
  const buf = Buffer.from([0x00, 0x02, 0xc8, 0x64, 0x00, 0x04]);

  const { first, second, third, fourth, offset } = struct(buf)
    .uint("first")
    .uint("second", {
      endianness: "BE",
      size: 2,
    })
    .uint("third", {
      endianness: "LE",
      size: 2,
    })
    .uint("fourth")
    .parse();

  expect(first).toEqual(0x00);
  expect(second).toEqual(0x02c8);
  expect(third).toEqual(0x0064);
  expect(fourth).toEqual(0x04);
  expect(offset).toEqual(6);

  const { firstBE, secondLE, thirdBE } = struct(buf)
    .endianness("BE")
    .uint("firstBE", {
      size: 2,
    })
    .uint("secondLE", {
      size: (root) => root.firstBE,
      endianness: "LE",
    })
    .uint("thirdBE", {
      size: 2,
    })
    .parse();

  expect(firstBE).toEqual(0x0002);
  expect(secondLE).toEqual(0x64c8);
  expect(thirdBE).toEqual(0x0004);
  // uint with size > 1 needs to have endianness defined
  expect(() => struct(buf).uint("throwMe", { size: 2 }).parse()).toThrow();

  // Assert

  expect(() =>
    struct(buf)
      .uint("firstAssert", {
        assert: 0x00,
      })
      .uint("secondAssert", {
        endianness: "BE",
        size: 2,
        assert: 0x02c8,
      })
      .uint("thirdAssert", {
        endianness: "BE",
        size: "EOS",
        assert: 0x640004,
      })
      .parse()
  ).not.toThrow();

  expect(() =>
    struct(buf)
      .uint("firstAssert", {
        assert: 0xff,
      })
      .parse()
  ).toThrow();
});

test("Struct V2 - peek", () => {
  const buf = Buffer.from([0x48, 0x45, 0x59, 0x54, 0x48, 0x45, 0x52, 0x45]);

  const { hey, eyt, there, heythere, offset } = struct(buf)
    .ascii("hey", {
      size: 3,
      peek: 0,
    })
    .ascii("eyt", {
      size: 3,
      peek: (_root) => _root.offset + 1,
    })
    .ascii("there", {
      size: 5,
      peek: 3,
    })
    .ascii("heythere", {
      size: 8,
    })
    .parse();

  expect(hey).toEqual("HEY");
  expect(eyt).toEqual("EYT");
  expect(there).toEqual("THERE");
  expect(heythere).toEqual("HEYTHERE");
  expect(offset).toEqual(8);
});

test("Struct V2 - retain index on extra structs", () => {
  const buf = Buffer.from([0x48, 0x45, 0x59, 0x54, 0x48, 0x45, 0x52, 0x45]);

  const testStruct = new StructObject(buf);
  const { hey, offset: offset1 } = testStruct
    .ascii("hey", {
      size: 3,
    })
    .parse();

  const { there, offset: offset2 } = testStruct
    .ascii("there", { size: 5 })
    .parse();

  expect(hey).toEqual("HEY");
  expect(there).toEqual("THERE");
  expect(offset1).toEqual(3);
  expect(offset2).toEqual(8);
});

test("Struct V2 - byte", () => {
  const buf = Buffer.from([0x48, 0x45, 0x59, 0x54, 0x48, 0x45, 0x52, 0x45]);

  const testStruct = new StructObject(buf);

  const {
    firstByte,
    firstAscii,
    firstInt,
    offset: offset1,
  } = testStruct
    .byte("firstByte", {
      peek: () => 0,
    })
    .byte("firstAscii", {
      as: "ascii",
      peek: () => 0,
    })
    .byte("firstInt", {
      as: "uint8",
      peek: () => 0,
    })
    .parse();

  expect(firstByte).toEqual(0x48);
  expect(firstAscii).toEqual("H");
  expect(firstInt).toEqual(0x48);
  expect(offset1).toEqual(0);
});

test("Struct V2 - size: EOS", () => {
  const { first, offset } = struct(Buffer.from([0x1]))
    .uint("first", {
      size: "EOS",
    })
    .parse();

  expect(first).toEqual(1);
  expect(offset).toEqual(1);

  const {
    hey,
    there,
    offset: offset2,
  } = struct(Buffer.from("HEYTHERE", "ascii"))
    .ascii("hey", {
      size: 3,
    })
    .ascii("there", {
      size: "EOS",
    })
    .parse();

  expect(hey).toEqual("HEY");
  expect(there).toEqual("THERE");
  expect(offset2).toEqual(8);
});
