import type { ReactElement } from "react";
import type { RandomTableDto } from "../../../shared/dto/RandomTableDto.js";

interface TableListProps {
  tables: RandomTableDto[];
  selectedTableId?: string | undefined;
  onSelect: (tableId: string) => void;
}

export function TableList({ tables, selectedTableId, onSelect }: TableListProps): ReactElement {
  return (
    <section>
      <h2>Tables</h2>
      <ul className="table-list">
        {tables.map((table) => (
          <li key={table.id}>
            <button
              type="button"
              className={table.id === selectedTableId ? "selected" : ""}
              onClick={() => onSelect(table.id)}
            >
              <span>{table.title}</span>
              {table.isFavorite && <span aria-label="Favorite">★</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
