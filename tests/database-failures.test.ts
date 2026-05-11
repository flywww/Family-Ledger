import { describe, expect, it, vi } from "vitest";

import {
  getSafeCriticalDatabaseMessage,
  logAndThrowCriticalDatabaseFailure,
} from "../lib/database-failures";

describe("critical database failure handling", () => {
  it("throws a safe page error without leaking host or credential details", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const message =
      "Can't reach database server at ep-long-name-pooler.ap-southeast-1.aws.neon.tech with password=secret";

    expect(getSafeCriticalDatabaseMessage("monthly balance data")).not.toContain("neon.tech");
    expect(getSafeCriticalDatabaseMessage("monthly balance data")).not.toContain("secret");
    expect(() => logAndThrowCriticalDatabaseFailure("monthly balance data", new Error(message))).toThrow(
      "Database temporarily unavailable while loading monthly balance data. Please try again later.",
    );

    consoleSpy.mockRestore();
  });

  it("keeps raw failure detail in server-side logging", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Can't reach database server at ep-example-pooler");

    expect(() => logAndThrowCriticalDatabaseFailure("dashboard value data", error)).toThrow(
      "Database temporarily unavailable while loading dashboard value data. Please try again later.",
    );
    expect(consoleSpy).toHaveBeenCalledWith("[critical-database-failure]", {
      operation: "dashboard value data",
      error,
    });

    consoleSpy.mockRestore();
  });
});
