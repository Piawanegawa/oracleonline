import type { ReactElement } from "react";
import type { RandomTableDto } from "../../../shared/dto/RandomTableDto.js";

interface FavoritesListProps {
  tables: RandomTableDto[];
  selectedTableId?: string | undefined;
  onSelect: (tableId: string) => void;
}

export function FavoritesList({ tables, selectedTableId, onSelect }: FavoritesListProps): ReactElement {
  return (
    <section>
      <h2>Favorites</h2>
      {tables.length === 0 ? (
        <p className="muted">No favorites yet.</p>
      ) : (
        <ul className="table-list">
          {tables.map((table) => (
            <li key={table.id}>
              <button
                type="button"
                className={table.id === selectedTableId ? "selected" : ""}
                onClick={() => onSelect(table.id)}
              >
                {table.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
