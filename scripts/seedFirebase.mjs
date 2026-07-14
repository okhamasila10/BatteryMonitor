// Seed data uji ke Firebase Realtime Database lewat REST API.
// Rules database terbuka (.read/.write true) jadi tidak perlu auth.
// Skema mengikuti firebaseSchema.js / main.ino.
//
// Jalankan:  node scripts/seedFirebase.mjs
// Hapus data: node scripts/seedFirebase.mjs --clear

const DATABASE_URL =
  "https://batterysoh-ee68d-default-rtdb.asia-southeast1.firebasedatabase.app";
const BATTERY_ID = "BAT-001";
const RATED_CAPACITY_MAH = 2600;
const SAMPLE_INTERVAL_MS = 15000;

const V_FULL = 3.55;
const V_CUTOFF = 2.3;

const base = `${DATABASE_URL}/batteries/${BATTERY_ID}`;
const pad = (n, w = 2) => String(n).padStart(w, "0");

async function put(path, data) {
  const res = await fetch(`${base}/${path}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`PUT ${path} → ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function del(path) {
  const res = await fetch(`${base}/${path}.json`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`);
}

// ── Bangun deret telemetry: 30 sampel discharge + 30 sampel charge ──
function buildTelemetry(startTs, cycleNo) {
  const out = {};
  const nDis = 30;
  const nChg = 30;
  let idx = 0;
  let cap = 0;

  // Discharge: V turun 3.55 → 2.3, arus + (keluar) ~500 mA
  for (let i = 0; i < nDis; i++) {
    const frac = i / (nDis - 1);
    const v = V_FULL - (V_FULL - V_CUTOFF) * frac;
    const iMa = 480 + Math.sin(i / 4) * 40;
    cap += (iMa * SAMPLE_INTERVAL_MS) / 3600000; // mAh
    out[`p${pad(idx, 3)}`] = {
      ts: startTs + idx * SAMPLE_INTERVAL_MS,
      cycle: cycleNo,
      mode: "DISCHARGE",
      v: +v.toFixed(4),
      i: +iMa.toFixed(2),
      temp: +(30 + frac * 4 + Math.sin(i / 3) * 0.4).toFixed(2),
      cap: +cap.toFixed(2),
    };
    idx++;
  }

  // Charge: V naik 2.3 → 3.55, arus (abs) ~450 mA
  for (let i = 0; i < nChg; i++) {
    const frac = i / (nChg - 1);
    const v = V_CUTOFF + (V_FULL - V_CUTOFF) * frac;
    const iMa = 440 + Math.sin(i / 4) * 30;
    out[`p${pad(idx, 3)}`] = {
      ts: startTs + idx * SAMPLE_INTERVAL_MS,
      cycle: cycleNo,
      mode: "CHARGE",
      v: +v.toFixed(4),
      i: +iMa.toFixed(2),
      temp: +(33 - frac * 3 + Math.sin(i / 3) * 0.4).toFixed(2),
      cap: +cap.toFixed(2),
    };
    idx++;
  }

  return { telemetry: out, lastCap: cap };
}

// ── Bangun riwayat cycle: SOH menurun perlahan ──
function buildCycles(count, startTs) {
  const out = {};
  for (let i = 0; i < count; i++) {
    const cycle = i + 1;
    const soh = +(99.5 - i * 0.95 - Math.random() * 0.3).toFixed(2);
    const capacity = +((soh / 100) * RATED_CAPACITY_MAH).toFixed(1);
    out[`c${pad(cycle, 3)}`] = {
      ts: startTs + i * 3600000,
      cycle,
      soh,
      capacity_mah: capacity,
      v_min: 2.3,
      v_max: 3.55,
      temp_min: +(29 + Math.random()).toFixed(1),
      temp_max: +(33 + i * 0.15).toFixed(1),
      i_max: +(520 + Math.random() * 20).toFixed(1),
      dis_samples: 30,
      chg_samples: 30,
      dis_v_mean: +(2.95 - i * 0.004).toFixed(3),
      chg_v_mean: +(3.0 + i * 0.002).toFixed(3),
    };
  }
  return out;
}

async function clearAll() {
  console.log(`Menghapus data ${BATTERY_ID} ...`);
  await Promise.all([
    del("info"),
    del("live"),
    del("telemetry"),
    del("cycles"),
  ]);
  console.log("Selesai dihapus.");
}

async function seed() {
  const now = Date.now();
  const nCycles = 12;

  // Telemetry untuk cycle terakhir, ts berakhir di "sekarang".
  const totalSamples = 60;
  const telStart = now - (totalSamples - 1) * SAMPLE_INTERVAL_MS;
  const { telemetry, lastCap } = buildTelemetry(telStart, nCycles);

  const cycles = buildCycles(nCycles, now - nCycles * 3600000);
  const lastCycle = cycles[`c${pad(nCycles, 3)}`];

  // Live = sampel terakhir (akhir charge), pakai SOH cycle terakhir.
  const lastTel = telemetry[`p${pad(totalSamples - 1, 3)}`];
  const live = {
    ts: lastTel.ts,
    state: "DONE",
    voltage: lastTel.v,
    current: 0,
    temp: lastTel.temp,
    capacity_mah: +lastCap.toFixed(2),
    cycle: nCycles,
    soh: lastCycle.soh,
  };

  const info = {
    name: "Battery Pack A",
    rated_capacity_mah: RATED_CAPACITY_MAH,
    firmware: "seed-v1.0",
    updated_at: now,
  };

  console.log(`Menulis data uji ke ${BATTERY_ID} ...`);
  await put("info", info);
  await put("live", live);
  await put("telemetry", telemetry);
  await put("cycles", cycles);

  console.log("Selesai. Ringkasan:");
  console.log(`  info        : ${info.name}, ${info.rated_capacity_mah} mAh`);
  console.log(`  live        : ${live.state} ${live.voltage}V SOH ${live.soh}%`);
  console.log(`  telemetry   : ${Object.keys(telemetry).length} sampel`);
  console.log(`  cycles      : ${Object.keys(cycles).length} (SOH ${cycles["c001"].soh}% → ${lastCycle.soh}%)`);
  console.log(`\nBuka dashboard dan pilih baterai "${BATTERY_ID}".`);
}

const run = process.argv.includes("--clear") ? clearAll : seed;
run().catch((err) => {
  console.error("GAGAL:", err.message);
  process.exit(1);
});
