export function fail(status: number, code: string, message: string) {
  return { status, body: { error: { code, message } } };
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}
