import { createStore } from "./store";
import type { GithubSnapshot } from "./github-types";

const store = createStore<GithubSnapshot>("matchmycv-github");

export const useGithub = store.useValue;
export const saveGithub = (snapshot: GithubSnapshot) => store.write(snapshot);
export const clearGithub = () => store.write(null);
