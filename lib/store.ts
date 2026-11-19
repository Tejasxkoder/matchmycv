import { useSyncExternalStore } from "react";

export function createStore<T>(key: string) {
  const event = `matchmycv-store:${key}`;
  let lastRaw: string | null = null;
  let lastValue: T | null = null;

  function read(): T | null {
    if (typeof window === "undefined") return null;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return lastValue;
    }
    if (raw === lastRaw) return lastValue;
    lastRaw = raw;
    try {
      lastValue = raw ? (JSON.parse(raw) as T) : null;
    } catch {
      lastValue = null;
    }
    return lastValue;
  }

  function write(value: T | null) {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
    window.dispatchEvent(new Event(event));
  }

  function subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange);
    window.addEventListener(event, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(event, onChange);
    };
  }

  function useValue(): T | null | undefined {
    return useSyncExternalStore<T | null | undefined>(subscribe, read, () => undefined);
  }

  return { key, read, write, useValue };
}
