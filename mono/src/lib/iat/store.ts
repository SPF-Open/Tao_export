import { writable } from "svelte/store";
import { parseIatWorkbook } from "./parse.js";
import { pushError } from "$lib/ui/notifications";
import type { PageInfo, TestInfo } from "./types.js";

export type { Alternative, PageInfo, Question, TestInfo } from "./types.js";

export const file = writable<File | null>(null);
export const pagesData = writable<Record<number, PageInfo> | null>(null);
export const testInfo = writable<TestInfo[] | null>(null);

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

file.subscribe((file) => {
  if (!file) {
    pagesData.set(null);
    return;
  }
  if (file.type !== XLSX_MIME) {
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => {
    pushError("File Error", `Could not read "${file.name}".`);
  };
  reader.onload = (event) => {
    try {
      const data = event.target?.result;
      if (!(data instanceof ArrayBuffer)) {
        throw new Error("Unexpected file reader result");
      }
      const { pages, testInfo: tests } = parseIatWorkbook(data);
      testInfo.set(tests);
      pagesData.set(pages);
    } catch (e) {
      pagesData.set(null);
      testInfo.set(null);
      pushError("Parse Error", e instanceof Error ? e.message : String(e));
    }
  };
  reader.readAsArrayBuffer(file);
});
