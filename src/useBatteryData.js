// Hook untuk membaca data baterai dari Firebase Realtime Database.
// Struktur lengkap: lihat firebaseSchema.js (selaras dengan main.ino)
import { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";
import { FIREBASE_PATHS } from "./firebaseSchema.js";

// Jumlah data delay yang disimpan untuk statistik (min. 30 sesuai kebutuhan).
const DELAY_HISTORY_LIMIT = 30;

// Ubah objek RTDB (keyed by pushId) menjadi array terurut.
function toSortedArray(obj, sortKey = "ts") {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => (a[sortKey] ?? 0) - (b[sortKey] ?? 0));
}

// Daftar ID baterai + status koneksi Firebase.
export function useBatteryList() {
  const [ids, setIds] = useState([]);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const listRef = ref(db, "batteries");
    const unsubList = onValue(
      listRef,
      (snap) => {
        const val = snap.val();
        setIds(val ? Object.keys(val) : []);
      },
      () => setIds([]),
    );
    const connRef = ref(db, ".info/connected");
    const unsubConn = onValue(connRef, (snap) =>
      setOnline(snap.val() === true),
    );
    return () => {
      unsubList();
      unsubConn();
    };
  }, []);

  return { ids, online };
}

// Data lengkap satu baterai: live snapshot, telemetry (deret waktu), cycles.
export function useBatteryData(batteryId) {
  const [live, setLive] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!batteryId) return undefined;
    const base = FIREBASE_PATHS.batteries + "/" + batteryId;

    const unsubInfo = onValue(ref(db, `${base}/info`), (snap) =>
      setInfo(snap.val()),
    );
    const unsubLive = onValue(
      ref(db, `${base}/live`),
      (snap) => setLive(snap.val()),
      () => setLive(null),
    );
    const unsubTel = onValue(
      ref(db, `${base}/telemetry`),
      (snap) => setTelemetry(toSortedArray(snap.val())),
      () => setTelemetry([]),
    );
    const unsubCyc = onValue(
      ref(db, `${base}/cycles`),
      (snap) => setCycles(toSortedArray(snap.val(), "cycle")),
      () => setCycles([]),
    );

    return () => {
      unsubInfo();
      unsubLive();
      unsubTel();
      unsubCyc();
    };
  }, [batteryId]);

  const hasData = telemetry.length > 0 || cycles.length > 0 || live != null;
  return { info, live, telemetry, cycles, hasData };
}

// Hitung delay transmisi ESP32 → dashboard secara realtime.
//
//   delay_ms = receive_time - send_time
//
// send_time   : timestamp (epoch ms) yang dikirim ESP32 di node /live.
// receive_time: Date.now() saat snapshot diterima browser (di dalam callback
//               onValue, bukan saat render, agar akurat).
//
// Menyimpan history minimal 30 data terakhir + statistik avg/min/max.
export function useTransmissionDelay(batteryId) {
  const [current, setCurrent] = useState(null); // delay terbaru (ms)
  // Simpan history bersama batteryId-nya agar reset otomatis saat ganti baterai.
  const [state, setState] = useState({ batteryId: null, history: [] });

  useEffect(() => {
    if (!batteryId) return undefined;
    const base = FIREBASE_PATHS.batteries + "/" + batteryId;
    // Lacak send_time terakhir agar hanya menghitung pengiriman baru.
    let lastSendTime = null;
    let hasBaseline = false;

    const unsub = onValue(ref(db, `${base}/live`), (snap) => {
      const val = snap.val();
      if (!val) return;

      // Fallback ke `ts` bila firmware lama belum mengirim `send_time`.
      const sendTime = Number(val.send_time ?? val.ts);
      if (!Number.isFinite(sendTime) || sendTime <= 0) return;

      // Snapshot pertama setelah reload adalah data lama dari Firebase.
      // Pakai sebagai baseline saja agar umur data tidak masuk statistik delay.
      if (!hasBaseline) {
        lastSendTime = sendTime;
        hasBaseline = true;
        setCurrent(null);
        setState({ batteryId, history: [] });
        return;
      }

      // Abaikan jika tidak ada pengiriman baru (snapshot identik).
      if (lastSendTime === sendTime) return;
      lastSendTime = sendTime;

      const receiveTime = Date.now();
      const delay = receiveTime - sendTime;
      if (!Number.isFinite(delay)) return;

      setCurrent(delay);
      setState((prev) => {
        // Baterai berbeda → mulai history baru.
        const base = prev.batteryId === batteryId ? prev.history : [];
        const next = [...base, delay];
        return {
          batteryId,
          history:
            next.length > DELAY_HISTORY_LIMIT
              ? next.slice(-DELAY_HISTORY_LIMIT)
              : next,
        };
      });
    });

    return () => unsub();
  }, [batteryId]);

  const history = useMemo(
    () => (state.batteryId === batteryId ? state.history : []),
    [state, batteryId],
  );

  const stats = useMemo(() => {
    if (!history.length) {
      return { avg: null, min: null, max: null, count: 0 };
    }
    const sum = history.reduce((acc, d) => acc + d, 0);
    return {
      avg: sum / history.length,
      min: Math.min(...history),
      max: Math.max(...history),
      count: history.length,
    };
  }, [history]);

  // Saat ganti baterai, current delay lama tidak relevan.
  const currentForBattery = state.batteryId === batteryId ? current : null;

  return { current: currentForBattery, history, ...stats };
}
