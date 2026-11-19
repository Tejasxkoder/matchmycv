import { handleGithub } from "@/server/handle-github";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
  const { status, body } = await handleGithub(request);
  return Response.json(body, { status });
}
