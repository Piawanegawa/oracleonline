export interface Database {
  initialize(): Promise<void>;
  close(): Promise<void>;
}

export class SqliteDatabase implements Database {
  constructor(readonly path: string) {}

  async initialize(): Promise<void> {
    // Placeholder for the SQLite-backed implementation. The initial app uses
    // repositories behind interfaces so this can replace in-memory storage later.
  }

  async close(): Promise<void> {
    // No-op until the SQLite implementation owns a connection handle.
  }
}
