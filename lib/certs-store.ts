import { createStore } from "./store";

export type Certificate = {
  id: string;
  name: string;
  issuer: string;
  issued: string;
  expires: string;
  url: string;
};

export type CertStatus = "active" | "expired" | "unverified";

const store = createStore<Certificate[]>("matchmycv-certs");

export const useCerts = store.useValue;

export function addCert(cert: Omit<Certificate, "id">) {
  const list = store.read() ?? [];
  store.write([...list, { ...cert, id: globalThis.crypto.randomUUID() }]);
}

export function removeCert(id: string) {
  store.write((store.read() ?? []).filter((c) => c.id !== id));
}

export function clearCerts() {
  store.write(null);
}

export function certStatus(cert: Certificate, now: number = Date.now()): CertStatus {
  if (cert.expires) {
    const end = new Date(`${cert.expires}-01T00:00:00Z`).getTime();
    if (!Number.isNaN(end) && end < now) return "expired";
  }
  return cert.url ? "active" : "unverified";
}
