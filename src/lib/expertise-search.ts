import { ExpertiseTypeOption } from "@/lib/api";

export interface FlatExpertiseOption {
  typeId: string;
  typeName: string;
  levelId: string;
  levelName: string;
}

/** Flattens the nested type -> levels taxonomy shape into a flat list of
 * selectable (type, level) pairs, the common shape every search UI works with. */
export function flattenExpertiseOptions(options: ExpertiseTypeOption[] | undefined): FlatExpertiseOption[] {
  if (!options) return [];
  return options.flatMap((type) =>
    type.levels.map((level) => ({
      typeId: type.id,
      typeName: type.name,
      levelId: level.id,
      levelName: level.name,
    })),
  );
}

/** Filters a flat option list by a free-text query against "Type Level", excluding
 * any already-selected level ids, capped to `limit` results. */
export function searchExpertiseOptions(
  flatOptions: FlatExpertiseOption[],
  query: string,
  opts: { excludeLevelIds?: Set<string>; limit?: number } = {},
): FlatExpertiseOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exclude = opts.excludeLevelIds;
  const available = exclude ? flatOptions.filter((o) => !exclude.has(o.levelId)) : flatOptions;
  const matches = available.filter((o) => `${o.typeName} ${o.levelName}`.toLowerCase().includes(q));
  return opts.limit ? matches.slice(0, opts.limit) : matches;
}
