import { describe, it, expect } from "vitest";
import {
  getCenterBySiteId,
  getCenterByTestCenterId,
  getRealTestCenterNameById,
  getCentersByCity,
  searchCenters,
  isGenericCenterName,
  resolveCenterDisplayName,
} from "./real-test-centers";

describe("real-test-centers lookup", () => {
  it("finds a known center by site_id", () => {
    const center = getCenterBySiteId(54);
    expect(center).toBeDefined();
    expect(center?.name).toBe("Rajshahi Technical Training Centre");
  });

  it("finds a known center by test_center_id", () => {
    const center = getCenterByTestCenterId(115);
    expect(center).toBeDefined();
    expect(center?.city).toBe("Dhaka");
  });

  it("returns the correct name via getRealTestCenterNameById", () => {
    expect(getRealTestCenterNameById(17)).toBe("Bangladesh Korea TTC Dhaka");
    expect(getRealTestCenterNameById("71")).toBe("Sylhet Technical Training Center");
  });

  it("returns centers by city and supports search", () => {
    const dhaka = getCentersByCity("Dhaka");
    expect(dhaka.length).toBeGreaterThan(0);
    expect(searchCenters("Gazipur")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "BRTC Central Training Institute Gazipur" }),
      ])
    );
  });

  it("returns undefined for unknown ids", () => {
    expect(getRealTestCenterNameById(9999)).toBeUndefined();
  });

  it("detects generic placeholder names", () => {
    expect(isGenericCenterName(undefined)).toBe(true);
    expect(isGenericCenterName("Unnamed")).toBe(true);
    expect(isGenericCenterName("Unknown Center")).toBe(true);
    expect(isGenericCenterName("Dhaka Center", "Dhaka")).toBe(true);
    expect(isGenericCenterName("Dhaka Exam Center", "Dhaka")).toBe(true);
    expect(isGenericCenterName("Dhaka (Site #17)", "Dhaka")).toBe(true);
    expect(isGenericCenterName("Bangladesh Korea TTC Dhaka", "Dhaka")).toBe(false);
    expect(isGenericCenterName("Rajshahi Technical Training Centre", "Rajshahi")).toBe(false);
  });

  it("resolves real display name from generic name via IDs", () => {
    expect(resolveCenterDisplayName("Dhaka Exam Center", "Dhaka", 17)).toBe(
      "Bangladesh Korea TTC Dhaka"
    );
    expect(resolveCenterDisplayName("Unknown Center", null, null, "54")).toBe(
      "Rajshahi Technical Training Centre"
    );
    // keeps a real API-provided name untouched
    expect(resolveCenterDisplayName("Some Real API Center", "Dhaka", 17)).toBe(
      "Some Real API Center"
    );
    // falls back to original when no ID matches
    expect(resolveCenterDisplayName("Khulna Center", "Khulna", 9999)).toBe("Khulna Center");
    expect(resolveCenterDisplayName(undefined, null)).toBe("Unknown Center");
  });
});
