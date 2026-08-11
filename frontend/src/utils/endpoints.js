export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    PROFILE: "/auth/profile",
  },
  USERS: {
    LIST: "/users",
    CREATE: "/users",
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },
  NASABAH: {
    LIST: "/nasabah",
    CREATE: "/nasabah",
    UPDATE: (id) => `/nasabah/${id}`,
    DELETE: (id) => `/nasabah/${id}`,
  },
  TRANSAKSI: {
    LIST: "/transaksi",
    CREATE: "/transaksi",
    DELETE: (id) => `/transaksi/${id}`,
  },
  PROSPEK: {
    LIST: "/prospek",
    CREATE: "/prospek",
    DELETE: (id) => `/prospek/${id}`,
  },
  TIDAK_TRANSAKSI: {
    LIST: "/tidak-transaksi",
    CREATE: "/tidak-transaksi",
    DELETE: (id) => `/tidak-transaksi/${id}`,
  },
  TIDAK_DIKUNJUNGI: {
    LIST: "/tidak-dikunjungi",
    CREATE: "/tidak-dikunjungi",
    DELETE: (id) => `/tidak-dikunjungi/${id}`,
  },
  LAPORAN_KAS: {
    GET: "/laporan-kas",
    SAVE: "/laporan-kas",
  },
  PECAHAN: {
    GET: "/pecahan",
    SAVE: "/pecahan",
  },
  REKAP: {
    HARIAN: "/rekap/harian",
    BULANAN: "/rekap/bulanan",
  }
};
