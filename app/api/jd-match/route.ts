import { handleJd } from "@/server/handle-jd";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { status, body } = await handleJd(request);
  return Response.json(body, { status });
}
