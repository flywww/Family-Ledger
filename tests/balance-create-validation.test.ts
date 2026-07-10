import { describe, expect, test } from "vitest";

import { BalanceCreateFormSchema, BalanceCreateSchema } from "../lib/definitions";

const validCreatePayload = {
  date: new Date("2026-07-01T00:00:00.000Z"),
  holdingId: 1,
  quantity: 2,
  price: 10,
  value: 20,
  currency: "USD",
};

describe("balance create validation", () => {
  test("client form validation does not require a user id", () => {
    const parsed = BalanceCreateFormSchema.safeParse(validCreatePayload);

    expect(parsed.success).toBe(true);
  });

  test("server create validation still requires a user id", () => {
    const parsed = BalanceCreateSchema.safeParse(validCreatePayload);

    expect(parsed.success).toBe(false);
    expect(parsed.error.flatten().fieldErrors.userId).toContain("Required");
  });
});
