import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import toast from 'react-hot-toast';
import { Wallet, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

export const LaporanKas = () => {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    kas_kantor: 0,
    kolektor: 0,
    penerimaan_sibela: 0,
    penerimaan_lain: 0,
    pengeluaran_sibela: 0,
    pengeluaran_pinjaman: 0,
    pengeluaran_operasional: 0,
    pengeluaran_lain: 0
  });

  const [collectorSummary, setCollectorSummary] = useState({
    total_nominal: 0,
    total_transaksi: 0,
    count: 0
  });

  useEffect(() => {
    fetchLaporanKas();
  }, [tanggal]);

  const fetchLaporanKas = async () => {
    setLoading(true);
    try {
      const [kasRes, collectorRes] = await Promise.all([
        request.get(API_ENDPOINTS.LAPORAN_KAS.GET, { tanggal }),
        request.get(API_ENDPOINTS.COLLECTOR.SUMMARY_TODAY, { tanggal })
      ]);

      const collTotal = collectorRes?.success && collectorRes?.data
        ? Number(collectorRes.data.total_nominal || 0)
        : 0;

      if (collectorRes?.success && collectorRes?.data) {
        setCollectorSummary(collectorRes.data);
      } else {
        setCollectorSummary({ total_nominal: 0, total_transaksi: 0, count: 0 });
      }

      if (kasRes.success && kasRes.data) {
        // Jika data laporan kas sudah pernah disimpan dengan nilai kolektor > 0, gunakan nilai tersebut.
        // Jika nilai kolektor di laporan kas masih 0 tapi ada data collector pada tanggal tersebut, otomatis auto-fill!
        const savedKolektor = Number(kasRes.data.kolektor || 0);
        const finalKolektor = savedKolektor > 0 ? savedKolektor : collTotal;

        setFormData({
          kas_kantor: kasRes.data.kas_kantor || 0,
          kolektor: finalKolektor,
          penerimaan_sibela: kasRes.data.penerimaan_sibela || 0,
          penerimaan_lain: kasRes.data.penerimaan_lain || 0,
          pengeluaran_sibela: kasRes.data.pengeluaran_sibela || 0,
          pengeluaran_pinjaman: kasRes.data.pengeluaran_pinjaman || 0,
          pengeluaran_operasional: kasRes.data.pengeluaran_operasional || 0,
          pengeluaran_lain: kasRes.data.pengeluaran_lain || 0
        });
      } else {
        // Jika belum ada laporan kas tersimpan untuk tanggal ini, nilai kolektor otomatis auto-fill dari data collector!
        setFormData({
          kas_kantor: 0,
          kolektor: collTotal,
          penerimaan_sibela: 0,
          penerimaan_lain: 0,
          pengeluaran_sibela: 0,
          pengeluaran_pinjaman: 0,
          pengeluaran_operasional: 0,
          pengeluaran_lain: 0
        });
      }
    } catch (err) {
      toast.error('Gagal mengambil data laporan kas');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCollector = () => {
    setFormData(prev => ({
      ...prev,
      kolektor: collectorSummary.total_nominal || 0
    }));
    toast.success(`Nilai Kolektor di-fill otomatis: ${formatRupiah(collectorSummary.total_nominal || 0)}`);
  };

  const handleChange = (field, val) => {
    setFormData({ ...formData, [field]: parseFloat(val) || 0 });
  };

  const totalPenerimaan = Number(formData.kas_kantor) + Number(formData.kolektor) + Number(formData.penerimaan_sibela) + Number(formData.penerimaan_lain);
  const totalPengeluaran = Number(formData.pengeluaran_sibela) + Number(formData.pengeluaran_pinjaman) + Number(formData.pengeluaran_operasional) + Number(formData.pengeluaran_lain);
  const saldoKasBersih = totalPenerimaan - totalPengeluaran;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.LAPORAN_KAS.SAVE, {
        tanggal,
        ...formData
      });
      if (res.success) {
        toast.success('Laporan Harian Kas berhasil disimpan');
      }
    } catch (err) {
      toast.error('Gagal menyimpan Laporan Harian Kas');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div className="space-y-6">
      {/* Date Header Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">LAPORAN HARIAN KAS</h2>
            <p className="text-xs text-slate-500">Form Input Penerimaan & Pengeluaran Kas Kantor / Kolektor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Pilih Tanggal:</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none font-medium bg-slate-50"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat laporan kas...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PENERIMAAN KAS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <span>PENERIMAAN KAS</span>
                <span>KAS MASUK</span>
              </div>
              <div className="p-5 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">1. KAS KANTOR (Rp)</label>
                  <input
                    type="number"
                    value={formData.kas_kantor || ''}
                    onChange={(e) => handleChange('kas_kantor', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      2. KOLEKTOR (Rp)
                    </label>
                    <button
                      type="button"
                      onClick={handleSyncCollector}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-lg transition inline-flex items-center gap-1 w-fit"
                      title="Klik untuk auto-fill nilai sesuai total data collector pada tanggal ini"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Auto-Fill Total Collector</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    value={formData.kolektor || ''}
                    onChange={(e) => handleChange('kolektor', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-0.5">
                    <span>
                      Total Data Collector: <strong className="text-amber-800">{formatRupiah(collectorSummary.total_nominal)}</strong> ({collectorSummary.total_transaksi} Trx, {collectorSummary.count} Data)
                    </span>
                    {Number(formData.kolektor) === Number(collectorSummary.total_nominal) && collectorSummary.total_nominal > 0 && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sesuai Total Collector</span>
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">3. SIRELA / SETORAN (Rp)</label>
                  <input
                    type="number"
                    value={formData.penerimaan_sibela || ''}
                    onChange={(e) => handleChange('penerimaan_sibela', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">4. LAIN-LAIN / LAINNYA (Rp)</label>
                  <input
                    type="number"
                    value={formData.penerimaan_lain || ''}
                    onChange={(e) => handleChange('penerimaan_lain', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-900">TOTAL KAS MASUK</span>
                <span className="text-sm font-black text-emerald-700">{formatRupiah(totalPenerimaan)}</span>
              </div>
            </div>

            {/* PENGELUARAN KAS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-rose-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <span>PENGELUARAN KAS</span>
                <span>KAS KELUAR</span>
              </div>
              <div className="p-5 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">1. SIRELA / PENARIKAN (Rp)</label>
                  <input
                    type="number"
                    value={formData.pengeluaran_sibela || ''}
                    onChange={(e) => handleChange('pengeluaran_sibela', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">2. REALISASI PINJAMAN (Rp)</label>
                  <input
                    type="number"
                    value={formData.pengeluaran_pinjaman || ''}
                    onChange={(e) => handleChange('pengeluaran_pinjaman', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">3. BIAYA OPERASIONAL (Rp)</label>
                  <input
                    type="number"
                    value={formData.pengeluaran_operasional || ''}
                    onChange={(e) => handleChange('pengeluaran_operasional', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">4. LAIN-LAIN (Rp)</label>
                  <input
                    type="number"
                    value={formData.pengeluaran_lain || ''}
                    onChange={(e) => handleChange('pengeluaran_lain', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-rose-50 border-t border-rose-200 flex items-center justify-between">
                <span className="text-xs font-extrabold text-rose-900">TOTAL KAS KELUAR</span>
                <span className="text-sm font-black text-rose-700">{formatRupiah(totalPengeluaran)}</span>
              </div>
            </div>
          </div>

          {/* Balance Bar & Save Button */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <p className="text-xs font-medium text-slate-400">SALDO AKHIR KAS BMT (Penerimaan - Pengeluaran)</p>
              <h3 className="text-xl font-black text-amber-400 mt-0.5">{formatRupiah(saldoKasBersih)}</h3>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/30 transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Menyimpan...' : 'SIMPAN LAPORAN KAS'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
