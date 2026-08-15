import { NextRequest, NextResponse } from "next/server";

const CLEAN_ROUTES = [
  "dashboard",
  "vendors",
  "items",
  "skus",
  "packets",
  "units",
  "schools",
  "orders",
  "delivery-calendar",
  "reports",
  "delivery-persons",
  "history",
  "tools",
  "legacy-import",
  "extra-features",
];

function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get("auth_token")?.value;
  return Boolean(token && token.trim().length > 0);
}

function getRole(req: NextRequest): string {
  const role = req.cookies.get("role")?.value;
  return role ? role.trim() : "";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const loggedIn = isAuthenticated(req);
  const role = getRole(req);

  // 1. Always allow static files, API routes, and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Allow /login page without redirect loops
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // 3. Unauthenticated user accessing protected routes: redirect to /login
  if (!loggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. Directly allow /delivery Portal routes (e.g. /delivery or /delivery/history)
  if (pathname === "/delivery" || pathname.startsWith("/delivery/")) {
    if (role === "delivery" || role === "driver" || role === "admin") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 5. Role-based routing for Root "/" and "/dashboard"
  if (pathname === "/" || pathname === "/dashboard") {
    if (role === "delivery" || role === "driver") {
      return NextResponse.rewrite(new URL("/delivery", req.url));
    }
    if (role === "unit") {
      return NextResponse.rewrite(new URL("/unit", req.url));
    }
    if (role === "school-admin") {
      return NextResponse.rewrite(new URL("/school-admin", req.url));
    }
    return NextResponse.rewrite(new URL("/admin", req.url));
  }

  // 6. Redirect legacy /items or /admin/items to /vendors
  if (pathname === "/items" || pathname === "/admin/items") {
    return NextResponse.redirect(new URL("/vendors", req.url));
  }

  // 7. Clean URL Rewrites per Role (/vendors -> /admin/vendors)
  const segment = pathname.split("/")[1];
  if (CLEAN_ROUTES.includes(segment)) {
    if (role === "delivery" || role === "driver") {
      if (segment === "history") {
        return NextResponse.rewrite(new URL("/delivery/history", req.url));
      }
      return NextResponse.rewrite(new URL("/delivery", req.url));
    } else if (role === "unit") {
      if (segment === "schools") {
        return NextResponse.rewrite(new URL("/unit/schools", req.url));
      } else if (segment === "orders") {
        return NextResponse.rewrite(new URL("/unit/orders", req.url));
      } else {
        return NextResponse.rewrite(new URL("/unit", req.url));
      }
    } else if (role === "school-admin") {
      if (segment === "orders") {
        return NextResponse.rewrite(new URL("/school-admin/orders", req.url));
      } else {
        return NextResponse.rewrite(new URL("/school-admin", req.url));
      }
    } else if (role === "admin" || !role) {
      const subPath = pathname.replace(`/${segment}`, "");
      const internalPath =
        segment === "dashboard" ? "/admin" : `/admin/${segment}${subPath}`;
      return NextResponse.rewrite(new URL(internalPath, req.url));
    }
  }

  // 8. Direct internal route protection
  if (pathname.startsWith("/admin") && role !== "admin") {
    if (role === "unit") return NextResponse.redirect(new URL("/dashboard", req.url));
    if (role === "school-admin") return NextResponse.redirect(new URL("/dashboard", req.url));
    if (role === "delivery" || role === "driver") return NextResponse.redirect(new URL("/delivery", req.url));
  }
  if (pathname.startsWith("/unit") && role !== "unit" && role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/school-admin") && role !== "school-admin" && role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};