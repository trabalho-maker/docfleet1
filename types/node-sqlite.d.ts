declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }

  export class StatementSync {
    all(...params: unknown[]): unknown[][];
    run(...params: unknown[]): unknown;
    columns(): Array<{
      name: string;
    }>;
    setReturnArrays(enabled: boolean): void;
  }
}
