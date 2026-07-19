"use client";

import { useMemo, useRef, useState } from "react";
import { useExpertiseOptions } from "@/lib/queries/expertise";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { createCustomExpertise } from "@/lib/api";
import { formatExpertiseLabel, parseCustomSubjectQuery } from "@/lib/expertise-format";
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
  const { token } = useAuth();
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
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

  const trimmedQuery = query.trim();

  const results = useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    if (!q) return [];
    return flatOptions
      .filter((o) => `${o.typeName} ${o.levelName}`.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [flatOptions, trimmedQuery]);

  function handleSelect(option: FlatOption) {
    onChange(option);
    setQuery("");
    setFocused(false);
  }

  async function handleAddCustom() {
    if (!token) return;
    const { subjectName, levelName } = parseCustomSubjectQuery(trimmedQuery);
    if (!subjectName) return;

    setAddingCustom(true);
    try {
      const created = await createCustomExpertise(token, subjectName, levelName);
      onChange({
        typeId: created.expertiseTypeId,
        typeName: created.typeName,
        levelId: created.expertiseLevelId,
        levelName: created.levelName,
      });
      setQuery("");
      setFocused(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't add that — try again.", "error");
    } finally {
      setAddingCustom(false);
    }
  }

  if (options.isLoading) {
    return <Skeleton width="100%" height={44} />;
  }

  const showAddNew = trimmedQuery.length > 0 && results.length === 0;

  return (
    <div>
      {value && (
        <div className={styles.chips}>
          <span className={styles.chip}>{formatExpertiseLabel(value.typeName, value.levelName)}</span>
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
        {focused && trimmedQuery.length > 0 && (
          <div className={styles.results}>
            {results.length === 0 && !showAddNew ? (
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
                  <b>{option.typeName}</b>{" "}
                  {option.levelName.trim().toLowerCase() !== "general" && (
                    <span className={styles.resultLevel}>({option.levelName})</span>
                  )}
                </button>
              ))
            )}
            {showAddNew && (
              <button
                type="button"
                data-testid="add-new-expertise"
                className={styles.addNewItem}
                onClick={handleAddCustom}
                disabled={addingCustom}
              >
                <span className={styles.addNewIcon} aria-hidden="true">
                  +
                </span>
                Add &quot;{trimmedQuery}&quot; as a new subject
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
