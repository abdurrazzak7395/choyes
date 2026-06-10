import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { pickArray, normalizeOccupation } from "@/lib/booking-utils";

export default function ReservationFlowPage() {
  // Step 1 — Hold (temporary_seats)
  const [encryptedSessionId, setEncryptedSessionId] = useState("");
  const [methodology, setMethodology] = useState("in_person");
  const [holdLoading, setHoldLoading] = useState(false);
  const [holdResp, setHoldResp] = useState<any>(null);
  const [holdError, setHoldError] = useState("");

  // Real numeric exam_session_id extracted from hold
  const [realExamSessionId, setRealExamSessionId] = useState<number | null>(null);
  const [testCenter, setTestCenter] = useState<any>(null);

  // Step 2 — Occupations
  const [occupations, setOccupations] = useState<any[]>([]);
  const [loadingOccupations, setLoadingOccupations] = useState(false);
  const [selectedOccupationId, setSelectedOccupationId] = useState("");
  const [occupationSearch, setOccupationSearch] = useState("");

  // Step 3 — Reservation
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationResp, setReservationResp] = useState<any>(null);
  const [reservationError, setReservationError] = useState("");

  const selectedOccupation = useMemo(
    () => occupations.find((o) => String(o.id) === String(selectedOccupationId)) || null,
    [occupations, selectedOccupationId]
  );

  const filteredOccupations = useMemo(() => {
    if (!occupationSearch) return occupations;
    const q = occupationSearch.toLowerCase();
    return occupations.filter((o) => o.name?.toLowerCase().includes(q));
  }, [occupations, occupationSearch]);

  // Load occupations once
  useEffect(() => {
    (async () => {
      setLoadingOccupations(true);
      try {
        const perPage = 200;
        const all: any[] = [];
        for (let page = 1; page <= 50; page++) {
          const data = await api(`/occupations?locale=en&per_page=${perPage}&page=${page}`);
          const arr = pickArray(data);
          if (!arr.length) break;
          all.push(...arr);
          if (arr.length < perPage) break;
        }
        const seen = new Set<string>();
        const unique = all.filter((it) => {
          const k = String(it?.id ?? "");
          if (!k || seen.has(k)) return false;
          seen.add(k); return true;
        });
        setOccupations(unique.map(normalizeOccupation));
      } catch {/* ignore */}
      finally { setLoadingOccupations(false); }
    })();
  }, []);

  function extractExamSessionId(data: any): number | null {
    if (!data) return null;
    const cand =
      data?.exam_session_id ??
      data?.data?.exam_session_id ??
      data?.exam_session?.id ??
      data?.data?.exam_session?.id ??
      (Array.isArray(data?.exam_sessions) ? data.exam_sessions[0]?.id : null) ??
      (Array.isArray(data?.temporary_seats) ? data.temporary_seats[0]?.exam_session_id : null) ??
      data?.id;
    const n = Number(cand);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function extractTestCenter(data: any): any {
    return (
      data?.exam_session?.test_center ??
      data?.data?.exam_session?.test_center ??
      data?.test_center ??
      (Array.isArray(data?.exam_sessions) ? data.exam_sessions[0]?.test_center : null) ??
      null
    );
  }

  function extractOccupationId(data: any): string {
    const cand =
      data?.occupation_id ??
      data?.data?.occupation_id ??
      data?.exam_session?.occupation_id ??
      data?.exam_session?.occupation?.id ??
      data?.data?.exam_session?.occupation_id ??
      data?.data?.exam_session?.occupation?.id ??
      (Array.isArray(data?.exam_sessions) ? data.exam_sessions[0]?.occupation_id ?? data.exam_sessions[0]?.occupation?.id : null) ??
      (Array.isArray(data?.temporary_seats) ? data.temporary_seats[0]?.occupation_id : null);
    return cand ? String(cand) : "";
  }

  function extractMethodology(data: any): string {
    return (
      data?.methodology ??
      data?.data?.methodology ??
      data?.exam_session?.methodology ??
      data?.data?.exam_session?.methodology ??
      (Array.isArray(data?.exam_sessions) ? data.exam_sessions[0]?.methodology : null) ??
      ""
    );
  }

  async function handleCreateHold() {
    setHoldError(""); setHoldResp(null); setRealExamSessionId(null); setTestCenter(null);
    const token = encryptedSessionId.trim();
    if (!token) { setHoldError("Enter the encrypted exam_session_id token"); return; }
    setHoldLoading(true);
    try {
      const body = { exam_session_id: [token], methodology };
      const data: any = await api(`/temporary-seats`, { method: "POST", body });
      setHoldResp(data);
      const id = extractExamSessionId(data);
      setRealExamSessionId(id);
      setTestCenter(extractTestCenter(data));
      // Auto-fill occupation_id and methodology from hold response
      const occId = extractOccupationId(data);
      if (occId) setSelectedOccupationId(occId);
      const m = extractMethodology(data);
      if (m) setMethodology(m);
      if (!id) {
        setHoldError("Hold created but could not find a numeric exam_session_id in response.");
      } else if (occId) {
        // Auto-submit reservation with only exam_session_id and occupation_id
        await submitReservation(id, occId);
      } else {
        setHoldError("Hold created but could not find occupation_id in response. Select one manually.");
      }
    } catch (err: any) {
      setHoldError(err?.message || "Failed to create hold");
    } finally { setHoldLoading(false); }
  }

  async function submitReservation(sessionId: number, occupationId: string | number) {
    setReservationError(""); setReservationResp(null);
    const body = {
      exam_session_id: Number(sessionId),
      occupation_id: Number(occupationId),
    };
    setReservationLoading(true);
    try {
      const data = await api(`/exam-reservations`, { method: "POST", body });
      setReservationResp(data);
    } catch (err: any) {
      setReservationError(err?.message || "Reservation failed");
    } finally { setReservationLoading(false); }
  }

  async function handleCreateReservation() {
    setReservationError(""); setReservationResp(null);
    if (!realExamSessionId) { setReservationError("Create a hold first to obtain real exam_session_id"); return; }
    if (!selectedOccupationId) { setReservationError("Select an occupation"); return; }
    // Minimal body per user request: only exam_session_id and occupation_id
    const body: Record<string, any> = {
      exam_session_id: Number(realExamSessionId),
      occupation_id: Number(selectedOccupationId),
    };
    setReservationLoading(true);
    try {
      const data = await api(`/exam-reservations`, { method: "POST", body });
      setReservationResp(data);
    } catch (err: any) {
      setReservationError(err?.message || "Reservation failed");
    } finally { setReservationLoading(false); }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Reservation Flow</h1>
          <p className="text-sm text-muted-foreground">
            Step 1: Create a hold using encrypted exam_session_id → get the real numeric ID & test center.
            Step 2: Pick an occupation → call exam_reservations.
          </p>
        </div>

        {/* Step 1 */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — Create Hold (temporary_seats)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Encrypted exam_session_id (token)</Label>
              <Input
                placeholder='e.g. ZSfm2N4Llw==--fVRzDX6XoETQXq0i--dEIP1pfKWfLloBPJoFCKog=='
                value={encryptedSessionId}
                onChange={(e) => setEncryptedSessionId(e.target.value)}
              />
            </div>
            <div>
              <Label>Methodology</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
              >
                <option value="in_person">in_person</option>
                <option value="online">online</option>
              </select>
            </div>
            <Button onClick={handleCreateHold} disabled={holdLoading}>
              {holdLoading ? "Creating hold..." : "Create Hold"}
            </Button>
            {holdError && <p className="text-sm text-destructive">{holdError}</p>}

            {realExamSessionId && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                <div><span className="font-medium">Real exam_session_id:</span> {realExamSessionId}</div>
                {testCenter && (
                  <>
                    <div><span className="font-medium">Test Center ID:</span> {testCenter.id ?? testCenter.test_center_id ?? "—"}</div>
                    <div><span className="font-medium">Test Center Name:</span> {testCenter.name ?? testCenter.test_center_name ?? "—"}</div>
                    <div><span className="font-medium">City:</span> {testCenter.city ?? testCenter.test_center_city ?? "—"}</div>
                    {testCenter.address && <div><span className="font-medium">Address:</span> {testCenter.address}</div>}
                  </>
                )}
              </div>
            )}
            {holdResp && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Raw hold response</summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-2">{JSON.stringify(holdResp, null, 2)}</pre>
              </details>
            )}
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2 — Select Occupation & Create Reservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Real exam_session_id</Label>
              <Input value={realExamSessionId ?? ""} readOnly placeholder="(create hold first)" />
            </div>
            <div>
              <Label>Occupation {loadingOccupations && <span className="text-xs text-muted-foreground">(loading...)</span>}</Label>
              <Input
                placeholder="Search occupation..."
                value={occupationSearch}
                onChange={(e) => setOccupationSearch(e.target.value)}
              />
              <select
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={selectedOccupationId}
                onChange={(e) => setSelectedOccupationId(e.target.value)}
              >
                <option value="">— Select occupation —</option>
                {filteredOccupations.slice(0, 500).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} (#{o.id})
                  </option>
                ))}
              </select>
              {selectedOccupation && (
                <p className="mt-1 text-xs text-muted-foreground">
                  language_code:{" "}
                  {selectedOccupation?.languageCodes?.[0]?.code ||
                    selectedOccupation?.language_codes?.[0]?.code ||
                    "LOABB"}
                </p>
              )}
            </div>

            <Button onClick={handleCreateReservation} disabled={reservationLoading || !realExamSessionId || !selectedOccupationId}>
              {reservationLoading ? "Submitting..." : "Create Reservation"}
            </Button>
            {reservationError && <p className="text-sm text-destructive">{reservationError}</p>}

            {reservationResp && (
              <div className="space-y-2">
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <div><span className="font-medium">Reservation ID:</span> {reservationResp?.id ?? "—"}</div>
                  <div><span className="font-medium">exam_session_id:</span> {reservationResp?.exam_session_id ?? "—"}</div>
                  <div><span className="font-medium">Status:</span> {reservationResp?.reservation_status ?? "—"}</div>
                  <div><span className="font-medium">Test Center:</span> {reservationResp?.test_center?.test_center_name ?? reservationResp?.exam_session?.test_center?.name ?? "—"}</div>
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Raw reservation response</summary>
                  <pre className="mt-2 max-h-96 overflow-auto rounded bg-muted p-2">{JSON.stringify(reservationResp, null, 2)}</pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
