import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get(SESSION_COOKIE_NAME)) {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: crypto.randomUUID(),
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
