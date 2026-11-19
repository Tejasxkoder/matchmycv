import { handleInterview } from "@/server/handle-interview";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { status, body } = await handleInterview(request);
  return Response.json(body, { status });
}
