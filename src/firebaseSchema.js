/**
 * Struktur Firebase Realtime Database — selaras dengan main.ino
 *
 * /batteries
 *   /{BATTERY_ID}                    ← contoh: BAT-001
 *     /info                          ← metadata baterai (updateNode)
 *       name: string
 *       rated_capacity_mah: number
 *       firmware: string
 *       updated_at: ServerTimestamp
 *
 *     /live                          ← snapshot terbaru (setJSON, ditimpa)
 *       ts: number                     epoch ms
 *       send_time: number              epoch ms saat ESP32 mengirim (untuk hitung delay transmisi)
 *       state: "IDLE"|"DISCHARGE"|"CHARGE"|"DONE"
 *       voltage: number                V
 *       current: number                mA (abs di output)
 *       temp: number                   °C
 *       capacity_mah: number           mAh discharge akumulasi cycle aktif
 *       cycle: number                  nomor cycle berjalan
 *       soh: number                     SOH terakhir (setelah cycle selesai)
 *
 *     /telemetry                       ← deret waktu (pushJSON per sampel)
 *       /{pushId}
 *         ts: number
 *         send_time: number            epoch ms saat ESP32 mengirim
 *         cycle: number
 *         mode: "DISCHARGE"|"CHARGE"
 *         v: number                    tegangan V
 *         i: number                    arus mA
 *         temp: number                 suhu °C
 *         cap: number                  kapasitas mAh
 *
 *     /control                         ← perintah dari dashboard ke ESP32 (set oleh app)
 *       power: boolean
 *       mode: "DISCHARGE"|"CHARGE"|"IDLE"
 *       (node dihapus/null setelah ESP32 eksekusi perintah)
 *
 *     /cycles                          ← hasil 1 cycle penuh (pushJSON setelah SOH)
 *       /{pushId}
 *         ts: number
 *         cycle: number
 *         soh: number                   ← dibaca setelah discharge + charge selesai
 *         capacity_mah: number
 *         v_min, v_max: number
 *         temp_min, temp_max: number
 *         i_max: number
 *         dis_samples, chg_samples: number
 *         dis_v_mean, chg_v_mean: number
 *
 * Catatan: SOH tidak bisa dihitung dari 1 baris telemetry.
 * Minimal 1 cycle penuh (discharge → charge) harus selesai.
 */
export const FIREBASE_PATHS = {
  batteries: "batteries",
  info:      (id) => `batteries/${id}/info`,
  live:      (id) => `batteries/${id}/live`,
  telemetry: (id) => `batteries/${id}/telemetry`,
  cycles:    (id) => `batteries/${id}/cycles`,
  control:   (id) => `batteries/${id}/control`,
};

export default FIREBASE_PATHS;
