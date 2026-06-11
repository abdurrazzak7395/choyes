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
// Session B's detail stays unresolved.
const SESSION_A = 8800001;
const SESSION_B = 8800002;

describe("BookingPage strict mode: session row only shows the selected center's sessions", () => {
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

  it("auto-selects the center with confirmed sessions and lists ONLY its sessions", async () => {
    render(
      <MemoryRouter initialEntries={[`/exam/booking?occupationId=7&categoryId=99&siteCity=Dhaka&examDate=2026-07-20`]}>
        <BookingPage />
      </MemoryRouter>
    );

    // Real-center dropdown appears with session counts; Narsingdi (#218) auto-selected
    await waitFor(() => {
      const tc = findCenterSelect();
      expect(tc, "expected real-center dropdown").toBeTruthy();
      expect(tc!.value).toBe("real-218");
      const selectedOpt = Array.from(tc!.options).find((o) => o.value === "real-218")!;
      expect(selectedOpt.text).toContain("Narsingdi");
      expect(selectedOpt.text).toContain("Sessions: 1");
    }, { timeout: 8000, interval: 50 });

    // Session dropdown shows ONLY session A (resolved to #218), not session B
    await waitFor(() => {
      const selects = Array.from(document.querySelectorAll("select")) as HTMLSelectElement[];
      const sess = selects.find((sel) =>
        Array.from(sel.options).some((o) => o.value === String(SESSION_A))
      );
      expect(sess, "expected session select containing session A").toBeTruthy();
      const values = Array.from(sess!.options).map((o) => o.value).filter(Boolean);
      expect(values).toContain(String(SESSION_A));
      expect(values).not.toContain(String(SESSION_B));
    }, { timeout: 8000, interval: 50 });
  }, 15000);

  it("shows NO sessions + a note when the selected center has no confirmed sessions", async () => {
    render(
      <MemoryRouter initialEntries={[`/exam/booking?occupationId=7&categoryId=99&siteCity=Dhaka&examDate=2026-07-20`]}>
        <BookingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const tc = findCenterSelect();
      expect(tc?.value).toBe("real-218");
    }, { timeout: 8000, interval: 50 });

    // Switch to a different real center (Kishoreganj #220 — no confirmed sessions)
    const tc = findCenterSelect()!;
    fireEvent.change(tc, { target: { value: "real-220" } });

    await waitFor(() => {
      const note = document.querySelector('[data-testid="no-center-sessions-note"]');
      expect(note, "expected hidden-sessions note").toBeTruthy();
      // No session option from other centers leaks into the dropdown
      const selects = Array.from(document.querySelectorAll("select")) as HTMLSelectElement[];
      const leaked = selects.some((sel) =>
        Array.from(sel.options).some((o) => o.value === String(SESSION_A) || o.value === String(SESSION_B))
      );
      expect(leaked).toBe(false);
      // The "no sessions" center option is labeled accordingly
      const opt = Array.from(findCenterSelect()!.options).find((o) => o.value === "real-220")!;
      expect(opt.text).toContain("No confirmed sessions");
    }, { timeout: 8000, interval: 50 });
  }, 15000);
});
