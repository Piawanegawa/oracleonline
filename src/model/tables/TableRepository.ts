import type { RandomTable } from "./RandomTable.js";

export interface TableRepository {
  list(): Promise<RandomTable[]>;
  findById(id: string): Promise<RandomTable | undefined>;
  search(query: string): Promise<RandomTable[]>;
  replaceAll(tables: RandomTable[]): Promise<void>;
}

export class InMemoryTableRepository implements TableRepository {
  private tables = new Map<string, RandomTable>();

  constructor(initialTables: RandomTable[] = []) {
    for (const table of initialTables) {
      this.tables.set(table.id, table);
    }
  }

  async list(): Promise<RandomTable[]> {
    return [...this.tables.values()];
  }

  async findById(id: string): Promise<RandomTable | undefined> {
    return this.tables.get(id);
  }

  async search(query: string): Promise<RandomTable[]> {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery === "") return this.list();

    return [...this.tables.values()].filter((table) => {
      const searchable = [
        table.title,
        table.sourceTitle,
        table.dice,
        ...table.category,
        ...table.tags,
        ...table.entries.map((entry) => entry.text)
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }

  async replaceAll(tables: RandomTable[]): Promise<void> {
    this.tables = new Map(tables.map((table) => [table.id, table]));
  }
}
