import { StructObject, struct } from "../structv2";

test("Struct V2 - calculate size", () => {
  const buf = Buffer.from("HelloThe", "ascii");

  const st = struct(buf)
    .ascii("hello", {
      size: 5,
    })
    .ascii("there", {
      size: 3,
    });

  const helloSize = st.calculateSize({ size: (root) => root.hello.length });
  const thereSize = st.calculateSize({ size: (root) => root.there.length });
  const fixedSize = st.calculateSize({ size: 10 });
  const defaultSize = st.calculateSize();

  expect(helloSize).toEqual(5);
  expect(thereSize).toEqual(3);
  expect(fixedSize).toEqual(10);
  expect(defaultSize).toEqual(1);
});

test("Struct V2 - ascii", () => {
  const buf = Buffer.from("HelloThere", "ascii");

  const { hello, there, offset } = struct(buf)
    .ascii("hello", {
      size: 5,
    })
    .ascii("there", {
      size: (root) => root.hello.length,
    })
    .parse();

  expect(hello).toEqual("Hello");
  expect(there).toEqual("There");
  expect(offset).toEqual(10);
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

  expect(first).toEqual(0x00);
  expect(second).toEqual(0x02c8);
  expect(third).toEqual(0x0064);
  expect(fourth).toEqual(0x04);
  expect(offset).toEqual(6);

  expect(firstBE).toEqual(0x0002);
  expect(secondLE).toEqual(0x64c8);
  expect(thirdBE).toEqual(0x0004);
  // uint with size > 1 needs to have endianness defined
  expect(() => struct(buf).uint("throwMe", { size: 2 }).parse()).toThrow();
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
      peek: 1,
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
