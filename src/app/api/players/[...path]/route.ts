import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PLAYER_SERVICE_URL = process.env.PLAYER_SERVICE_URL || "http://localhost:8004";

type RouteParams = { path?: string[] };
type RouteContext = { params: RouteParams } | { params: Promise<{ path: string[] }> };

const resolvePathSegments = async (context: RouteContext): Promise<string[]> => {
  const params = context.params as any;
  if (params && typeof params.then === "function") {
    const resolved = await (context.params as Promise<{ path: string[] }>);
    return resolved?.path ?? [];
  }
  return (context.params as RouteParams)?.path ?? [];
};

const buildTargetUrl = (segments: string[], search: string) => {
  const suffix = segments.length ? `/${segments.join("/")}` : "";
  return `${PLAYER_SERVICE_URL}/players${suffix}${search}`;
};

const HOP_BY_HOP_HEADERS = ["connection", "proxy-connection", "keep-alive", "upgrade", "transfer-encoding"];

const requireAuthenticated = async (): Promise<NextResponse | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
};

const forwardRequest = async (req: NextRequest, context: RouteContext) => {
  const segments = await resolvePathSegments(context);
  const targetUrl = buildTargetUrl(segments, req.nextUrl.search);

  const headers = new Headers(req.headers);
  headers.set("host", new URL(PLAYER_SERVICE_URL).host);
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
  const denied = await requireAuthenticated();
  if (denied) return denied;
  return forwardRequest(req, context);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const denied = await requireAuthenticated();
  if (denied) return denied;
  return forwardRequest(req, context);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const denied = await requireAuthenticated();
  if (denied) return denied;
  return forwardRequest(req, context);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const denied = await requireAuthenticated();
  if (denied) return denied;
  return forwardRequest(req, context);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const denied = await requireAuthenticated();
  if (denied) return denied;
  return forwardRequest(req, context);
}
