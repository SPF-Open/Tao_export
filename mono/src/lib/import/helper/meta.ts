import type { AssessmentItem } from "$lib/questions/types.js";

/** Metadata dimensions surfaced in the import preview. */
export type MetaKey = "competency" | "indicator" | "competencyDescr" | "masteryDescr";

export interface MetaDimensionDef {
  key: MetaKey;
  label: string;
  /** Compact label for tight headers. */
  short: string;
}

export const META_DIMENSIONS: MetaDimensionDef[] = [
  { key: "competency", label: "Competency", short: "Comp." },
  { key: "indicator", label: "Indicator", short: "Ind." },
  { key: "competencyDescr", label: "Comp. descr", short: "C. descr" },
  { key: "masteryDescr", label: "Mastery descr", short: "M. descr" },
];

/**
 * Restrained categorical palette for the repartition matrix. Distinct hues are
 * required to tell categories apart, but kept muted to respect the TAO visual
 * language. Cycles when a dimension has more categories than colors.
 */
export const META_PALETTE = [
  "#4f46e5", "#0891b2", "#16a34a", "#ca8a04",
  "#db2777", "#7c3aed", "#0d9488", "#dc2626",
  "#2563eb", "#65a30d", "#ea580c", "#9333ea",
];

export interface MetaCategory {
  value: string;
  color: string;
  count: number;
}

export interface MetaDimension extends MetaDimensionDef {
  categories: MetaCategory[];
  /** Number of questions that carry a value for this dimension. */
  filled: number;
}

export interface MetaModel {
  total: number;
  dimensions: MetaDimension[];
  /** Stable color for a given dimension value (undefined when empty). */
  colorOf: (key: MetaKey, value: string | undefined | null) => string | undefined;
  /** Trimmed metadata value for an item ("" when missing). */
  valueOf: (item: AssessmentItem, key: MetaKey) => string;
}

function readValue(item: AssessmentItem, key: MetaKey): string {
  const raw = item.metadata?.[key];
  return raw == null ? "" : String(raw).trim();
}

/**
 * Build the color/repartition model for a set of parsed questions. Categories
 * are discovered in first-seen order so colors stay stable across renders.
 */
export function buildMetaModel(items: AssessmentItem[]): MetaModel {
  const maps = new Map<MetaKey, Map<string, MetaCategory>>();
  const filledCount = new Map<MetaKey, number>();

  for (const dim of META_DIMENSIONS) {
    const cats = new Map<string, MetaCategory>();
    let filled = 0;
    for (const item of items) {
      const value = readValue(item, dim.key);
      if (!value) continue;
      filled++;
      const existing = cats.get(value);
      if (existing) {
        existing.count++;
      } else {
        cats.set(value, {
          value,
          color: META_PALETTE[cats.size % META_PALETTE.length],
          count: 1,
        });
      }
    }
    maps.set(dim.key, cats);
    filledCount.set(dim.key, filled);
  }

  const dimensions: MetaDimension[] = META_DIMENSIONS.map((dim) => ({
    ...dim,
    categories: [...(maps.get(dim.key)?.values() ?? [])],
    filled: filledCount.get(dim.key) ?? 0,
  }));

  return {
    total: items.length,
    dimensions,
    colorOf: (key, value) => {
      const v = value == null ? "" : String(value).trim();
      if (!v) return undefined;
      return maps.get(key)?.get(v)?.color;
    },
    valueOf: readValue,
  };
}
