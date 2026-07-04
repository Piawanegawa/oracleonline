import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import type { RandomTableDto } from "../../shared/dto/RandomTableDto.js";
import type { RollResultDto } from "../../shared/dto/RollResultDto.js";
import { FavoritesList } from "./components/FavoritesList.js";
import { RollButton } from "./components/RollButton.js";
import { SearchBox } from "./components/SearchBox.js";
import { TableList } from "./components/TableList.js";
import { TableView } from "./components/TableView.js";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function App(): ReactElement {
  const [tables, setTables] = useState<RandomTableDto[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [rollResult, setRollResult] = useState<RollResultDto | undefined>();
  const [error, setError] = useState<string | undefined>();

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? tables[0],
    [selectedTableId, tables]
  );

  async function loadTables(searchQuery = query): Promise<void> {
    setError(undefined);
    const url = searchQuery.trim() === "" ? "/api/tables" : `/api/search?q=${encodeURIComponent(searchQuery)}`;
    const result = await fetchJson<RandomTableDto[] | { results: RandomTableDto[] }>(url);
    const nextTables = Array.isArray(result) ? result : result.results;
    setTables(nextTables);
    setSelectedTableId((currentId) => {
      if (currentId !== undefined && nextTables.some((table) => table.id === currentId)) return currentId;
      return nextTables[0]?.id;
    });
    setRollResult(undefined);
  }

  useEffect(() => {
    loadTables("").catch((caughtError: unknown) => {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load tables.");
    });
  }, []);

  async function handleSearch(nextQuery: string): Promise<void> {
    setQuery(nextQuery);
    await loadTables(nextQuery);
  }

  async function handleRoll(): Promise<void> {
    if (selectedTable === undefined) return;
    setError(undefined);
    setRollResult(await fetchJson<RollResultDto>(`/api/roll/${selectedTable.id}`, { method: "POST" }));
  }

  async function handleToggleFavorite(table: RandomTableDto): Promise<void> {
    setError(undefined);
    const method = table.isFavorite ? "DELETE" : "POST";
    const updatedTable = await fetchJson<RandomTableDto>(`/api/favorites/${table.id}`, { method });
    setTables((currentTables) =>
      currentTables.map((currentTable) => (currentTable.id === updatedTable.id ? updatedTable : currentTable))
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Oracle Online</h1>
          <p>Random tables from rulebook plugins.</p>
        </div>
        <SearchBox query={query} onSearch={(nextQuery) => void handleSearch(nextQuery)} />
      </header>

      {error !== undefined && <p className="error">{error}</p>}

      <section className="layout">
        <aside className="sidebar">
          <TableList
            tables={tables}
            selectedTableId={selectedTable?.id}
            onSelect={(tableId) => {
              setSelectedTableId(tableId);
              setRollResult(undefined);
            }}
          />
          <FavoritesList
            tables={tables.filter((table) => table.isFavorite)}
            selectedTableId={selectedTable?.id}
            onSelect={setSelectedTableId}
          />
        </aside>

        <section className="content">
          {selectedTable === undefined ? (
            <p>No tables found.</p>
          ) : (
            <>
              <div className="table-actions">
                <button type="button" onClick={() => void handleToggleFavorite(selectedTable)}>
                  {selectedTable.isFavorite ? "Remove favorite" : "Mark favorite"}
                </button>
                <RollButton onRoll={() => void handleRoll()} />
              </div>
              <TableView table={selectedTable} />
              {rollResult !== undefined && (
                <div className="roll-result" aria-live="polite">
                  <strong>Rolled {rollResult.roll}:</strong> {rollResult.text}
                </div>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}
