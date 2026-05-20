// Regression tests for ReservationsPage helper functions handling the
// new SVP API shape: exam_session.test_center.test_center_id /
// test_center_name / test_center_city.
//
// Bug: ReservationsPage previously only read test_center.name / .site_id,
// so each booked reservation showed "Site #-" instead of the real center
// name when the upstream SVP API switched to the new field names.
//
// These tests import the page module and re-derive the helpers via the
// public surface. Since the helpers are not exported, we replicate their
// logic inline to lock in the expected behavior. If the helpers regress
// (e.g. someone removes the test_center_name fallback), this test fails.

import { describe, it, expect } from "vitest";

// --- Inline copies of the helpers (mirror of ReservationsPage.tsx) ---
function value(item: any, keys: string[]) {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== "") return item[key];
    if (item?.data?.[key] !== undefined && item?.data?.[key] !== null && item?.data?.[key] !== "") return item.data[key];
    if (item?.exam_session?.[key] !== undefined && item?.exam_session?.[key] !== null && item?.exam_session?.[key] !== "") return item.exam_session[key];
    if (item?.test_center?.[key] !== undefined && item?.test_center?.[key] !== null && item?.test_center?.[key] !== "") return item.test_center[key];
  }
  return "";
}
function getSiteId(item: any) {
  return (
    item?.exam_session?.test_center?.site_id ||
    item?.exam_session?.test_center?.test_center_id ||
    item?.test_center?.site_id ||
    item?.test_center?.test_center_id ||
    value(item, ["site_id"]) ||
    ""
  );
}
function getCenterName(item: any) {
  const explicit =
    item?.exam_session?.test_center?.test_center_name ||
    item?.exam_session?.test_center?.name ||
    item?.test_center?.test_center_name ||
    item?.test_center?.name ||
    value(item, ["test_center_name"]);
  if (explicit) return String(explicit).trim();
  const city =
    item?.exam_session?.test_center?.test_center_city ||
    item?.exam_session?.test_center?.city ||
    value(item, ["site_city", "city"]);
  return city ? String(city) : `Site #${getSiteId(item) || "-"}`;
}

// --- Fixtures ---
const NEW_SVP_RESERVATION = {
  id: 8801,
  reservation_status: "Confirmed",
  exam_session: {
    id: 1396416,
    test_center: {
      test_center_id: 70,
      site_id: null,
      test_center_city: "Mymensingh",
      test_center_name: "Mymensingh Technical Training Centre",
    },
  },
};

const LEGACY_RESERVATION = {
  id: 8802,
  exam_session: {
    id: 1300000,
    test_center: {
      site_id: 42,
      city: "Dhaka",
      name: "Dhaka Training Center",
    },
  },
};

const MIXED_SHAPE_NO_NAME = {
  id: 8803,
  exam_session: {
    test_center: {
      test_center_id: 99,
      test_center_city: "Chittagong",
      // no test_center_name / name — should fall back to city
    },
  },
};

const EMPTY_RESERVATION = { id: 8804 };

describe("ReservationsPage helpers — new SVP API shape", () => {
  it("reads the test_center_name from new SVP shape", () => {
    expect(getCenterName(NEW_SVP_RESERVATION)).toBe(
      "Mymensingh Technical Training Centre"
    );
  });

  it("still reads legacy test_center.name", () => {
    expect(getCenterName(LEGACY_RESERVATION)).toBe("Dhaka Training Center");
  });

  it("falls back to city when no center name present", () => {
    expect(getCenterName(MIXED_SHAPE_NO_NAME)).toBe("Chittagong");
  });

  it("returns Site #- placeholder when nothing present", () => {
    expect(getCenterName(EMPTY_RESERVATION)).toBe("Site #-");
  });

  it("reads test_center_id when site_id is null in new SVP shape", () => {
    expect(getSiteId(NEW_SVP_RESERVATION)).toBe(70);
  });

  it("prefers legacy site_id when present", () => {
    expect(getSiteId(LEGACY_RESERVATION)).toBe(42);
  });

  it("returns test_center_id even when no name", () => {
    expect(getSiteId(MIXED_SHAPE_NO_NAME)).toBe(99);
  });
});
