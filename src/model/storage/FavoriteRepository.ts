export interface FavoriteRepository {
  list(): Promise<Set<string>>;
  add(tableId: string): Promise<void>;
  remove(tableId: string): Promise<void>;
  has(tableId: string): Promise<boolean>;
}

export class InMemoryFavoriteRepository implements FavoriteRepository {
  private readonly favoriteTableIds = new Set<string>();

  async list(): Promise<Set<string>> {
    return new Set(this.favoriteTableIds);
  }

  async add(tableId: string): Promise<void> {
    this.favoriteTableIds.add(tableId);
  }

  async remove(tableId: string): Promise<void> {
    this.favoriteTableIds.delete(tableId);
  }

  async has(tableId: string): Promise<boolean> {
    return this.favoriteTableIds.has(tableId);
  }
}
