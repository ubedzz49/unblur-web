"use client";

import { useMemo, useRef, useState } from "react";
import { useExpertiseOptions, useAddExpertise, useMyExpertise, useRemoveExpertise } from "@/lib/queries/expertise";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./ExpertisePicker.module.css";

const MAX_RESULTS = 8;

interface FlatOption {
  typeId: string;
  typeName: string;
  levelId: string;
  levelName: string;
}

export function ExpertisePicker() {
  const { showToast } = useToast();
  const options = useExpertiseOptions();
  const mine = useMyExpertise();
  const addExpertise = useAddExpertise();
  const removeExpertise = useRemoveExpertise();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const alreadyAddedLevelIds = useMemo(
    () => new Set((mine.data ?? []).map((e) => e.expertiseLevelId)),
    [mine.data],
  );

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
    const available = flatOptions.filter((o) => !alreadyAddedLevelIds.has(o.levelId));
    if (!q) return available.slice(0, MAX_RESULTS);
    return available
      .filter((o) => `${o.typeName} ${o.levelName}`.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [flatOptions, alreadyAddedLevelIds, query]);

  async function handleSelect(option: FlatOption) {
    try {
      await addExpertise.mutateAsync({ expertiseTypeId: option.typeId, expertiseLevelId: option.levelId });
      showToast(`Added ${option.typeName} — ${option.levelName}`);
      setQuery("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't add that — try again.", "error");
    }
  }

  async function handleRemove(id: string, label: string) {
    try {
      await removeExpertise.mutateAsync(id);
      showToast(`Removed ${label}`);
    } catch {
      showToast("Couldn't remove that — try again.", "error");
    }
  }

  if (mine.isLoading || options.isLoading) {
    return <Skeleton width="100%" height={80} />;
  }

  return (
    <div>
      {mine.data && mine.data.length > 0 ? (
        <div className={styles.chips}>
          {mine.data.map((entry) => {
            const label = `${entry.expertiseTypeName} — ${entry.expertiseLevelName}`;
            return (
              <span key={entry.id} className={styles.chip}>
                {label}
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={() => handleRemove(entry.id, label)}
                  aria-label={`Remove ${label}`}
                  disabled={removeExpertise.isPending}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className={styles.empty}>No expertise added yet.</p>
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
            // small delay so a click on a result registers before the list closes
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
                  disabled={addExpertise.isPending}
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
