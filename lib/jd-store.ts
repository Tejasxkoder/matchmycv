import { createStore } from "./store";
import type { StoredJd } from "./jd-types";

const store = createStore<StoredJd>("matchmycv-jd");

export const useJd = store.useValue;
export const saveJd = (jd: StoredJd) => store.write(jd);
export const clearJd = () => store.write(null);
