import { writable } from "svelte/store";

export enum Language {
  FR = "FR",
  NL = "NL",
  DE = "DE",
}

export const lang = writable(Language.FR);