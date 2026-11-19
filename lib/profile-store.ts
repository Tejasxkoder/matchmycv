import { createStore } from "./store";

export type Profile = {
  fullName: string;
  email: string;
  github: string;
  linkedin: string;
  targetRole: string;
  level: string;
  salary: string;
  locations: string;
  notifyAts: boolean;
  notifyJobs: boolean;
  notifyDigest: boolean;
  biasFlags: boolean;
};

export const DEFAULT_PROFILE: Profile = {
  fullName: "",
  email: "",
  github: "",
  linkedin: "",
  targetRole: "",
  level: "L4",
  salary: "",
  locations: "",
  notifyAts: true,
  notifyJobs: true,
  notifyDigest: false,
  biasFlags: true,
};

const store = createStore<Profile>("matchmycv-profile");

export function useProfile(): Profile {
  const value = store.useValue();
  return { ...DEFAULT_PROFILE, ...(value ?? {}) };
}

export function readProfile(): Profile {
  return { ...DEFAULT_PROFILE, ...(store.read() ?? {}) };
}

export function saveProfile(profile: Profile) {
  store.write(profile);
}

export function resetProfile() {
  store.write(null);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
