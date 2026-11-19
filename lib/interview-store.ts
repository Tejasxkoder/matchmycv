import { createStore } from "./store";
import type { InterviewSet } from "./interview-types";

const store = createStore<InterviewSet>("matchmycv-interview");

export const useInterview = store.useValue;
export const saveInterview = (set: InterviewSet) => store.write(set);
export const clearInterview = () => store.write(null);
