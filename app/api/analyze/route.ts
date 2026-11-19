import { handleAnalyze } from "@/server/handle-analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { status, body } = await handleAnalyze(request);
  return Response.json(body, { status });
}
