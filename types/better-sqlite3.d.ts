declare module 'better-sqlite3' {
  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }
  export interface Statement<BindParameters extends any[] = any[], Result = any> {
    all(...params: BindParameters): Result[];
    get(...params: BindParameters): Result | undefined;
    run(...params: BindParameters): RunResult;
  }
  export interface Database {
    prepare<BindParameters extends any[] = any[], Result = any>(source: string): Statement<BindParameters, Result>;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
    exec(source: string): Database;
    pragma(source: string, options?: { simple?: boolean }): any;
    close(): Database;
  }
  export namespace Database {
    export type Database = import('better-sqlite3').Database;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: any): Database;
    (filename: string, options?: any): Database;
    prototype: Database;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
