import { writable } from "svelte/store";

export type ColorRule = {
  key: string;
  min: number;
  max: number;
  belowClass: string;
  aboveClass: string;
  inClass: string;
};

export let visibleColumns = writable<Record<string, boolean>>({
  page: false,
  itemRank: true,
  instruction: false,
  duration_mean: true,
  duration_sd: true,
  testCode: false,
  diplome: true,
  nCandidates: true,
  correct_pct: true,
  incorrect_pct: true,
  empty_pct: true,
  not_seen_pct: true,
  answered_pct: true,
  difficulty: false,
  discr_comp: true,
  discr_test: true,
  d_index_comp: true,
  d_index_test: true
});

export const colorRules: Record<string, ColorRule> = {
  correct_pct: { key: "correct_pct", min: 25, max: 80, belowClass: "red", aboveClass: "orange", inClass: "" },
  discr_comp: { key: "discr_comp", min: 0.1, max: 0.2, belowClass: "red", aboveClass: "", inClass: "orange" },
  discr_test: { key: "discr_test", min: 0.1, max: 0.2, belowClass: "red", aboveClass: "", inClass: "orange" },
  d_index_comp: { key: "d_index_comp", min: 0.1, max: 0.2, belowClass: "red", aboveClass: "", inClass: "orange" },
  d_index_test: { key: "d_index_test", min: 0.1, max: 0.2, belowClass: "red", aboveClass: "", inClass: "orange" },
  not_seen_pct: { key: "not_seen_pct", min: 5, max: 10, belowClass: "", aboveClass: "red", inClass: "orange" },
};