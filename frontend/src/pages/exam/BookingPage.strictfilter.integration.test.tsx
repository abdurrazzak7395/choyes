import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const apiMock = vi.fn();
vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
  getSession: () => ({ accessToken: "test-token" }),
  getBackendUrl: () => "http://localhost",
}));

// Local DB returns nothing — static REAL_TEST_CENTERS list drives the dropdown.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: async () => ({ data: [], error: null }),
        ilike: async () => ({ data: [], error: null }),
      }),
    }),
  },
}));

import BookingPage from "./BookingPage";

// Two placeholder sessions (SVP hides center identity pre-booking).
// Session A's detail resolves to test_center_id 218 (Narsingdi TTC, Dhaka).
// Session B's detail stays undisclosed.
const SESSION_A = 8800001;
const SESSION_B = 8800002;

describe("BookingPage: STRICT 1:1 — center selection shows ONLY sessions whose resolved test_center_id matches; undisclosed sessions hidden", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation(async (path: string) => {
      if (path.startsWith("/occupations")) return new Promise(() => {});
      if (path.startsWith("/user-balance")) return { reservation_credits: 0, free_certificates_total: 0 };
      if (path.startsWith("/available-dates")) return { data: [{ date: "2026-07-20", city: "Dhaka" }] };
      if (path.startsWith("/exam-sessions?")) {
        return {
          exam_sessions: [
            { id: SESSION_A, available_seats: 4, site_city: "Dhaka" },
            { id: SESSION_B, available_seats: 2, site_city: "Dhaka" },
          ],
        };
      }
      if (path.startsWith(`/exam-sessions/${SESSION_A}`)) {
        return {
          exam_session: {
            id: SESSION_A,
            test_center: { test_center_id: 218, name: "Narsingdi Technical Training Center" },
          },
        };
      }
      if (path.startsWith(`/exam-sessions/${SESSION_B}`)) {
        return { exam_session: { id: SESSION_B, test_center: {} } };
      }
      if (path.startsWith("/test-centers/")) return { test_center: {} };
      return { data: [] };
    });
  });

  function findCenterSelect(): HTMLSelectElement | undefined {
    const selects = Array.from(document.querySelectorAll("select")) as HTMLSelectElement[];
    return selects.find((sel) =>
      Array.from(sel.options).some((o) => o.value.startsWith("real-"))
    );
  }
  function sessionValues(tc: HTMLSelectElement): string[] {
    const selects = Array.from(document.querySelectorAll("select")) as HTMLSelectElement[];
    const ss = selects[selects.indexOf(tc) + 1];
    return ss ? Array.from(ss.options).map((o) => o.value).filter(Boolean) : [];
  }

  it("center dropdown lists ONLY real centers with name + Site ID (no extra labels, no city-all)", async () => {
    render(
      <MemoryRouter initialEntries={[`/exam/booking?occupationId=7&categoryId=99&siteCity=Dhaka&examDate=2026-07-20`]}>
        <BookingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const tc = findCenterSelect();
      expect(tc, "expected real-center dropdown").toBeTruthy();
      const opts = Array.from(tc!.options).filter((o) => o.value);
      expect(opts.length).toBeGreaterThan(0);
      // Only real-{id} options, no city-all bucket
      expect(opts.every((o) => o.value.startsWith("real-"))).toBe(true);
      // Clean labels: "Name (Site #ID)" only — no Sessions counts
      expect(opts.every((o) => /\(Site #\d+\)$/.test(o.text.trim()))).toBe(true);
      expect(opts.some((o) => o.text.includes("Sessions:") || o.text.includes("No confirmed sessions"))).toBe(false);
    }, { timeout: 8000, interval: 50 });
  }, 15000);

  it("STRICT: selected center shows ONLY its own confirmed session; undisclosed sessions are hidden", async () => {
    render(
      <MemoryRouter initialEntries={[`/exam/booking?occupationId=7&categoryId=99&siteCity=Dhaka&examDate=2026-07-20`]}>
        <BookingPage />
      </MemoryRouter>
    );

    // Pick Narsingdi #218 — only session A (confirmed #218) must appear.
    // Session B is undisclosed → hidden in strict mode.
    await waitFor(() => { expect(findCenterSelect()).toBeTruthy(); }, { timeout: 8000, interval: 50 });
    fireEvent.change(findCenterSelect()!, { target: { value: "real-218" } });
    await waitFor(() => {
      const tc = findCenterSelect()!;
      expect(tc.value).toBe("real-218");
      const values = sessionValues(tc);
      expect(values).toContain(String(SESSION_A));
      expect(values).not.toContain(String(SESSION_B));
    }, { timeout: 8000, interval: 50 });

    // Pick Kishoreganj #220 — session A belongs to #218 (hidden);
    // session B is undisclosed → also hidden in strict mode.
    fireEvent.change(findCenterSelect()!, { target: { value: "real-220" } });
    await waitFor(() => {
      const tc = findCenterSelect()!;
      expect(tc.value).toBe("real-220");
      const values = sessionValues(tc);
      expect(values).not.toContain(String(SESSION_A));
      expect(values).not.toContain(String(SESSION_B));
      const note = document.querySelector('[data-testid="no-center-sessions-note"]');
      expect(note, "expected other-center note when no sessions match").toBeTruthy();
    }, { timeout: 8000, interval: 50 });
  }, 15000);
});

describe("BookingPage: note shown when every session belongs to other centers", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation(async (path: string) => {
      if (path.startsWith("/occupations")) return new Promise(() => {});
      if (path.startsWith("/user-balance")) return { reservation_credits: 0, free_certificates_total: 0 };
      if (path.startsWith("/available-dates")) return { data: [{ date: "2026-07-20", city: "Dhaka" }] };
      if (path.startsWith("/exam-sessions?")) {
        return { exam_sessions: [{ id: SESSION_A, available_seats: 4, site_city: "Dhaka" }] };
      }
      if (path.startsWith(`/exam-sessions/${SESSION_A}`)) {
        return {
          exam_session: {
            id: SESSION_A,
            test_center: { test_center_id: 218, name: "Narsingdi Technical Training Center" },
          },
        };
      }
      if (path.startsWith("/test-centers/")) return { test_center: {} };
      return { data: [] };
    });
  });

  it("shows empty session row + note for a center whose date has only other-center sessions", async () => {
    render(
      <MemoryRouter initialEntries={[`/exam/booking?occupationId=7&categoryId=99&siteCity=Dhaka&examDate=2026-07-20`]}>
        <BookingPage />
      </MemoryRouter>
    );

    const find = () => {
      const selects = Array.from(document.querySelectorAll("select")) as HTMLSelectElement[];
      return selects.find((sel) => Array.from(sel.options).some((o) => o.value === "real-220"));
    };
    await waitFor(() => { expect(find()).toBeTruthy(); }, { timeout: 8000, interval: 50 });
    fireEvent.change(find()!, { target: { value: "real-220" } });

    await waitFor(() => {
      const selects = Array.from(document.querySelectorAll("select")) as HTMLSelectElement[];
      const tc = find()!;
      const ss = selects[selects.indexOf(tc) + 1];
      const values = Array.from(ss.options).map((o) => o.value).filter(Boolean);
      expect(values).not.toContain(String(SESSION_A));
      const note = document.querySelector('[data-testid="no-center-sessions-note"]');
      expect(note, "expected other-center note").toBeTruthy();
    }, { timeout: 8000, interval: 50 });
  }, 15000);
});
