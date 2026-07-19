"use client";

import { useMemo, useRef, useState } from "react";
import { useExpertiseOptions } from "@/lib/queries/expertise";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { createCustomExpertise, getSuggestedExpertise, SuggestedExpertise } from "@/lib/api";
import { formatExpertiseLabel, parseCustomSubjectQuery } from "@/lib/expertise-format";
import { flattenExpertiseOptions, searchExpertiseOptions } from "@/lib/expertise-search";
import styles from "./ExpertisePicker.module.css";

const MAX_RESULTS = 8;
// only the most confident matches -- this is a manual "give me your best guess" action,
// not a browsing list, so a couple of strong suggestions beats a longer, noisier one
const SUGGESTION_LIMIT = 2;
const MIN_TITLE_LENGTH = 3;

export interface SelectedExpertise {
  typeId: string;
  typeName: string;
  levelId: string;
  levelName: string;
}

interface DoubtExpertisePickerProps {
  title: string;
  description?: string;
  value: SelectedExpertise[];
  onChange: (value: SelectedExpertise[]) => void;
}

export function DoubtExpertisePicker({ title, description, value, onChange }: DoubtExpertisePickerProps) {
  const options = useExpertiseOptions();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedExpertise[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selectedLevelIds = useMemo(() => new Set(value.map((v) => v.levelId)), [value]);

  const flatOptions = useMemo(() => flattenExpertiseOptions(options.data), [options.data]);

  const trimmedQuery = query.trim();

  const results = useMemo(
    () => searchExpertiseOptions(flatOptions, trimmedQuery, { excludeLevelIds: selectedLevelIds, limit: MAX_RESULTS }),
    [flatOptions, selectedLevelIds, trimmedQuery],
  );

  const trimmedTitle = title.trim();
  const titleEligibleForSuggestions = trimmedTitle.length >= MIN_TITLE_LENGTH;

  // Suggestions are opt-in only -- fetched once, on demand, when the user explicitly
  // asks for them (the "Auto-suggest" button below), never automatically as they type.
  async function handleAutoSuggest() {
    if (!token || !titleEligibleForSuggestions || suggestLoading) return;
    setSuggestLoading(true);
    setSuggestError(false);
    try {
      const results = await getSuggestedExpertise(token, trimmedTitle, description?.trim() || undefined, SUGGESTION_LIMIT);
      setSuggestions(results);
      if (results.length === 0) setSuggestError(true);
    } catch {
      setSuggestions([]);
      setSuggestError(true);
    } finally {
      setSuggestLoading(false);
    }
  }

  const visibleSuggestions = useMemo(
    () => suggestions.filter((s) => !selectedLevelIds.has(s.expertiseLevelId)),
    [suggestions, selectedLevelIds],
  );

  function handleAdd(option: SelectedExpertise) {
    if (selectedLevelIds.has(option.levelId)) return;
    onChange([...value, option]);
    setQuery("");
    setFocused(false);
  }

  function handleAddSuggestion(suggestion: SuggestedExpertise) {
    // The suggestion's label is "Type (Level)" or just "Type" for a bare General level;
    // the underlying type/level names aren't otherwise exposed, so parse them back out
    // using the same convention formatExpertiseLabel uses to produce that label.
    const match = suggestion.label.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    const typeName = match ? match[1].trim() : suggestion.label;
    const levelName = match ? match[2].trim() : "General";
    handleAdd({
      typeId: suggestion.expertiseTypeId,
      typeName,
      levelId: suggestion.expertiseLevelId,
      levelName,
    });
  }

  function handleRemove(levelId: string) {
    onChange(value.filter((v) => v.levelId !== levelId));
  }

  async function handleAddCustom() {
    if (!token) return;
    const { subjectName, levelName } = parseCustomSubjectQuery(trimmedQuery);
    if (!subjectName) return;

    setAddingCustom(true);
    try {
      const created = await createCustomExpertise(token, subjectName, levelName);
      handleAdd({
        typeId: created.expertiseTypeId,
        typeName: created.typeName,
        levelId: created.expertiseLevelId,
        levelName: created.levelName,
      });
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
      {value.length > 0 && (
        <div className={styles.chips}>
          {value.map((entry) => {
            const label = formatExpertiseLabel(entry.typeName, entry.levelName);
            return (
              <span key={entry.levelId} className={styles.chip}>
                {label}
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={() => handleRemove(entry.levelId)}
                  aria-label={`Remove ${label}`}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <Button
          type="button"
          variant="secondary"
          style={{ width: "auto" }}
          disabled={!titleEligibleForSuggestions || suggestLoading}
          onClick={handleAutoSuggest}
          data-testid="auto-suggest-button"
        >
          {suggestLoading ? "Finding matches…" : "Auto-suggest for me"}
        </Button>
        {!titleEligibleForSuggestions && (
          <p className={styles.empty} style={{ marginTop: 4 }}>
            Add a bit more to the title first so there&apos;s something to match against.
          </p>
        )}
        {suggestError && titleEligibleForSuggestions && (
          <p className={styles.empty} style={{ marginTop: 4 }}>
            Couldn&apos;t find a confident match — try searching below instead.
          </p>
        )}
      </div>

      {visibleSuggestions.length > 0 && (
        <div className={styles.chips} data-testid="expertise-suggestions">
          {visibleSuggestions.map((s) => (
            <button
              key={s.expertiseLevelId}
              type="button"
              data-testid="expertise-suggestion"
              className={styles.addNewItem}
              onClick={() => handleAddSuggestion(s)}
            >
              + {s.label}
            </button>
          ))}
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
                  onClick={() => handleAdd(option)}
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
