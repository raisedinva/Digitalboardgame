declare module "assert" {
  function assert(value: unknown, message?: string): asserts value;
  namespace assert {
    function strictEqual<T>(actual: T, expected: T, message?: string): void;
  }
  export = assert;
}
