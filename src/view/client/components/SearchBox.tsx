import { FormEvent, useState } from "react";
import type { ReactElement } from "react";

interface SearchBoxProps {
  query: string;
  onSearch: (query: string) => void;
}

export function SearchBox({ query, onSearch }: SearchBoxProps): ReactElement {
  const [draftQuery, setDraftQuery] = useState(query);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSearch(draftQuery);
  }

  return (
    <form className="search-box" onSubmit={handleSubmit}>
      <input
        aria-label="Search tables"
        type="search"
        value={draftQuery}
        onChange={(event) => setDraftQuery(event.target.value)}
        placeholder="Search tables"
      />
      <button type="submit">Search</button>
    </form>
  );
}
