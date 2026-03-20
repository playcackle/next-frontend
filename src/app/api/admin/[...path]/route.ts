import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LOBBY_MANAGER_URL =
  process.env.LOBBY_MANAGER_INTERNAL_URL || "http://localhost:8001";
const CONTENT_SERVICE_URL =
  process.env.CONTENT_SERVICE_URL || "http://localhost:8003";
const PLAYER_SERVICE_URL =
  process.env.PLAYER_SERVICE_URL || "http://localhost:8004";

const COLLECTION_PATHS = ["/collections", "/topics", "/slots", "/generate"];
const PLAYER_PATHS = ["/players"];

type RouteContext = { params: Promise<{ path: string[] }> };

const resolvePathSegments = async (
  context: RouteContext,
): Promise<string[]> => {
  const resolved = await context.params;
  return resolved?.path ?? [];
};

const buildTargetUrl = (segments: string[], search: string) => {
  const suffix = segments.length ? `/${segments.join("/")}` : "";
  const normalizedPath = suffix || "/";

  let baseUrl = LOBBY_MANAGER_URL;
  let pathPrefix = "/admin"; // lobby-manager admin endpoints

  if (COLLECTION_PATHS.some((p) => normalizedPath.startsWith(p))) {
    baseUrl = CONTENT_SERVICE_URL;
    pathPrefix = ""; // content-service doesn't use /admin prefix
  } else if (PLAYER_PATHS.some((p) => normalizedPath.startsWith(p))) {
    baseUrl = PLAYER_SERVICE_URL;
    pathPrefix = ""; // player-service doesn't use /admin prefix
  }

  return `${baseUrl}${pathPrefix}${normalizedPath}${search}`;
};

const HOP_BY_HOP_HEADERS = [
  "connection",
  "proxy-connection",
  "keep-alive",
  "upgrade",
  "transfer-encoding",
];

const requireAdmin = async (): Promise<{ error: NextResponse } | { accessToken: string }> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.app_metadata?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const { data: { session } } = await supabase.auth.getSession();
  return { accessToken: session!.access_token };
};

const forwardRequest = async (req: NextRequest, context: RouteContext, accessToken: string) => {
  const segments = await resolvePathSegments(context);
  const targetUrl = buildTargetUrl(segments, req.nextUrl.search);

  const headers = new Headers(req.headers);
  headers.set("host", new URL(targetUrl).host);
  headers.set("authorization", `Bearer ${accessToken}`);
  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));
  headers.delete("content-length");

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(req.method)) {
    const body = await req.arrayBuffer();
    init.body = body;
  }

  const response = await fetch(targetUrl, init);
  const responseHeaders = new Headers(response.headers);
  const responseBody = await response.arrayBuffer();

  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
};

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: RouteContext) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;
  return forwardRequest(req, context, result.accessToken);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;
  return forwardRequest(req, context, result.accessToken);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;
  return forwardRequest(req, context, result.accessToken);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;
  return forwardRequest(req, context, result.accessToken);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const result = await requireAdmin();
  if ("error" in result) return result.error;
  return forwardRequest(req, context, result.accessToken);
}
