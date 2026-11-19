import { CATEGORIES, type Category } from "@/lib/bounty/brief";

import styles from "./MailRoom.module.css";

export type CategoryChoice = Category | "All";
const CHOICES: CategoryChoice[] = ["All", ...CATEGORIES];

export function CategoryFilter({
  value,
  onChange,
}: {
  value: CategoryChoice;
  onChange: (next: CategoryChoice) => void;
}) {
  return (
    <div className={styles.pills}>
      {CHOICES.map((choice) => (
        <button
          key={choice}
          type="button"
          aria-pressed={choice === value}
          className={styles.pill}
          onClick={() => onChange(choice)}
        >
          {choice}
        </button>
      ))}
    </div>
  );
}
