"use client";

import { useMemo, useRef, useState } from "react";
import { useExpertiseOptions } from "@/lib/queries/expertise";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./ExpertisePicker.module.css";

const MAX_RESULTS = 8;

export interface SelectedExpertise {
  typeId: string;
  typeName: string;
  levelId: string;
  levelName: string;
}

interface FlatOption {
  typeId: string;
  typeName: string;
  levelId: string;
  levelName: string;
}

interface SingleExpertisePickerProps {
  value: SelectedExpertise | null;
  onChange: (value: SelectedExpertise) => void;
}

export function SingleExpertisePicker({ value, onChange }: SingleExpertisePickerProps) {
  const options = useExpertiseOptions();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flatOptions = useMemo<FlatOption[]>(() => {
    if (!options.data) return [];
    return options.data.flatMap((type) =>
      type.levels.map((level) => ({
        typeId: type.id,
        typeName: type.name,
        levelId: level.id,
        levelName: level.name,
      })),
    );
  }, [options.data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flatOptions.slice(0, MAX_RESULTS);
    return flatOptions
      .filter((o) => `${o.typeName} ${o.levelName}`.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [flatOptions, query]);

  function handleSelect(option: FlatOption) {
    onChange(option);
    setQuery("");
    setFocused(false);
  }

  if (options.isLoading) {
    return <Skeleton width="100%" height={44} />;
  }

  return (
    <div>
      {value && (
        <div className={styles.chips}>
          <span className={styles.chip}>
            {value.typeName} — {value.levelName}
          </span>
        </div>
      )}

      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search subjects, exams, or skills (e.g. Mathematics, CAT, Excel)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            clearTimeout(blurTimeout.current);
            setFocused(true);
          }}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setFocused(false), 150);
          }}
          aria-label="Search expertise"
        />
        {focused && (
          <div className={styles.results}>
            {results.length === 0 ? (
              <p className={styles.noResults}>No matches.</p>
            ) : (
              results.map((option) => (
                <button
                  key={option.levelId}
                  type="button"
                  data-testid="expertise-result"
                  className={styles.resultItem}
                  onClick={() => handleSelect(option)}
                >
                  <b>{option.typeName}</b> <span className={styles.resultLevel}>— {option.levelName}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
