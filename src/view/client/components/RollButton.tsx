import type { ReactElement } from "react";

interface RollButtonProps {
  onRoll: () => void;
}

export function RollButton({ onRoll }: RollButtonProps): ReactElement {
  return (
    <button type="button" onClick={onRoll}>
      Roll
    </button>
  );
}
