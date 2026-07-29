declare module "node:sqlite" {
  type SqlValue = string | number | bigint | null | Uint8Array;

  export class StatementSync {
    all(...anonymousParameters: SqlValue[]): Record<string, SqlValue>[];
    get(...anonymousParameters: SqlValue[]): Record<string, SqlValue> | undefined;
    run(...anonymousParameters: SqlValue[]): {
      changes: number;
      lastInsertRowid: number | bigint;
    };
  }

  export class DatabaseSync {
    constructor(path: string);
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }
}
