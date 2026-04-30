import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * MFFO-212: Admin-vy (ingen inloggning)
 * MFFO-55: Orderhistorik – tabell med filter
 *
 * Mörk bakgrund, tydliga kontraster, stora siffror.
 * Hämtar data från order_logs (skapas i MFFO-67).
 */

interface OrderLog {
  id: string;
  order_id: string;
  order_number: number;
  event_type: string;
  source: string;
  from_status: string | null;
  to_status: string | null;
  changes: Record<string, unknown> | null;
  duration_ms: number | null;
  created_at: string;
}

type SourceFilter = "alla" | "kiosk" | "kassa" | "kok" | "lucka";
type TypeFilter = "alla" | "tillagning" | "luck" | "special";

const PAGE_SIZE = 25;

const AdminPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  // Filter
  const [dateFilter, setDateFilter] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  const [hourRange, setHourRange] = useState<[number, number]>([0, 23]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("alla");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("alla");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("order_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);

      if (error) {
        // Sannolikt: tabell saknas
        setTableMissing(true);
        setLogs([]);
      } else {
        setLogs((data ?? []) as OrderLog[]);
      }
      setLoading(false);
    };
    load();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase as any)
      .channel("admin-order-logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_logs" },
        (payload: { new: OrderLog }) => {
          setLogs((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).removeChannel(channel);
    };
  }, []);

  // === Härled "type" från changes ===
  // tillagning = order har prep-items (avgörs av items i changes)
  // luck = order helt utan prep
  // special = någon item har customizations
  const inferType = (log: OrderLog): "tillagning" | "luck" | "special" | "unknown" => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changes = log.changes as any;
    const items: any[] | undefined = Array.isArray(changes?.items)
      ? changes.items
      : Array.isArray(changes?.items_after)
      ? changes.items_after
      : undefined;
    if (!items) return "unknown";

    const hasSpecial = items.some(
      (it: any) =>
        (it?.customizations?.added?.length ?? 0) +
          (it?.customizations?.removed?.length ?? 0) >
        0
    );
    if (hasSpecial) return "special";

    const NON_PREP = new Set(["9", "10", "11"]);
    const anyPrep = items.some(
      (it: any) =>
        it?.isPrep === true ||
        (!NON_PREP.has(String(it?.id)) && it?.category !== "dryck-tillbehor")
    );
    return anyPrep ? "tillagning" : "luck";
  };

  // === Filtrering ===
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const dt = new Date(l.created_at);
      const dateStr = dt.toISOString().slice(0, 10);
      if (dateStr !== dateFilter) return false;
      const hour = dt.getHours();
      if (hour < hourRange[0] || hour > hourRange[1]) return false;
      if (sourceFilter !== "alla" && l.source !== sourceFilter) return false;
      if (typeFilter !== "alla") {
        const t = inferType(l);
        if (t !== typeFilter) return false;
      }
      return true;
    });
  }, [logs, dateFilter, hourRange, typeFilter, sourceFilter]);

  // === Pagination ===
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [dateFilter, hourRange, typeFilter, sourceFilter]);

  // === Dagens stats (för översikt) ===
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = logs.filter(
      (l) => l.created_at.slice(0, 10) === today
    );
    const created = todayLogs.filter((l) => l.event_type === "created");
    const delivered = todayLogs.filter((l) => l.event_type === "delivered");
    const avgDuration =
      delivered.length > 0
        ? delivered.reduce((s, l) => s + (l.duration_ms ?? 0), 0) /
          delivered.length
        : 0;

    const byHour = new Map<number, number>();
    for (let h = 0; h < 24; h++) byHour.set(h, 0);
    for (const c of created) {
      const h = new Date(c.created_at).getHours();
      byHour.set(h, (byHour.get(h) ?? 0) + 1);
    }
    const peakEntry = Array.from(byHour.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      total: created.length,
      avgMinutes: avgDuration / 60000,
      byHour,
      peakHour: peakEntry?.[1] ? peakEntry[0] : null,
    };
  }, [logs]);

  const maxHourCount = Math.max(1, ...Array.from(todayStats.byHour.values()));

  // === Hjälpformat ===
  const fmtDuration = (ms: number | null) => {
    if (!ms) return "—";
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}m ${sec}s`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white"
            >
              ← Tillbaka
            </button>
            <h1 className="text-3xl font-bold">📊 Admin – Orderhistorik</h1>
          </div>
        </div>

        {tableMissing && (
          <div className="bg-yellow-900/40 border border-yellow-700 text-yellow-200 p-4 rounded-lg mb-6">
            <strong>Tabellen <code>order_logs</code> saknas.</strong> Kör
            migrationen <code>supabase/manual-migrations/20260430_order_logs.sql</code>{" "}
            i Lovable Cloud / Supabase för att aktivera loggningen.
          </div>
        )}

        {/* === MFFO-212: Övergripande stats för dagen === */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Ordrar idag" value={String(todayStats.total)} />
          <StatCard
            label="Snitt-tid (beställning → leverans)"
            value={
              todayStats.avgMinutes > 0
                ? `${todayStats.avgMinutes.toFixed(1)} min`
                : "—"
            }
          />
          <StatCard
            label="Mest belastad timme"
            value={
              todayStats.peakHour !== null
                ? `${String(todayStats.peakHour).padStart(2, "0")}:00`
                : "—"
            }
          />
        </section>

        {/* Timdiagram */}
        <section className="bg-gray-900 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-bold mb-4">
            Ordrar per timme (idag)
          </h2>
          <div className="flex items-end gap-1 h-40">
            {Array.from(todayStats.byHour.entries()).map(([h, count]) => (
              <div
                key={h}
                className="flex-1 flex flex-col items-center justify-end"
                title={`${String(h).padStart(2, "0")}:00 – ${count} ordrar`}
              >
                <div
                  className="w-full bg-amber-500 rounded-t transition-all"
                  style={{
                    height: `${(count / maxHourCount) * 100}%`,
                    minHeight: count > 0 ? "4px" : "0px",
                  }}
                />
                <span className="text-[10px] text-gray-400 mt-1">{h}</span>
              </div>
            ))}
          </div>
        </section>

        {/* === MFFO-55: Filter + tabell === */}
        <h2 className="text-xl font-bold mb-3">Sammanfattning – orderhistorik</h2>
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Datum</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-gray-800 text-white rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Tid på dygnet: {String(hourRange[0]).padStart(2, "0")}–
              {String(hourRange[1]).padStart(2, "0")}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min={0}
                max={23}
                value={hourRange[0]}
                onChange={(e) =>
                  setHourRange([Number(e.target.value), hourRange[1]])
                }
                className="flex-1"
              />
              <input
                type="range"
                min={0}
                max={23}
                value={hourRange[1]}
                onChange={(e) =>
                  setHourRange([hourRange[0], Number(e.target.value)])
                }
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Typ av beställning
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="w-full bg-gray-800 text-white rounded px-3 py-2"
            >
              <option value="alla">Alla</option>
              <option value="tillagning">Enbart tillagning</option>
              <option value="luck">Enbart luck-ordrar</option>
              <option value="special">Specialbeställningar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Källa</label>
            <select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(e.target.value as SourceFilter)
              }
              className="w-full bg-gray-800 text-white rounded px-3 py-2"
            >
              <option value="alla">Alla</option>
              <option value="kiosk">Kiosk</option>
              <option value="kassa">Kassa</option>
              <option value="kok">Kök</option>
              <option value="lucka">Lucka</option>
            </select>
          </div>
        </section>

        {/* Tabell */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="text-left px-4 py-3">Order #</th>
                <th className="text-left px-4 py-3">Datum & tid</th>
                <th className="text-left px-4 py-3">Händelse</th>
                <th className="text-left px-4 py-3">Källa</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Tid (duration)</th>
                <th className="text-left px-4 py-3">Innehåll</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Laddar…
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Ingen data matchar filtret.
                  </td>
                </tr>
              ) : (
                pageRows.map((log) => {
                  // MFFO-55: röd markering om duration > 15 min
                  const slow =
                    log.duration_ms !== null && log.duration_ms > 15 * 60 * 1000;
                  const isOpen = expanded === log.id;
                  return (
                    <tr
                      key={log.id}
                      className="border-t border-gray-800 hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 font-bold">
                        #{log.order_number}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {new Date(log.created_at).toLocaleString("sv-SE")}
                      </td>
                      <td className="px-4 py-3">{log.event_type}</td>
                      <td className="px-4 py-3 capitalize">{log.source}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {log.from_status ?? "—"} → {log.to_status ?? "—"}
                      </td>
                      <td
                        className={`px-4 py-3 ${
                          slow ? "text-red-400 font-bold" : ""
                        }`}
                      >
                        {fmtDuration(log.duration_ms)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            setExpanded(isOpen ? null : log.id)
                          }
                          className="text-amber-400 hover:underline"
                        >
                          {isOpen ? "Dölj" : "Visa detaljer"}
                        </button>
                        {isOpen && (
                          <pre className="mt-2 bg-gray-950 p-3 rounded text-xs overflow-x-auto max-w-md">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50">
            <span className="text-xs text-gray-400">
              Visar {pageRows.length} av {filtered.length} (sida {page}/
              {totalPages})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-gray-700 disabled:opacity-30"
              >
                ← Föregående
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-gray-700 disabled:opacity-30"
              >
                Nästa →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-900 rounded-lg p-5">
    <div className="text-xs text-gray-400 mb-2">{label}</div>
    <div className="text-3xl font-bold">{value}</div>
  </div>
);

export default AdminPage;
