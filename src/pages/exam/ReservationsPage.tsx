import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getBackendUrl } from "@/lib/api";
import { pickArray } from "@/lib/booking-utils";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";

function value(item: any, keys: string[]): string {
  for (const key of keys) {
    if (item?.[key] != null && item[key] !== "") return String(item[key]);
    if (item?.data?.[key] != null) return String(item.data[key]);
    if (item?.exam_session?.[key] != null) return String(item.exam_session[key]);
    if (item?.test_center?.[key] != null) return String(item.test_center[key]);
  }
  return "";
}

const getId = (i: any) => value(i, ["id", "reservation_id", "exam_reservation_id"]);
const getOccId = (i: any) => value(i, ["occupation_id"]) || i?.occupation?.id || "";
const getMethod = (i: any) => value(i, ["methodology_type", "methodology"]) || "in_person";
const getStatus = (i: any) => value(i, ["reservation_status", "status", "payment_status"]) || "Unknown";
const getDate = (i: any) => value(i, ["exam_date", "scheduled_at", "date", "test_date", "start_at"]) || i?.exam_session?.test_date || "";
const getCenter = (i: any) => value(i, ["test_center_name", "name", "site_city"]) || i?.exam_session?.test_center?.name || "-";
const getSiteId = (i: any) => value(i, ["site_id"]) || i?.exam_session?.test_center?.site_id || "";
const getLang = (i: any) => value(i, ["language_code", "prometric_code"]) || "-";
const getSessionId = (i: any) => value(i, ["exam_session_id"]) || i?.exam_session?.id || "";

export default function ReservationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [error, setError] = useState("");

  async function loadReservations() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/svp/exam-reservations?locale=en");
      const list = pickArray(data);
      setItems(list);
      if (!list.length) setError("No booked reservations found.");
    } catch (err: any) {
      setItems([]);
      setError(err?.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReservations(); }, []);

  async function startReschedule(item: any) {
    const rid = getId(item);
    const oid = getOccId(item);
    if (!rid || !oid) { setError("Missing reservation/occupation ID"); return; }
    setLoadingId(rid);
    setError("");
    try {
      await api("/api/svp/reservation-credits/use", {
        method: "POST",
        body: {
          methodology_type: getMethod(item),
          reservation_id: Number(rid),
          occupation_id: Number(oid),
        },
      });
      const params = new URLSearchParams({
        reschedule: "1",
        reservationId: rid,
        occupationId: oid,
        methodology: getMethod(item),
        examDate: getDate(item),
        siteId: getSiteId(item),
        siteCity: value(item, ["site_city", "city"]),
        languageCode: getLang(item),
      });
      navigate(`/exam/booking?${params}`);
    } catch (err: any) {
      setError(err?.message || "Failed to start reschedule");
    } finally {
      setLoadingId("");
    }
  }

  async function downloadTicket(item: any) {
    const rid = getId(item);
    if (!rid) { setError("Missing reservation ID"); return; }
    setDownloadingId(rid);
    setError("");
    try {
      const accessToken = localStorage.getItem("accessToken");
      const base = getBackendUrl();
      const response = await fetch(`${base}/api/svp/tickets/${encodeURIComponent(rid)}/show-pdf?locale=en`, {
        method: "GET",
        headers: {
          Accept: "*/*",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text() || "Failed to download");

      const ct = response.headers.get("content-type") || "";
      const disp = response.headers.get("content-disposition") || "";
      const fnMatch = disp.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
      const fileName = fnMatch ? decodeURIComponent(fnMatch[1]) : `ticket-${rid}.pdf`;

      const trigger = (href: string, name: string) => {
        const a = document.createElement("a");
        a.href = href; a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      };

      if (ct.includes("application/json")) {
        const data = await response.json();
        const url = data?.url || data?.pdf_url || data?.data?.url || data?.data?.pdf_url;
        if (url) { trigger(String(url), fileName); return; }
        throw new Error("PDF URL not found");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      trigger(blobUrl, fileName);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err: any) {
      setError(err?.message || "Failed to download ticket");
    } finally {
      setDownloadingId("");
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl p-6 animate-fade-in">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">My bookings</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Booked Exams</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your existing reservations appear here automatically.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard"><Button variant="outline" size="sm">Dashboard</Button></Link>
            <Button variant="outline" size="sm" onClick={loadReservations} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {loading && <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">Loading reservations...</div>}
        {!loading && !items.length && !error && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">No reservations found.</div>
        )}

        <div className="grid gap-4">
          {items.map((item) => {
            const rid = getId(item);
            return (
              <div key={rid || Math.random()} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">#{rid || "-"}</h2>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {getStatus(item)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: "Test center", val: getCenter(item) },
                    { label: "Exam date", val: getDate(item) || "-" },
                    { label: "Occupation ID", val: getOccId(item) || "-" },
                    { label: "Session ID", val: getSessionId(item) || "-" },
                    { label: "Language", val: getLang(item) },
                    { label: "Site ID", val: getSiteId(item) || "-" },
                  ].map((d) => (
                    <div key={d.label}>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{d.label}</span>
                      <strong className="mt-0.5 block text-sm text-foreground">{d.val}</strong>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  {item?.can_be_rescheduled && (
                    <Button size="sm" variant="outline" onClick={() => startReschedule(item)} disabled={loadingId === rid}>
                      {loadingId === rid ? "Processing..." : "Reschedule"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => downloadTicket(item)} disabled={downloadingId === rid}>
                    {downloadingId === rid ? "Downloading..." : "Download Ticket"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
