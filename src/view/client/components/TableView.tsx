import type { ReactElement } from "react";
import type { RandomTableDto } from "../../../shared/dto/RandomTableDto.js";

interface TableViewProps {
  table: RandomTableDto;
}

export function TableView({ table }: TableViewProps): ReactElement {
  return (
    <article className="table-view">
      <header>
        <p>{table.sourceTitle}{table.page === undefined ? "" : `, page ${table.page}`}</p>
        <h2>{table.title}</h2>
        <div className="metadata">
          <span>{table.dice}</span>
          <span>{table.category.join(" / ")}</span>
        </div>
      </header>

      <table>
        <thead>
          <tr>
            <th>Roll</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {table.entries.map((entry) => (
            <tr key={`${entry.min}-${entry.max}`}>
              <td>{entry.min === entry.max ? entry.min : `${entry.min}-${entry.max}`}</td>
              <td>{entry.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
