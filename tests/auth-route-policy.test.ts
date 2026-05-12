import { describe, expect, it } from "vitest";

import {
  SIGN_OUT_REDIRECT_PATH,
  getAuthorizedRouteDecision,
  isInfrastructureRoute,
  isProtectedAppRoute,
} from "../lib/auth-route-policy";

function decisionFor(pathname: string, isLoggedIn: boolean) {
  return getAuthorizedRouteDecision({
    isLoggedIn,
    nextUrl: new URL(pathname, "https://family-ledger.test"),
  });
}

function expectRedirectTo(response: Response, pathname: string) {
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe(`https://family-ledger.test${pathname}`);
}

describe("auth route policy", () => {
  it("redirects logged-out protected pages through the sign-in flow", () => {
    expect(decisionFor("/dashboard", false)).toBe(false);
    expect(decisionFor("/balance", false)).toBe(false);
    expect(decisionFor("/balance/create", false)).toBe(false);
    expect(decisionFor("/setting", false)).toBe(false);
  });

  it("treats expired-session-equivalent protected requests as unauthenticated", () => {
    expect(decisionFor("/dashboard", false)).toBe(false);
  });

  it("allows authenticated protected pages", () => {
    expect(decisionFor("/dashboard", true)).toBe(true);
    expect(decisionFor("/balance/create", true)).toBe(true);
    expect(decisionFor("/setting", true)).toBe(true);
  });

  it("keeps login public for logged-out users and redirects authenticated users to dashboard", () => {
    expect(decisionFor("/login", false)).toBe(true);

    const authenticatedLoginDecision = decisionFor("/login", true);

    expect(authenticatedLoginDecision).toBeInstanceOf(Response);
    expectRedirectTo(authenticatedLoginDecision as Response, "/dashboard");
  });

  it("uses login as the explicit sign-out redirect target", () => {
    expect(SIGN_OUT_REDIRECT_PATH).toBe("/login");
  });

  it("preserves existing root redirects", () => {
    const loggedOutRootDecision = decisionFor("/", false);
    const loggedInRootDecision = decisionFor("/", true);

    expect(loggedOutRootDecision).toBeInstanceOf(Response);
    expect(loggedInRootDecision).toBeInstanceOf(Response);
    expectRedirectTo(loggedOutRootDecision as Response, "/login");
    expectRedirectTo(loggedInRootDecision as Response, "/dashboard");
  });

  it("does not classify infrastructure routes as protected app pages", () => {
    expect(isInfrastructureRoute("/api/auth/session")).toBe(true);
    expect(isInfrastructureRoute("/api/import-csv")).toBe(true);
    expect(isInfrastructureRoute("/_next/static/chunks/app.js")).toBe(true);
    expect(isInfrastructureRoute("/_next/image")).toBe(true);
    expect(isInfrastructureRoute("/logo.png")).toBe(true);

    expect(decisionFor("/api/auth/session", false)).toBe(true);
    expect(decisionFor("/_next/static/chunks/app.js", false)).toBe(true);
    expect(decisionFor("/_next/image", false)).toBe(true);
    expect(decisionFor("/logo.png", false)).toBe(true);
  });

  it("exposes protected route classification in one place", () => {
    expect(isProtectedAppRoute("/dashboard")).toBe(true);
    expect(isProtectedAppRoute("/balance/create")).toBe(true);
    expect(isProtectedAppRoute("/setting")).toBe(true);
    expect(isProtectedAppRoute("/login")).toBe(false);
    expect(isProtectedAppRoute("/api/auth/session")).toBe(false);
  });
});
