/** Formats a type/level pair for display, e.g. "Mathematics (Engineering)".
 * When the level is the generic "General" bucket (used for custom subjects added
 * without an explicit level), the parenthetical is omitted since it's just
 * internal plumbing and would confuse users ("DSA" instead of "DSA (General)").
 */
export function formatExpertiseLabel(typeName: string, levelName: string): string {
  if (!levelName || levelName.trim().toLowerCase() === "general") {
    return typeName;
  }
  return `${typeName} (${levelName})`;
}

/** Parses a free-typed query into a subject name and an optional level name.
 * "Data Structures (Engineering)" -> { subjectName: "Data Structures", levelName: "Engineering" }
 * "Data Structures" -> { subjectName: "Data Structures", levelName: undefined }
 */
export function parseCustomSubjectQuery(query: string): { subjectName: string; levelName?: string } {
  const trimmed = query.trim();
  const match = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    const subjectName = match[1].trim();
    const levelName = match[2].trim();
    if (subjectName) {
      return { subjectName, levelName: levelName || undefined };
    }
  }
  return { subjectName: trimmed };
}
