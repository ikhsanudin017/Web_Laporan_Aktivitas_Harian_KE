import { FormConfig } from '@/types'

export const FORM_CONFIGS: Record<string, FormConfig> = {
  USTADZ_YULI: {
    role: 'USTADZ_YULI' as any,
    title: 'Form Laporan Harian - Ustadz Yuli',
    fields: [
      {
        name: 'aktivitasHarian',
        label: 'Aktivitas Harian',
        type: 'textarea',
        required: true,
        placeholder: 'Masukkan aktivitas harian Anda...'
      }
    ]
  },

  BAPAK_TOHA: {
    role: 'BAPAK_TOHA' as any,
    title: 'Form Laporan Harian - Bapak Toha',
    fields: [
      {
        name: 'aktivitasHarian',
        label: 'Aktivitas Harian',
        type: 'textarea',
        required: true,
        placeholder: 'Masukkan aktivitas harian Anda...'
      }
    ]
  },

  BAPAK_SAYUDI: {
    role: 'BAPAK_SAYUDI' as any,
    title: 'Form Laporan Harian - Bapak Sayudi',
    fields: [
      {
        name: 'angsuran',
        label: 'Angsuran',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'fundingB2B',
        label: 'Funding B2B',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Funding'
      },
      {
        name: 'fundingPersonal',
        label: 'Funding Personal',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Funding'
      },
      {
        name: 'survey',
        label: 'Survey',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'keterangan',
        label: 'Keterangan',
        type: 'textarea',
        required: false,
        placeholder: 'Keterangan tambahan...'
      },
      {
        name: 'kegiatan',
        label: 'Aktivitas Lainnya (*Selain yang ada pada tabel)',
        type: 'textarea',
        required: false,
        placeholder: 'Masukkan aktivitas lainnya...'
      }
    ]
  },

  MAS_ANGGIT: {
    role: 'MAS_ANGGIT' as any,
    title: 'Form Laporan Harian - Mas Anggit',
    fields: [
      {
        name: 'angsuran',
        label: 'Angsuran',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'survey',
        label: 'Survey',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'keterangan',
        label: 'Keterangan',
        type: 'textarea',
        required: false,
        placeholder: 'Keterangan tambahan...'
      },
      {
        name: 'kegiatan',
        label: 'Aktivitas Lainnya (*Selain yang ada pada tabel)',
        type: 'textarea',
        required: false,
        placeholder: 'Masukkan aktivitas lainnya...'
      }
    ]
  },

  BAPAK_ARWAN: {
    role: 'BAPAK_ARWAN' as any,
    title: 'Form Laporan Harian - Bapak Arwan',
    fields: [
      {
        name: 'angsuran',
        label: 'Angsuran',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'fundingB2B',
        label: 'Funding B2B',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Funding'
      },
      {
        name: 'fundingPersonal',
        label: 'Funding Personal',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Funding'
      },
      {
        name: 'marketingB2B',
        label: 'Marketing B2B',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Marketing'
      },
      {
        name: 'marketingPersonal',
        label: 'Marketing Personal',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Marketing'
      },
      {
        name: 'survey',
        label: 'Survey',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'keterangan',
        label: 'Keterangan',
        type: 'textarea',
        required: false,
        placeholder: 'Keterangan tambahan...'
      },
      {
        name: 'kegiatan',
        label: 'Aktivitas Lainnya (*Selain yang ada pada tabel)',
        type: 'textarea',
        required: false,
        placeholder: 'Masukkan aktivitas lainnya...'
      }
    ]
  },

  MBAK_EKA: {
    role: 'MBAK_EKA' as any,
    title: 'Form Laporan Harian - Mbak Eka',
    fields: [
      {
        name: 'angsuran',
        label: 'Angsuran',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'fundingB2B',
        label: 'Funding B2B',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Funding'
      },
      {
        name: 'fundingPersonal',
        label: 'Funding Personal',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Funding'
      },
      {
        name: 'marketingB2B',
        label: 'Marketing B2B',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Marketing'
      },
      {
        name: 'marketingPersonal',
        label: 'Marketing Personal',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Marketing'
      },
      {
        name: 'survey',
        label: 'Survey',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'keterangan',
        label: 'Keterangan',
        type: 'textarea',
        required: false,
        placeholder: 'Keterangan tambahan...'
      },
      {
        name: 'kegiatan',
        label: 'Aktivitas Lainnya (*Selain yang ada pada tabel)',
        type: 'textarea',
        required: false,
        placeholder: 'Masukkan aktivitas lainnya...'
      }
    ]
  },

  BAPAK_DIAH: {
    role: 'BAPAK_DIAH' as any,
    title: 'Form Laporan Harian - Bapak Diah Supriyanto',
    fields: [
      {
        name: 'angsuran',
        label: 'Angsuran',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'fundingB2B',
        label: 'Funding B2B',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Funding'
      },
      {
        name: 'fundingPersonal',
        label: 'Funding Personal',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Funding'
      },
      {
        name: 'marketingB2B',
        label: 'Marketing B2B',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Marketing'
      },
      {
        name: 'marketingPersonal',
        label: 'Marketing Personal',
        type: 'dropdown-number',
        required: false,
        placeholder: '0',
        category: 'Marketing'
      },
      {
        name: 'survey',
        label: 'Survey',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'keterangan',
        label: 'Keterangan',
        type: 'textarea',
        required: false,
        placeholder: 'Keterangan tambahan...'
      },
      {
        name: 'kegiatan',
        label: 'Aktivitas Lainnya (*Selain yang ada pada tabel)',
        type: 'textarea',
        required: false,
        placeholder: 'Masukkan aktivitas lainnya...'
      }
    ]
  },

  BAPAK_PRASETYO: {
    role: 'BAPAK_PRASETYO' as any,
    title: 'Form Laporan Harian - Bapak Prasetyo Dani',
    fields: [
      {
        name: 'ktp',
        label: 'KTP',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'adr',
        label: 'ADR',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'quran',
        label: "QUR'AN",
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'wakaf',
        label: 'WAKAF',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'gota',
        label: 'GOTA',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'keterangan',
        label: 'Keterangan',
        type: 'textarea',
        required: false,
        placeholder: 'Keterangan tambahan...'
      },
      {
        name: 'lainLain',
        label: 'Aktivitas Lainnya',
        type: 'textarea',
        required: false,
        placeholder: 'Aktivitas lainnya...'
      }
    ]
  },

  BAPAK_GIYARTO: {
    role: 'BAPAK_GIYARTO' as any,
    title: 'Form Laporan Harian - Bapak Giyarto',
    fields: [
      {
        name: 'ktp',
        label: 'KTP',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'adr',
        label: 'ADR',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'quran',
        label: "QUR'AN",
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'wakaf',
        label: 'WAKAF',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'gota',
        label: 'GOTA',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'b2b',
        label: 'B2B',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'maintenance',
        label: 'Maintenance',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'keterangan',
        label: 'Keterangan',
        type: 'textarea',
        required: false,
        placeholder: 'Keterangan tambahan...'
      },
      {
        name: 'lainLain',
        label: 'Aktivitas Lainnya',
        type: 'textarea',
        required: false,
        placeholder: 'Aktivitas lainnya...'
      }
    ]
  },

  // Admin configuration with all possible fields for comprehensive export
  ADMIN: {
    role: 'ADMIN' as any,
    title: 'Form Laporan Harian - Administrator',
    fields: [
      // Basic fields
      {
        name: 'aktivitasHarian',
        label: 'Aktivitas Harian',
        type: 'textarea',
        required: false,
        placeholder: 'Aktivitas harian...'
      },
      // Marketing funding fields
      {
        name: 'angsuran',
        label: 'Angsuran',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'kegiatan',
        label: 'Kegiatan',
        type: 'textarea',
        required: false,
        placeholder: 'Kegiatan...'
      },
      {
        name: 'fundingB2B',
        label: 'Funding B2B',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'fundingPersonal',
        label: 'Funding Personal',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'survey',
        label: 'Survey',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'keterangan',
        label: 'Keterangan',
        type: 'textarea',
        required: false,
        placeholder: 'Keterangan...'
      },
      // Additional fields from various users
      {
        name: 'marketingFunding',
        label: 'Marketing Funding',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'pembayaranAngsuran',
        label: 'Pembayaran Angsuran',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'visitingAnggota',
        label: 'Visiting Anggota',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'pencairanKredit',
        label: 'Pencairan Kredit',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'supervising',
        label: 'Supervising',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'evaluasi',
        label: 'Evaluasi',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'meeting',
        label: 'Meeting',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'visitingCabang',
        label: 'Visiting Cabang',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'maintenance',
        label: 'Maintenance',
        type: 'dropdown-number',
        required: false,
        placeholder: '0'
      },
      {
        name: 'lainLain',
        label: 'Lain-Lain',
        type: 'textarea',
        required: false,
        placeholder: 'Aktivitas lain-lain...'
      }
    ]
  }
}
