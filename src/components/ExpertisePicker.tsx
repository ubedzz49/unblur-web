"use client";

import { useMemo, useRef, useState } from "react";
import { useExpertiseOptions, useAddExpertise, useMyExpertise, useRemoveExpertise } from "@/lib/queries/expertise";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { createCustomExpertise } from "@/lib/api";
import { formatExpertiseLabel, parseCustomSubjectQuery } from "@/lib/expertise-format";
import { flattenExpertiseOptions, searchExpertiseOptions, FlatExpertiseOption } from "@/lib/expertise-search";
import styles from "./ExpertisePicker.module.css";

const MAX_RESULTS = 8;

type FlatOption = FlatExpertiseOption;

export function ExpertisePicker() {
  const { showToast } = useToast();
  const { token } = useAuth();
  const options = useExpertiseOptions();
  const mine = useMyExpertise();
  const addExpertise = useAddExpertise();
  const removeExpertise = useRemoveExpertise();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const alreadyAddedLevelIds = useMemo(
    () => new Set((mine.data ?? []).map((e) => e.expertiseLevelId)),
    [mine.data],
  );

  const flatOptions = useMemo<FlatOption[]>(() => flattenExpertiseOptions(options.data), [options.data]);

  const trimmedQuery = query.trim();

  const results = useMemo(
    () => searchExpertiseOptions(flatOptions, trimmedQuery, { excludeLevelIds: alreadyAddedLevelIds, limit: MAX_RESULTS }),
    [flatOptions, alreadyAddedLevelIds, trimmedQuery],
  );

  async function handleSelect(option: FlatOption) {
    try {
      await addExpertise.mutateAsync({ expertiseTypeId: option.typeId, expertiseLevelId: option.levelId });
      showToast(`Added ${formatExpertiseLabel(option.typeName, option.levelName)}`);
      setQuery("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't add that — try again.", "error");
    }
  }

  async function handleAddCustom() {
    if (!token) return;
    const { subjectName, levelName } = parseCustomSubjectQuery(trimmedQuery);
    if (!subjectName) return;

    setAddingCustom(true);
    try {
      const created = await createCustomExpertise(token, subjectName, levelName);
      await addExpertise.mutateAsync({
        expertiseTypeId: created.expertiseTypeId,
        expertiseLevelId: created.expertiseLevelId,
      });
      showToast(`Added ${formatExpertiseLabel(created.typeName, created.levelName)}`);
      setQuery("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't add that — try again.", "error");
    } finally {
      setAddingCustom(false);
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

  const showAddNew = trimmedQuery.length > 0 && results.length === 0;

  return (
    <div>
      {mine.data && mine.data.length > 0 ? (
        <div className={styles.chips}>
          {mine.data.map((entry) => {
            const label = formatExpertiseLabel(entry.expertiseTypeName, entry.expertiseLevelName);
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
                  disabled={addExpertise.isPending}
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
                disabled={addingCustom || addExpertise.isPending}
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
