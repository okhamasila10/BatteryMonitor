import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ref, set, remove } from "firebase/database";
import { db } from "./firebase.js";
import Sidebar from "./Sidebar.jsx";
import DataLogPage from "./pages/DataLogPage.jsx";
import CycleDataPage from "./pages/CycleDataPage.jsx";
import SohAnalysisPage from "./pages/SohAnalysisPage.jsx";
import MonitoringPage from "./pages/MonitoringPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import {
  useBatteryList,
  useBatteryData,
  useTransmissionDelay,
} from "./useBatteryData.js";

const SAMPLE_INTERVAL_MS = 15000;

const V_MIN = 2.3;
const V_MAX = 3.55;
function socFromVoltage(v) {
  const pct = ((v - V_MIN) / (V_MAX - V_MIN)) * 100;
  return Math.max(0, Math.min(100, pct));
}

const pad2 = (n) => String(n).padStart(2, "0");

function formatClock(ms) {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function formatLogTime(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function makeLabels(arr, ticks = 5) {
  if (arr.length < 2) return [];
  const first = arr[0].ts;
  const last = arr[arr.length - 1].ts;
  return Array.from({ length: ticks }, (_, i) =>
    formatClock(first + ((last - first) * i) / (ticks - 1)),
  );
}

// ── Modal overlay ────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-80 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function App() {
  const { ids: fbIds, online } = useBatteryList();
  const [extraBatteries, setExtraBatteries] = useState([]);
  const batteries = useMemo(
    () => Array.from(new Set([...fbIds, ...extraBatteries])),
    [fbIds, extraBatteries],
  );
  const [batteryId, setBatteryId] = useState("BAT-001");
  const [batteryConfirmed, setBatteryConfirmed] = useState(false);

  const effectiveId = batteries.includes(batteryId)
    ? batteryId
    : (batteries[0] ?? batteryId);

  const {
    live,
    telemetry,
    cycles: fbCycles,
    hasData,
  } = useBatteryData(effectiveId);

  const delay = useTransmissionDelay(effectiveId);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [active, setActive] = useState("Dashboard");
  const [rangeValue] = useState(5);
  const [rangeUnit] = useState("m");
  const [logStart, setLogStart] = useState("");
  const [logEnd, setLogEnd] = useState("");

  // Battery menu
  const [showBatteryMenu, setShowBatteryMenu] = useState(false);
  const [showBatterySelect, setShowBatterySelect] = useState(false);
  const menuRef = useRef(null);
  const batterySelectRef = useRef(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDraft, setAddDraft] = useState("");
  const [addError, setAddError] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPickModal, setShowPickModal] = useState(false);
  const [showNeedBatteryModal, setShowNeedBatteryModal] = useState(false);

  // Battery power / mode control
  const [batteryOn, setBatteryOn] = useState(false);
  const [controlMode, setControlMode] = useState("IDLE");

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowBatteryMenu(false);
      }
      if (
        batterySelectRef.current &&
        !batterySelectRef.current.contains(e.target)
      ) {
        setShowBatterySelect(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset control state ketika ganti battery
  useEffect(() => {
    setControlMode("IDLE");
    setBatteryOn(false);
  }, [effectiveId]);

  // Sync controlMode dari state ESP32 (live Firebase)
  // Sehingga tombol dan banner selalu reflect kondisi nyata ESP32
  useEffect(() => {
    if (!live?.state) return;
    if (live.state === "DISCHARGE" || live.state === "CHARGE") {
      setControlMode(live.state);
      setBatteryOn(true);
    } else if (live.state === "IDLE" || live.state === "DONE") {
      setControlMode("IDLE");
      setBatteryOn(false);
    }
  }, [live?.state]);

  // ── Firebase write helpers ──────────────────────────────────────────────────
  const addBatteryToFirebase = async (rawId) => {
    const id = String(rawId ?? "").trim().toUpperCase();
    if (!id) return false;
    try {
      await set(ref(db, `batteries/${id}/info`), {
        name: id,
        created_at: Date.now(),
        rated_capacity_mah: 0,
      });
    } catch {
      return false;
    }
    setExtraBatteries((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setBatteryId(id);
    setBatteryConfirmed(true);
    // Sync ke Firebase agar ESP32 tahu battery aktif saat ini
    set(ref(db, "esp32/active_id"), id).catch(() => {});
    return true;
  };

  const handleAddBattery = async () => {
    if (!addDraft.trim()) return;
    setAddSaving(true);
    setAddError("");
    const ok = await addBatteryToFirebase(addDraft);
    setAddSaving(false);
    if (ok) {
      setShowAddModal(false);
    } else {
      setAddError("Gagal simpan ke Firebase. Cek koneksi internet.");
    }
  };

  const deleteBatteryFromFirebase = async (id) => {
    try {
      await remove(ref(db, `batteries/${id}`));
    } catch {
      // ignore
    }
    setExtraBatteries((prev) => prev.filter((b) => b !== id));
    const next = batteries.filter((b) => b !== id);
    if (next.length) setBatteryId(next[0]);
    setBatteryConfirmed(false);
  };

  const writeBatteryControl = async (id, data) => {
    try {
      await set(ref(db, `batteries/${id}/control`), data);
    } catch {
      // offline
    }
  };

  // ── Battery menu actions ───────────────────────────────────────────────────
  const handleTogglePower = () => {
    const next = !batteryOn;
    setBatteryOn(next);
    if (!next) {
      setControlMode("IDLE");
      writeBatteryControl(effectiveId, { power: false, mode: "IDLE" });
    } else {
      writeBatteryControl(effectiveId, { power: true, mode: controlMode });
    }
  };

  const handleStartDischarge = () => {
    if (!batteryConfirmed && !fbIds.includes(effectiveId)) {
      setShowNeedBatteryModal(true);
      return;
    }
    setControlMode("DISCHARGE");
    writeBatteryControl(effectiveId, { power: true, mode: "DISCHARGE" });
    if (!batteryOn) setBatteryOn(true);
  };

  const handleStartCharge = () => {
    setControlMode("CHARGE");
    writeBatteryControl(effectiveId, { power: true, mode: "CHARGE" });
    if (!batteryOn) setBatteryOn(true);
  };

  const handleStopMode = () => {
    setControlMode("IDLE");
    writeBatteryControl(effectiveId, { power: batteryOn, mode: "IDLE" });
  };

  const handleSelectBattery = (id) => {
    setBatteryId(id);
    setBatteryConfirmed(true);
    setShowBatterySelect(false);
    set(ref(db, "esp32/active_id"), id).catch(() => {});
  };

  // ── Telemetry ──────────────────────────────────────────────────────────────
  const points = useMemo(() => {
    if (!telemetry.length) return [];
    return telemetry.map((s, i) => ({
      t: i,
      ts: Number(s.ts) || 0,
      voltage: Number(s.v) || 0,
      current: Number(s.i) || 0,
      temp: Number(s.temp) || 0,
      capacity: Number(s.cap) || 0,
      soc: socFromVoltage(Number(s.v) || 0),
      mode: s.mode ?? "",
    }));
  }, [telemetry]);

  const cycles = useMemo(() => {
    if (!fbCycles.length) return [];
    return fbCycles.map((c) => ({
      cycle: Number(c.cycle) || 0,
      soh: Number(c.soh) || 0,
      capacity: Number(c.capacity_mah) || 0,
      dischargeMin: ((Number(c.dis_samples) || 0) * SAMPLE_INTERVAL_MS) / 60000,
      chargeMin: ((Number(c.chg_samples) || 0) * SAMPLE_INTERVAL_MS) / 60000,
      tempMax: Number(c.temp_max) || 0,
      vMin: Number(c.v_min) || 0,
      vMax: Number(c.v_max) || 0,
    }));
  }, [fbCycles]);

  const latest = points[points.length - 1] ?? null;

  const telemetryChart = useMemo(() => ({
    voltage: points.map((p) => p.voltage),
    current: points.map((p) => p.current),
    temp: points.map((p) => p.temp),
    labels: makeLabels(points),
  }), [points]);

  const sohChart = useMemo(
    () => ({
      values: cycles.map((c) => c.soh),
      labels:
        cycles.length >= 2
          ? [
              `#${cycles[0].cycle}`,
              `#${cycles[Math.floor(cycles.length / 2)].cycle}`,
              `#${cycles[cycles.length - 1].cycle}`,
            ]
          : [],
    }),
    [cycles],
  );

  const voltage = Number(live?.voltage ?? latest?.voltage ?? 0);
  const current = Number(live?.current ?? latest?.current ?? 0);
  const temp = Number(live?.temp ?? latest?.temp ?? 0);
  const capacity = Number(live?.capacity_mah ?? latest?.capacity ?? 0);
  const soc = socFromVoltage(voltage);
  // Prioritas: (1) state aktif dari ESP32 via Firebase, (2) controlMode user (optimistic), (3) fallback IDLE
  const state = (live?.state && live.state !== "IDLE")
    ? live.state
    : controlMode !== "IDLE"
      ? controlMode
      : (live?.state ?? latest?.mode ?? "IDLE");

  const sohReady = cycles.length > 0;
  const sohNow = sohReady ? cycles[cycles.length - 1].soh : 0;
  const sohInitial = sohReady ? cycles[0].soh : 0;
  const capacityInitial = cycles[0]?.capacity ?? 0;
  const capacityNow = cycles[cycles.length - 1]?.capacity ?? 0;
  const degradation = sohReady ? Math.max(0, sohInitial - sohNow) : 0;

  const windowMs = useMemo(() => {
    const v = Number.isFinite(rangeValue) ? rangeValue : 5;
    if (rangeUnit === "h") return Math.max(1, v) * 3600 * 1000;
    if (rangeUnit === "m") return Math.max(1, v) * 60 * 1000;
    return Math.max(1, v) * 1000;
  }, [rangeUnit, rangeValue]);

  const windowPoints = useMemo(() => {
    if (active !== "Monitoring") return points;
    const last = points[points.length - 1];
    if (!last) return points;
    const end = last.ts;
    const filtered = points.filter(
      (p) => p.ts >= end - windowMs && p.ts <= end,
    );
    return filtered.length >= 2 ? filtered : points.slice(-2);
  }, [active, points, windowMs]);

  const buildTelemetryRows = useCallback((src) => {
    const ordered = src.slice().reverse();
    return ordered.map((p, idx) => {
      const prev = ordered[idx + 1];
      return {
        time: formatLogTime(p.ts),
        mode: p.mode || state,
        voltage: p.voltage,
        current: p.current,
        temp: p.temp,
        capacity: p.capacity,
        dVoltage: prev ? p.voltage - prev.voltage : null,
        dCurrent: prev ? p.current - prev.current : null,
        dTemp: prev ? p.temp - prev.temp : null,
        dCapacity: prev ? p.capacity - prev.capacity : null,
      };
    });
  }, [state]);

  const telemetryRows = useMemo(
    () => buildTelemetryRows(points),
    [points, buildTelemetryRows],
  );

  const monitoringRows = useMemo(
    () => buildTelemetryRows(windowPoints),
    [windowPoints, buildTelemetryRows],
  );

  const monitoringSummary = useMemo(() => {
    const src = windowPoints;
    if (!src.length) {
      return { voltage: 0, current: 0, temp: 0, capacity: 0, dVoltage: null, dCurrent: null, dTemp: null, dCapacity: null };
    }
    const first = src[0];
    const last = src[src.length - 1];
    const fmt = (v, d = 2) =>
      v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(d)}`;
    return {
      voltage: last.voltage,
      current: last.current,
      temp: last.temp,
      capacity: last.capacity,
      dVoltage: fmt(last.voltage - first.voltage, 3),
      dCurrent: fmt(last.current - first.current, 0),
      dTemp: fmt(last.temp - first.temp, 2),
      dCapacity: fmt(last.capacity - first.capacity, 1),
    };
  }, [windowPoints]);

  const cycleHistoryRows = useMemo(
    () =>
      cycles.map((c, i) => ({
        cycle: c.cycle,
        soh: c.soh,
        capacity: c.capacity,
        tempMax: c.tempMax,
        dSoh: i > 0 ? c.soh - cycles[i - 1].soh : null,
        dCapacity: i > 0 ? c.capacity - cycles[i - 1].capacity : null,
      })),
    [cycles],
  );

  const cycleRows = useMemo(
    () =>
      cycles.map((c) => ({
        cycle: c.cycle,
        soh: c.soh,
        capacityMah: c.capacity,
        dischargeMin: c.dischargeMin,
        chargeMin: c.chargeMin,
        tempMax: c.tempMax,
      })),
    [cycles],
  );

  const logRows = useMemo(() => {
    const startMs = logStart ? new Date(logStart).getTime() : null;
    const endMs = logEnd ? new Date(logEnd).getTime() : null;
    return points
      .slice()
      .reverse()
      .filter((p) => {
        if (startMs != null && p.ts < startMs) return false;
        if (endMs != null && p.ts > endMs) return false;
        return true;
      })
      .map((p) => ({
        time: formatLogTime(p.ts),
        mode: p.mode || "-",
        voltage: p.voltage,
        current: p.current,
        temp: p.temp,
        capacity: p.capacity,
        soh: sohReady ? sohNow : null,
      }));
  }, [logEnd, logStart, points, sohNow, sohReady]);

  const saveFile = (content, mime, ext) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data-log-${effectiveId}-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const headers = ["Waktu", "Mode", "Tegangan (V)", "Arus (mA)", "Suhu (C)", "Kapasitas (mAh)", "SOH (%)"];
  const rowValues = (r) => [
    r.time, r.mode, r.voltage.toFixed(3), r.current.toFixed(1),
    r.temp.toFixed(2), r.capacity.toFixed(1),
    r.soh != null ? r.soh.toFixed(2) : "—",
  ];

  const downloadCsv = () => {
    const lines = [headers.join(","), ...logRows.map((r) => rowValues(r).join(","))];
    saveFile("﻿" + lines.join("\n"), "text/csv;charset=utf-8", "csv");
  };

  const downloadExcel = () => {
    const head = headers.map((h) => `<th>${h}</th>`).join("");
    const body = logRows.map((r) => `<tr>${rowValues(r).map((v) => `<td>${v}</td>`).join("")}</tr>`).join("");
    const html =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">` +
      `<head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${head}</tr></thead>` +
      `<tbody>${body}</tbody></table></body></html>`;
    saveFile(html, "application/vnd.ms-excel", "xls");
  };

  const conn = hasData
    ? { label: "Terhubung", dot: "bg-emerald-500", cls: "text-emerald-700 bg-emerald-50 ring-emerald-200" }
    : online
      ? { label: "Menunggu data", dot: "bg-amber-500", cls: "text-amber-700 bg-amber-50 ring-amber-200" }
      : { label: "Offline", dot: "bg-slate-400", cls: "text-slate-600 bg-slate-50 ring-slate-200" };

  // ── Battery menu items ─────────────────────────────────────────────────────
  const menuItems = [
    {
      label: "Tambah Battery Baru",
      icon: "M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z",
      color: "text-teal-600",
      onClick: () => { setAddDraft(""); setAddError(""); setShowAddModal(true); setShowBatteryMenu(false); },
    },
    {
      label: "Pilih Battery Aktif",
      icon: "M9 11.24V7.5a2.5 2.5 0 015 0v3.74c1.21-.81 2-2.18 2-3.74 0-2.49-2.01-4.5-4.5-4.5S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z",
      color: "text-sky-600",
      onClick: () => { setShowPickModal(true); setShowBatteryMenu(false); },
    },
    {
      label: "Edit Battery",
      icon: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
      color: "text-violet-600",
      onClick: () => { setEditDraft(effectiveId); setShowEditModal(true); setShowBatteryMenu(false); },
    },
    {
      label: "Hapus Battery",
      icon: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
      color: "text-rose-600",
      onClick: () => { setShowDeleteConfirm(true); setShowBatteryMenu(false); },
    },
  ];

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <Sidebar active={active} onSelect={setActive} conn={conn} />
        <main className="min-w-0 flex-1 animate-float-up">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {active}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Mode badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400">
                  <path fill="currentColor" d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
                </svg>
                {state}
              </span>

              {/* Battery selector */}
              <div className="relative" ref={batterySelectRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowBatterySelect((v) => !v);
                    setShowBatteryMenu(false);
                  }}
                  className="inline-flex h-10 min-w-36 items-center justify-between gap-3 rounded-full bg-white/80 px-3.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  aria-haspopup="listbox"
                  aria-expanded={showBatterySelect}
                  aria-label="Pilih Battery ID"
                >
                  <span className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-600">
                      <path fill="currentColor" d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
                    </svg>
                    {effectiveId}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      showBatterySelect ? "rotate-180" : ""
                    }`}
                  >
                    <path fill="currentColor" d="M7 10l5 5 5-5z" />
                  </svg>
                </button>

                {showBatterySelect && (
                  <div
                    role="listbox"
                    className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200"
                  >
                    {(batteries.length > 0 ? batteries : [effectiveId]).map((id) => {
                      const isSelected = id === effectiveId;
                      return (
                        <button
                          key={id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectBattery(id)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                            isSelected
                              ? "bg-teal-50 text-teal-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {id}
                          {isSelected ? (
                            <svg viewBox="0 0 24 24" className="h-4 w-4">
                              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Battery management menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowBatteryMenu((v) => !v)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/25 transition hover:brightness-110"
                  aria-label="Menu battery"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>

                {showBatteryMenu && (
                  <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                    {menuItems.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.onClick}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 ${item.color}`}>
                          <svg viewBox="0 0 24 24" className="h-4 w-4">
                            <path fill="currentColor" d={item.icon} />
                          </svg>
                        </span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Page content ───────────────────────────────────────────────── */}
          {active === "Data Log" ? (
            <DataLogPage
              logStart={logStart}
              setLogStart={setLogStart}
              logEnd={logEnd}
              setLogEnd={setLogEnd}
              downloadCsv={downloadCsv}
              downloadExcel={downloadExcel}
              logRows={logRows}
            />
          ) : active === "Cycle Data" ? (
            <CycleDataPage cycleRows={cycleRows} />
          ) : active === "SOH Analysis" ? (
            <SohAnalysisPage
              sohReady={sohReady}
              cyclesCount={cycles.length}
              capacityInitial={capacityInitial}
              capacityNow={capacityNow}
              degradation={degradation}
              cycleHistoryRows={cycleHistoryRows}
              sohChart={sohChart}
            />
          ) : active === "Monitoring" ? (
            <MonitoringPage
              telemetryRows={monitoringRows}
              summary={monitoringSummary}
            />
          ) : (
            <DashboardPage
              voltage={voltage}
              current={current}
              temp={temp}
              capacity={capacity}
              soh={sohNow}
              sohReady={sohReady}
              soc={soc}
              telemetryRows={telemetryRows}
              telemetryChart={telemetryChart}
              delay={delay}
              batteryOn={batteryOn}
              controlMode={controlMode}
              onTogglePower={handleTogglePower}
              onStartDischarge={handleStartDischarge}
              onStartCharge={handleStartCharge}
              onStopMode={handleStopMode}
              effectiveId={effectiveId}
            />
          )}
        </main>
      </div>

      {/* ── Modal: Tambah Battery Baru ────────────────────────────────────── */}
      {showAddModal && (
        <Modal title="Tambah Battery Baru" onClose={() => !addSaving && setShowAddModal(false)}>
          <p className="mb-3 text-xs text-slate-500">
            Battery ID akan langsung tersimpan ke Firebase setelah klik Tambah.
          </p>
          <input
            autoFocus
            value={addDraft}
            onChange={(e) => { setAddDraft(e.target.value); setAddError(""); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddBattery();
              if (e.key === "Escape" && !addSaving) setShowAddModal(false);
            }}
            placeholder="Contoh: BAT-002"
            disabled={addSaving}
            className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          />
          {addError && (
            <p className="mt-2 text-xs font-medium text-rose-600">{addError}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddBattery}
              disabled={addSaving || !addDraft.trim()}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 py-2 text-sm font-bold text-white shadow hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {addSaving ? "Menyimpan…" : "Tambah"}
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              disabled={addSaving}
              className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Pilih Battery Aktif ────────────────────────────────────── */}
      {showPickModal && (
        <Modal title="Pilih Battery Aktif" onClose={() => setShowPickModal(false)}>
          {batteries.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada battery. Tambah battery baru terlebih dahulu.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {batteries.map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setBatteryId(id);
                    setBatteryConfirmed(true);
                    setShowPickModal(false);
                  }}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ring-1 transition ${
                    id === effectiveId
                      ? "bg-teal-50 text-teal-700 ring-teal-200"
                      : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {id}
                  {id === effectiveId && (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-600">
                      Aktif
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => { setShowPickModal(false); setAddDraft(""); setAddError(""); setShowAddModal(true); }}
            className="mt-4 w-full rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:border-teal-400 hover:text-teal-600"
          >
            + Tambah Battery Baru
          </button>
        </Modal>
      )}

      {/* ── Modal: Edit Battery ───────────────────────────────────────────── */}
      {showEditModal && (
        <Modal title="Edit Battery" onClose={() => setShowEditModal(false)}>
          <p className="mb-1 text-xs text-slate-500">Battery aktif saat ini:</p>
          <p className="mb-3 text-sm font-bold text-slate-700">{effectiveId}</p>
          <input
            autoFocus
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowEditModal(false);
            }}
            placeholder="ID baru"
            className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="mt-4 flex gap-2">
            <button
              onClick={async () => {
                const newId = editDraft.trim().toUpperCase();
                if (newId && newId !== effectiveId) {
                  await addBatteryToFirebase(newId);
                }
                setShowEditModal(false);
              }}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 py-2 text-sm font-bold text-white shadow hover:brightness-110"
            >
              Simpan
            </button>
            <button
              onClick={() => setShowEditModal(false)}
              className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Hapus Battery ─────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <Modal title="Hapus Battery" onClose={() => setShowDeleteConfirm(false)}>
          <p className="mb-4 text-sm text-slate-600">
            Hapus <span className="font-bold text-slate-900">{effectiveId}</span> dari Firebase? Data telemetry dan cycle akan ikut terhapus.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { deleteBatteryFromFirebase(effectiveId); setShowDeleteConfirm(false); }}
              className="flex-1 rounded-xl bg-rose-600 py-2 text-sm font-bold text-white shadow hover:bg-rose-700"
            >
              Hapus
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Pilih battery sebelum Discharge ─────────────────────── */}
      {showNeedBatteryModal && (
        <Modal title="Pilih Battery Terlebih Dahulu" onClose={() => setShowNeedBatteryModal(false)}>
          <p className="mb-4 text-sm text-slate-600">
            Sebelum memulai Discharge, pilih battery yang akan digunakan atau tambahkan battery baru.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowNeedBatteryModal(false); setShowPickModal(true); }}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 py-2 text-sm font-bold text-white shadow"
            >
              Pilih Battery
            </button>
            <button
              onClick={() => { setShowNeedBatteryModal(false); setAddDraft(""); setAddError(""); setShowAddModal(true); }}
              className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
            >
              Tambah Baru
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
