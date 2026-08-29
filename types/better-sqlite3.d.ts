declare module 'better-sqlite3' {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement<BindParameters extends unknown[] | [Record<string, unknown>] = unknown[]> {
    run(...params: BindParameters | unknown[]): RunResult;
    get(...params: BindParameters | unknown[]): unknown;
    all(...params: BindParameters | unknown[]): unknown[];
  }

  interface Database {
    prepare(sql: string): Statement<any>;
    exec(sql: string): this;
    pragma(pragma: string, options?: { simple?: boolean }): unknown;
    transaction<F extends (...args: any[]) => any>(fn: F): F;
    close(): this;
  }

  interface Options {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message?: unknown, ...additionalArgs: unknown[]) => void;
  }

  namespace Database {
    export type Database = import('better-sqlite3').Database;
    export type Statement<BindParameters extends unknown[] | [Record<string, unknown>] = unknown[]> = import('better-sqlite3').Statement<BindParameters>;
    export type RunResult = import('better-sqlite3').RunResult;
    export type Options = import('better-sqlite3').Options;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: Options): Database;
    (filename: string, options?: Options): Database;
  }

  const Database: DatabaseConstructor;
  export = Database;
}
