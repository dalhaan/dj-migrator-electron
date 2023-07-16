declare module "kaitai-struct-compiler" {
  type SupportedLanguages =
    | "construct"
    | "cpp_stl"
    | "csharp"
    | "graphviz"
    | "go"
    | "html"
    | "java"
    | "javascript"
    | "lua"
    | "nim"
    | "perl"
    | "php"
    | "python"
    | "ruby"
    | "rust";

  type Importer = {
    importYaml: (name: string, mode: string) => Promise<Record<string, any>>;
  };

  class KaitaiStructCompiler {
    compile: (
      langStr: SupportedLanguages,
      yaml: Record<string, any>,
      importer: Importer | null,
      debug: boolean
    ) => Promise<Record<string, string>>;
  }

  export default KaitaiStructCompiler;
}
