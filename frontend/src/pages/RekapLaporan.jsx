import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import toast from 'react-hot-toast';
import { Printer, Calendar, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const RekapLaporan = () => {
  const [activeTab, setActiveTab] = useState('harian');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userOptions, setUserOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rekap Data State
  const [rekapHarianData, setRekapHarianData] = useState(null);
  const [rekapBulananData, setRekapBulananData] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'harian') {
      fetchRekapHarian();
    } else {
      fetchRekapBulanan();
    }
  }, [activeTab, tanggal, bulan, tahun, selectedUserId]);

  const fetchUsers = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.USERS.LIST, { limit: 100 });
      if (res.success) {
        setUserOptions(res.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRekapHarian = async () => {
    setLoading(true);
    try {
      const params = { tanggal };
      if (selectedUserId) params.user_id = selectedUserId;
      const res = await request.get(API_ENDPOINTS.REKAP.HARIAN, params);
      if (res.success) {
        setRekapHarianData(res.data);
      }
    } catch (err) {
      toast.error('Gagal mengambil rekap harian');
    } finally {
      setLoading(false);
    }
  };

  const fetchRekapBulanan = async () => {
    setLoading(true);
    try {
      const params = { bulan, tahun };
      if (selectedUserId) params.user_id = selectedUserId;
      const res = await request.get(API_ENDPOINTS.REKAP.BULANAN, params);
      if (res.success) {
        setRekapBulananData(res.data);
      }
    } catch (err) {
      toast.error('Gagal mengambil rekap bulanan');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalTransaksiNominal = (rekapHarianData?.slip || []).reduce((sum, item) => sum + Number(item.nominal || 0), 0);
  const totalJumlahKunjungan = (rekapHarianData?.slip?.length || 0) +
    (rekapHarianData?.prospek?.length || 0) +
    (rekapHarianData?.tidak_transaksi?.length || 0) +
    (rekapHarianData?.tidak_dikunjungi?.length || 0);

  const selectedUserObj = userOptions.find(u => String(u.id) === String(selectedUserId));

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    if (activeTab === 'harian') {
      // Summary Sheet
      const summaryData = [
        { METRIK: 'JUMLAH TRANSAKSI SLIP', NILAI: rekapHarianData?.slip?.length || 0 },
        { METRIK: 'TOTAL NOMINAL TRANSAKSI', NILAI: totalTransaksiNominal },
        { METRIK: 'JUMLAH KUNJUNGAN', NILAI: totalJumlahKunjungan }
      ];
      const wsSum = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, wsSum, 'Ringkasan Kunjungan');

      // 1. Slip Setoran/Penarikan Sheet
      const slipData = (rekapHarianData?.slip || []).map((item, idx) => ({
        NO: idx + 1,
        REK: item.no_rek,
        NAMA: item.nama,
        ALAMAT: item.alamat,
        TIPE: item.tipe,
        NOMINAL: item.nominal,
        KETERANGAN: item.keterangan || '-'
      }));
      const wsSlip = XLSX.utils.json_to_sheet(slipData);
      XLSX.utils.book_append_sheet(workbook, wsSlip, 'Slip Transaksi');

      // 2. Prospek Sheet
      const prospekData = (rekapHarianData?.prospek || []).map((item, idx) => ({
        NO: idx + 1,
        NAMA: item.nama,
        ALAMAT_TEMPAT: item.alamat_tempat,
        HASIL: item.hasil,
        KETERANGAN: item.keterangan || '-'
      }));
      const wsProspek = XLSX.utils.json_to_sheet(prospekData);
      XLSX.utils.book_append_sheet(workbook, wsProspek, 'Daftar Prospek');

      // 3. Tidak Transaksi & Tidak Dikunjungi
      const tdkTxData = (rekapHarianData?.tidak_transaksi || []).map((item, idx) => ({
        NO: idx + 1,
        REK: item.no_rek,
        NAMA: item.nama,
        KETERANGAN: item.keterangan || '-'
      }));
      const wsTdkTx = XLSX.utils.json_to_sheet(tdkTxData);
      XLSX.utils.book_append_sheet(workbook, wsTdkTx, 'Tidak Transaksi');

      const tdkKunjungData = (rekapHarianData?.tidak_dikunjungi || []).map((item, idx) => ({
        NO: idx + 1,
        REK: item.no_rek,
        NAMA: item.nama,
        KETERANGAN: item.keterangan || '-'
      }));
      const wsTdkKunjung = XLSX.utils.json_to_sheet(tdkKunjungData);
      XLSX.utils.book_append_sheet(workbook, wsTdkKunjung, 'Tidak Dikunjungi');

      // 4. Laporan Kas & Pecahan Summary
      const kasInfo = [
        { KETERANGAN: 'KAS KANTOR', KAS_MASUK: rekapHarianData?.laporan_kas?.kas_kantor || 0, KAS_KELUAR: 0 },
        { KETERANGAN: 'KOLEKTOR', KAS_MASUK: rekapHarianData?.laporan_kas?.kolektor || 0, KAS_KELUAR: 0 },
        { KETERANGAN: 'SIRELA', KAS_MASUK: rekapHarianData?.laporan_kas?.penerimaan_sibela || 0, KAS_KELUAR: rekapHarianData?.laporan_kas?.pengeluaran_sibela || 0 },
        { KETERANGAN: 'PINJAMAN', KAS_MASUK: 0, KAS_KELUAR: rekapHarianData?.laporan_kas?.pengeluaran_pinjaman || 0 },
        { KETERANGAN: 'TOTAL', KAS_MASUK: rekapHarianData?.laporan_kas?.total_kas_masuk || 0, KAS_KELUAR: rekapHarianData?.laporan_kas?.total_kas_keluar || 0 },
        { KETERANGAN: 'KAS DISETOR (PECAHAN TUNAI)', KAS_MASUK: rekapHarianData?.rincian_pecahan?.jumlah_total || 0, KAS_KELUAR: 0 }
      ];
      const wsKas = XLSX.utils.json_to_sheet(kasInfo);
      XLSX.utils.book_append_sheet(workbook, wsKas, 'Laporan Kas');

      XLSX.writeFile(workbook, `Rekap_Harian_BMT_Hira_${tanggal}.xlsx`);
    } else {
      const bulananRows = [
        { KETERANGAN: 'Total Setoran Tunai', NOMINAL: rekapBulananData?.total_setoran || 0 },
        { KETERANGAN: 'Total Penarikan Tunai', NOMINAL: rekapBulananData?.total_penarikan || 0 },
        { KETERANGAN: 'Total Transaksi Slip', JUMLAH: rekapBulananData?.total_transaksi_count || 0 },
        { KETERANGAN: 'Jumlah Kunjungan', JUMLAH: rekapBulananData?.total_kunjungan_count || 0 },
        { KETERANGAN: 'Total Calon Prospek', JUMLAH: rekapBulananData?.total_prospek_count || 0 },
        { KETERANGAN: 'Total Anggota Registered', JUMLAH: rekapBulananData?.total_anggota_count || 0 }
      ];
      const wsBulanan = XLSX.utils.json_to_sheet(bulananRows);
      XLSX.utils.book_append_sheet(workbook, wsBulanan, 'Rekap Bulanan');

      XLSX.writeFile(workbook, `Rekap_Bulanan_BMT_Hira_${bulan}_${tahun}.xlsx`);
    }
    toast.success('File Excel berhasil diunduh');
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions (Hidden when printing) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('harian')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'harian' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            REKAP HARIAN LENGKAP
          </button>
          <button
            onClick={() => setActiveTab('bulanan')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'bulanan' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            REKAP BULANAN
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Employee Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Marketing:</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none bg-slate-50 font-medium"
            >
              <option value="">-- Semua Marketing --</option>
              {userOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama} ({u.jabatan || 'Marketing'})
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'harian' ? (
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none bg-slate-50 font-medium"
            />
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none bg-slate-50 font-medium"
              >
                {[
                  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ].map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none bg-slate-50 font-medium"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          )}

          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD EXCEL</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>CETAK / CETAK PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Area Format Sesuai Excel Client */}
      <div id="printable-area" className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-900">
        {/* Letterhead Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-900 pb-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
              <img src="/logo.jpeg" alt="Logo BMT Hira" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">KSPPS BMT HIRA</h1>
              <p className="text-[10px] sm:text-xs font-bold text-sky-700 uppercase tracking-widest">LAPORAN HARIAN MARKETING</p>
              <p className="text-[10px] sm:text-[11px] text-slate-500">Kantor Layanan Simpan Pinjam Syariah</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-800">
              {activeTab === 'harian' ? 'LAPORAN REKAPITULASI HARIAN' : 'LAPORAN REKAPITULASI BULANAN'}
            </h2>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              MARKETING: <span className="font-bold text-sky-800">{selectedUserObj ? selectedUserObj.nama : 'SEMUA MARKETING'}</span>
            </p>
            <p className="text-xs font-medium text-slate-600">
              {activeTab === 'harian' ? `HARI / TGL : ${tanggal}` : `Periode: ${bulan} / ${tahun}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Menyiapkan format rekapitulasi...</div>
        ) : activeTab === 'harian' ? (
          <div className="space-y-6 text-xs overflow-hidden">
            {/* SUMMARY BARIS ATAS SESUAI EXCEL CLIENT */}
            <div className="border border-slate-900 rounded-lg overflow-hidden">
              <div className="bg-slate-900 text-white p-2 font-bold uppercase text-[11px] tracking-wider">
                TRANSAKSI KOLEKTOR / MARKETING
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 text-center bg-slate-50">
                <div className="p-2">
                  <span className="block text-[10px] font-bold text-slate-600 uppercase">JUMLAH TRANSAKSI</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">{rekapHarianData?.slip?.length || 0} Slip</span>
                </div>
                <div className="p-2">
                  <span className="block text-[10px] font-bold text-slate-600 uppercase">TOTAL NOMINAL</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700">{formatRupiah(totalTransaksiNominal)}</span>
                </div>
                <div className="p-2">
                  <span className="block text-[10px] font-bold text-slate-600 uppercase">SELISIH</span>
                  <span className="text-xs sm:text-sm font-black text-slate-700">Rp 0</span>
                </div>
                <div className="p-2 bg-amber-100/80">
                  <span className="block text-[10px] font-black text-amber-900 uppercase">JUMLAH KUNJUNGAN</span>
                  <span className="text-sm sm:text-base font-black text-amber-700">{totalJumlahKunjungan}</span>
                </div>
              </div>
            </div>

            {/* 1. SLIP SETORAN & PENARIKAN */}
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-2 bg-slate-100 p-2 rounded border border-slate-200">
                DAFTAR ANGGOTA PENARIKAN DAN SETORAN TUNAI (SLIP)
              </h3>
              <div className="overflow-x-auto border border-slate-300 rounded">
                <table className="w-full border-collapse text-left min-w-[500px]">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase">
                    <tr>
                      <th className="border-b border-r border-slate-300 p-2 w-10 text-center">NO</th>
                      <th className="border-b border-r border-slate-300 p-2">REK</th>
                      <th className="border-b border-r border-slate-300 p-2">NAMA</th>
                      <th className="border-b border-r border-slate-300 p-2">ALAMAT</th>
                      <th className="border-b border-r border-slate-300 p-2 text-center">TIPE</th>
                      <th className="border-b border-slate-300 p-2 text-right">NOMINAL (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapHarianData?.slip?.length === 0 ? (
                      <tr><td colSpan={6} className="p-3 text-center text-slate-400">Nihil</td></tr>
                    ) : (
                      rekapHarianData?.slip?.map((item, idx) => (
                        <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                          <td className="border-r border-slate-200 p-2 text-center">{idx + 1}</td>
                          <td className="border-r border-slate-200 p-2 font-mono font-bold">{item.no_rek}</td>
                          <td className="border-r border-slate-200 p-2 font-semibold">{item.nama}</td>
                          <td className="border-r border-slate-200 p-2">{item.alamat}</td>
                          <td className="border-r border-slate-200 p-2 text-center font-bold uppercase">{item.tipe}</td>
                          <td className="p-2 text-right font-bold">{formatRupiah(item.nominal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. DAFTAR PROSPEK */}
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-2 bg-slate-100 p-2 rounded border border-slate-200">
                DAFTAR PROSPEK
              </h3>
              <div className="overflow-x-auto border border-slate-300 rounded">
                <table className="w-full border-collapse text-left min-w-[500px]">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase">
                    <tr>
                      <th className="border-b border-r border-slate-300 p-2 w-10 text-center">NO</th>
                      <th className="border-b border-r border-slate-300 p-2">NAMA</th>
                      <th className="border-b border-r border-slate-300 p-2">ALAMAT/TEMPAT</th>
                      <th className="border-b border-r border-slate-300 p-2">HASIL</th>
                      <th className="border-b border-slate-300 p-2">KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapHarianData?.prospek?.length === 0 ? (
                      <tr><td colSpan={5} className="p-3 text-center text-slate-400">Nihil</td></tr>
                    ) : (
                      rekapHarianData?.prospek?.map((item, idx) => (
                        <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                          <td className="border-r border-slate-200 p-2 text-center">{idx + 1}</td>
                          <td className="border-r border-slate-200 p-2 font-semibold">{item.nama}</td>
                          <td className="border-r border-slate-200 p-2">{item.alamat_tempat}</td>
                          <td className="border-r border-slate-200 p-2 font-bold">{item.hasil}</td>
                          <td className="p-2">{item.keterangan}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3 & 4. ANGGOTA TIDAK TRANSAKSI & TIDAK DIKUNJUNGI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-slate-800 uppercase mb-2">DAFTAR ANGGOTA YANG TIDAK TRANSAKSI</h4>
                <div className="overflow-x-auto border border-slate-300 rounded">
                  <table className="w-full border-collapse text-left text-[11px] min-w-[320px]">
                    <thead className="bg-slate-50 font-bold uppercase">
                      <tr>
                        <th className="border-b border-r border-slate-300 p-1.5 w-8 text-center">NO</th>
                        <th className="border-b border-r border-slate-300 p-1.5">REK</th>
                        <th className="border-b border-r border-slate-300 p-1.5">NAMA</th>
                        <th className="border-b border-slate-300 p-1.5">KETERANGAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rekapHarianData?.tidak_transaksi?.length === 0 ? (
                        <tr><td colSpan={4} className="p-2 text-center text-slate-400">Nihil</td></tr>
                      ) : (
                        rekapHarianData?.tidak_transaksi?.map((item, idx) => (
                          <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                            <td className="border-r border-slate-200 p-1.5 text-center">{idx + 1}</td>
                            <td className="border-r border-slate-200 p-1.5 font-mono">{item.no_rek}</td>
                            <td className="border-r border-slate-200 p-1.5 font-medium">{item.nama}</td>
                            <td className="p-1.5">{item.keterangan}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase mb-2">DAFTAR ANGGOTA YANG TIDAK DIKUNJUNGI</h4>
                <div className="overflow-x-auto border border-slate-300 rounded">
                  <table className="w-full border-collapse text-left text-[11px] min-w-[320px]">
                    <thead className="bg-slate-50 font-bold uppercase">
                      <tr>
                        <th className="border-b border-r border-slate-300 p-1.5 w-8 text-center">NO</th>
                        <th className="border-b border-r border-slate-300 p-1.5">REK</th>
                        <th className="border-b border-r border-slate-300 p-1.5">NAMA</th>
                        <th className="border-b border-slate-300 p-1.5">KETERANGAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rekapHarianData?.tidak_dikunjungi?.length === 0 ? (
                        <tr><td colSpan={4} className="p-2 text-center text-slate-400">Nihil</td></tr>
                      ) : (
                        rekapHarianData?.tidak_dikunjungi?.map((item, idx) => (
                          <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                            <td className="border-r border-slate-200 p-1.5 text-center">{idx + 1}</td>
                            <td className="border-r border-slate-200 p-1.5 font-mono">{item.no_rek}</td>
                            <td className="border-r border-slate-200 p-1.5 font-medium">{item.nama}</td>
                            <td className="p-1.5">{item.keterangan}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 5. LAPORAN HARIAN KAS MATRIKS */}
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-2 bg-slate-100 p-2 rounded border border-slate-200">
                LAPORAN HARIAN KAS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 border border-slate-300 rounded overflow-hidden">
                {/* Penerimaan */}
                <div className="border-b sm:border-b-0 sm:border-r border-slate-300">
                  <div className="bg-slate-100 font-bold p-2 text-center border-b border-slate-300">PENERIMAAN</div>
                  <div className="p-2 space-y-1">
                    <div className="flex justify-between"><span>1. KAS KANTOR</span><span className="font-bold">{formatRupiah(rekapHarianData?.laporan_kas?.kas_kantor)}</span></div>
                    <div className="flex justify-between"><span>2. KOLEKTOR</span><span className="font-bold">{formatRupiah(rekapHarianData?.laporan_kas?.kolektor)}</span></div>
                    <div className="flex justify-between"><span>3. SIRELA</span><span className="font-bold">{formatRupiah(rekapHarianData?.laporan_kas?.penerimaan_sibela)}</span></div>
                    <div className="flex justify-between border-t pt-1 font-bold"><span>TOTAL KAS MASUK</span><span>{formatRupiah(rekapHarianData?.laporan_kas?.total_kas_masuk)}</span></div>
                  </div>
                </div>
                {/* Pengeluaran */}
                <div>
                  <div className="bg-slate-100 font-bold p-2 text-center border-b border-slate-300">PENGELUARAN</div>
                  <div className="p-2 space-y-1">
                    <div className="flex justify-between"><span>1. SIRELA</span><span className="font-bold">{formatRupiah(rekapHarianData?.laporan_kas?.pengeluaran_sibela)}</span></div>
                    <div className="flex justify-between"><span>2. PINJAMAN</span><span className="font-bold">{formatRupiah(rekapHarianData?.laporan_kas?.pengeluaran_pinjaman)}</span></div>
                    <div className="flex justify-between border-t pt-1 font-bold"><span>TOTAL KAS KELUAR</span><span>{formatRupiah(rekapHarianData?.laporan_kas?.total_kas_keluar)}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. KAS DISETOR & LEGAL TANDA TANGAN */}
            <div className="pt-4 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6">
              <div>
                <p className="font-bold text-slate-800 text-center sm:text-left">KAS DISETOR TOTAL: <span className="text-sm font-black text-sky-700">{formatRupiah(rekapHarianData?.rincian_pecahan?.jumlah_total || 0)}</span></p>
              </div>

              <div className="flex flex-wrap justify-center gap-8 sm:gap-12 text-center text-[11px] font-bold w-full sm:w-auto">
                <div>
                  <p className="mb-8 sm:mb-12">MARKETING / TELLER</p>
                  <p className="underline uppercase">{selectedUserObj ? selectedUserObj.nama : (rekapHarianData?.rincian_pecahan?.teller_name || 'Semua Marketing')}</p>
                </div>
                <div>
                  <p className="mb-8 sm:mb-12">MENGETAHUI</p>
                  <p className="underline uppercase">{rekapHarianData?.rincian_pecahan?.mengetahui_name || 'Koordinator'}</p>
                </div>
                <div>
                  <p className="mb-8 sm:mb-12">MANAGER CABANG</p>
                  <p className="underline uppercase">{rekapHarianData?.rincian_pecahan?.manager_name || 'Manager'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Rekap Bulanan */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">TOTAL SETORAN (BULAN INI)</span>
                <h3 className="text-lg font-bold text-emerald-700 mt-1">{formatRupiah(rekapBulananData?.total_setoran)}</h3>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">TOTAL PENARIKAN (BULAN INI)</span>
                <h3 className="text-lg font-bold text-rose-700 mt-1">{formatRupiah(rekapBulananData?.total_penarikan)}</h3>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">TOTAL TRANSAKSI</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">{rekapBulananData?.total_transaksi_count || 0} Slip</h3>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <span className="text-xs font-black text-amber-800 uppercase">JUMLAH KUNJUNGAN</span>
                <h3 className="text-xl font-black text-amber-600 mt-1">{rekapBulananData?.total_kunjungan_count || 0} Kunjungan</h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
