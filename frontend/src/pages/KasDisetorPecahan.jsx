import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import toast from 'react-hot-toast';
import { Coins, Save, CheckCircle2 } from 'lucide-react';

export const KasDisetorPecahan = ({ user }) => {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const denominationList = [
    { key: 'p100k', label: 'Rp 100.000', value: 100000, type: 'KERTAS' },
    { key: 'p50k', label: 'Rp 50.000', value: 50000, type: 'KERTAS' },
    { key: 'p20k', label: 'Rp 20.000', value: 20000, type: 'KERTAS' },
    { key: 'p10k', label: 'Rp 10.000', value: 10000, type: 'KERTAS' },
    { key: 'p5k', label: 'Rp 5.000', value: 5000, type: 'KERTAS' },
    { key: 'p2k', label: 'Rp 2.000', value: 2000, type: 'KERTAS' },
    { key: 'p1k', label: 'Rp 1.000', value: 1000, type: 'KERTAS / KOIN' },
    { key: 'p500', label: 'Rp 500', value: 500, type: 'KOIN' },
    { key: 'p200', label: 'Rp 200', value: 200, type: 'KOIN' },
    { key: 'p100', label: 'Rp 100', value: 100, type: 'KOIN' },
  ];

  const [pecahan, setPecahan] = useState({
    p100k: 0, p50k: 0, p20k: 0, p10k: 0, p5k: 0, p2k: 0, p1k: 0, p500: 0, p200: 0, p100: 0
  });

  const [signatures, setSignatures] = useState({
    teller_name: user?.nama || 'Ahmad Teller',
    mengetahui_name: 'Koordinator Kolektor',
    manager_name: 'Administrator BMT'
  });

  useEffect(() => {
    fetchPecahanData();
  }, [tanggal]);

  const fetchPecahanData = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.PECAHAN.GET, { tanggal });
      if (res.success && res.data) {
        setPecahan({
          p100k: res.data.p100k || 0,
          p50k: res.data.p50k || 0,
          p20k: res.data.p20k || 0,
          p10k: res.data.p10k || 0,
          p5k: res.data.p5k || 0,
          p2k: res.data.p2k || 0,
          p1k: res.data.p1k || 0,
          p500: res.data.p500 || 0,
          p200: res.data.p200 || 0,
          p100: res.data.p100 || 0,
        });
        if (res.data.teller_name) {
          setSignatures({
            teller_name: res.data.teller_name,
            mengetahui_name: res.data.mengetahui_name || 'Koordinator Kolektor',
            manager_name: res.data.manager_name || 'Administrator BMT'
          });
        }
      } else {
        setPecahan({ p100k: 0, p50k: 0, p20k: 0, p10k: 0, p5k: 0, p2k: 0, p1k: 0, p500: 0, p200: 0, p100: 0 });
      }
    } catch (err) {
      toast.error('Gagal mengambil data pecahan uang');
    } finally {
      setLoading(false);
    }
  };

  const handlePecahanChange = (key, val) => {
    setPecahan({ ...pecahan, [key]: parseInt(val) || 0 });
  };

  const totalCalculated = denominationList.reduce((sum, item) => {
    const qty = Number(pecahan[item.key]) || 0;
    return sum + (qty * item.value);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.PECAHAN.SAVE, {
        tanggal,
        ...pecahan,
        ...signatures
      });
      if (res.success) {
        toast.success('Rincian pecahan uang tunai kas disetor berhasil disimpan');
      }
    } catch (err) {
      toast.error('Gagal menyimpan rincian pecahan');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">KAS DISETOR (RINCIAN PECAHAN UANG)</h2>
            <p className="text-xs text-slate-500">Hitung otomatis total fisik uang tunai disetor teller/kolektor</p>
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
        <div className="py-12 text-center text-xs text-slate-400">Memuat pecahan uang...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table Pecahan (2 cols on large screen) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <span>RINCIAN PECAHAN UANG TUNAI</span>
                <span>HARIAN</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">RINCIAN</th>
                      <th className="py-3 px-4">PECAHAN</th>
                      <th className="py-3 px-4 text-center w-28">JUMLAH (LEMBAR/KOIN)</th>
                      <th className="py-3 px-4 text-right">TOTAL (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {denominationList.map((item) => {
                      const qty = pecahan[item.key] || '';
                      const subtotal = (Number(qty) || 0) * item.value;
                      return (
                        <tr key={item.key} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-4 font-semibold text-slate-500 text-[11px] uppercase">
                            {item.type}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">
                            {item.label}
                          </td>
                          <td className="py-2 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={(e) => handlePecahanChange(item.key, e.target.value)}
                                placeholder="0"
                                className="w-20 text-center py-1 px-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none bg-amber-50/30"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                            {formatRupiah(subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-amber-50/70 border-t-2 border-amber-200 font-black">
                    <tr>
                      <td colSpan={2} className="py-3.5 px-4 text-amber-900 text-xs uppercase tracking-wider">
                        JUMLAH TOTAL KAS DISETOR
                      </td>
                      <td colSpan={2} className="py-3.5 px-4 text-right text-base text-amber-700">
                        {formatRupiah(totalCalculated)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Signature & Action Panel */}
            <div className="space-y-6">
              {/* Grand Total Summary Box */}
              <div className="bg-gradient-to-tr from-sky-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-700">
                <span className="text-xs font-semibold text-sky-300 block uppercase tracking-wider">TOTAL FISIK KAS TERHITUNG</span>
                <h3 className="text-2xl font-black mt-1 text-white">{formatRupiah(totalCalculated)}</h3>
                <div className="mt-4 pt-4 border-t border-slate-700/80 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kalkulasi otomatis pecahan lembar x nominal</span>
                </div>
              </div>

              {/* Legal Signatures Panel */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  PENGESAHAN LAPORAN KAS
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">TELLER / KOLEKTOR</label>
                  <input
                    type="text"
                    value={signatures.teller_name}
                    onChange={(e) => setSignatures({ ...signatures, teller_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">MENGETAHUI</label>
                  <input
                    type="text"
                    value={signatures.mengetahui_name}
                    onChange={(e) => setSignatures({ ...signatures, mengetahui_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">MANAGER CABANG</label>
                  <input
                    type="text"
                    value={signatures.manager_name}
                    onChange={(e) => setSignatures({ ...signatures, manager_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none font-semibold text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/30 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Menyimpan...' : 'SIMPAN RINCIAN KAS'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
