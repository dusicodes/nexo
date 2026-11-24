import { describe, expect, it } from "vitest";
import {
  isEmailAllowed as isEmailAllowedIn,
  parseAllowlist,
  rejectUnlistedEmails,
} from "@/lib/auth-allowlist";

const isEmailAllowed = (email: string | undefined, raw: string) =>
  isEmailAllowedIn(email, parseAllowlist(raw));

describe("isEmailAllowed", () => {
  it("allows an email that is on the allowlist", () => {
    expect(isEmailAllowed("owner@example.com", "owner@example.com")).toBe(true);
  });

  it("rejects an email that is not on the allowlist", () => {
    expect(isEmailAllowed("intruder@example.com", "owner@example.com")).toBe(
      false,
    );
  });

  it("ignores letter case on both sides", () => {
    expect(isEmailAllowed("Owner@Example.COM", "owner@example.com")).toBe(true);
    expect(isEmailAllowed("owner@example.com", "OWNER@EXAMPLE.COM")).toBe(true);
  });

  it("ignores surrounding whitespace in the allowlist entries", () => {
    expect(
      isEmailAllowed("owner@example.com", "  owner@example.com  "),
    ).toBe(true);
  });

  it("accepts any address in a comma-separated list", () => {
    const list = "first@example.com, second@example.com ,third@example.com";

    expect(isEmailAllowed("first@example.com", list)).toBe(true);
    expect(isEmailAllowed("second@example.com", list)).toBe(true);
    expect(isEmailAllowed("third@example.com", list)).toBe(true);
    expect(isEmailAllowed("fourth@example.com", list)).toBe(false);
  });

  it("rejects everyone when the list has no addresses", () => {
    expect(isEmailAllowed("owner@example.com", ",  ,")).toBe(false);
    expect(isEmailAllowed("owner@example.com", "   ")).toBe(false);
    expect(isEmailAllowed("owner@example.com", "")).toBe(false);
  });

  it("rejects a missing email", () => {
    expect(isEmailAllowed(undefined, "owner@example.com")).toBe(false);
    expect(isEmailAllowed("", "owner@example.com")).toBe(false);
  });

  it("requires an exact match, not a substring or prefix", () => {
    expect(isEmailAllowed("owner@example.com.evil.net", "owner@example.com")).toBe(
      false,
    );
    expect(isEmailAllowed("xowner@example.com", "owner@example.com")).toBe(false);
  });

  it("returns the not-authorized error from the validateUserInfo hook", () => {
    const validate = rejectUnlistedEmails(parseAllowlist("owner@example.com"));

    expect(validate({ user: { email: "owner@example.com" } })).toBeUndefined();
    expect(validate({ user: { email: "intruder@example.com" } })).toMatchObject({
      error: "not_authorized",
    });
  });
});
