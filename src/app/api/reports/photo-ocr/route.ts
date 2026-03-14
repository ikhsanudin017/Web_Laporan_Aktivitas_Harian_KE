import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { GoogleAuth } from 'google-auth-library'

export const runtime = 'nodejs'
export const maxDuration = 60

type TimelineEntry = {
  index: number
  time: string
  activity: string
}

type StructuredCounts = {
  survey: number
  angsuran: number
  fundingPersonal: number
  fundingB2B: number
  aqod: number
  marketingPersonal: number
  marketingB2B: number
  ktp: number
  adr: number
  quran: number
  wakaf: number
  gota: number
  b2b: number
  maintenance: number
}

type StructuredPhotoResult = {
  displayDate: string | null
  detectedDate: string | null
  normalizedTranscript: string
  timeline: TimelineEntry[]
  counts: StructuredCounts
  notes: string
}

const DEFAULT_COUNTS: StructuredCounts = {
  survey: 0,
  angsuran: 0,
  fundingPersonal: 0,
  fundingB2B: 0,
  aqod: 0,
  marketingPersonal: 0,
  marketingB2B: 0,
  ktp: 0,
  adr: 0,
  quran: 0,
  wakaf: 0,
  gota: 0,
  b2b: 0,
  maintenance: 0
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const VISION_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
let visionBillingDisabled = false

const toBase64 = (buffer: Buffer) => buffer.toString('base64')

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

const hasVisionCredentials = () =>
  Boolean(
    process.env.GOOGLE_CLOUD_VISION_API_KEY ||
      process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
  )

const isVisionBillingError = (message: string) => {
  const normalizedMessage = message.toLowerCase()
  return (
    normalizedMessage.includes('requires billing to be enabled') ||
    normalizedMessage.includes('please enable billing') ||
    normalizedMessage.includes('billing/enable')
  )
}

const getServiceAccountCredentials = () => {
  const rawCredentials = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON

  if (!rawCredentials) {
    return undefined
  }

  try {
    return JSON.parse(rawCredentials)
  } catch (error) {
    console.error('Invalid GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON:', error)
    throw new Error('GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON tidak valid')
  }
}

const getVisionRequestUrlAndHeaders = async () => {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY

  if (apiKey) {
    return {
      url: `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      headers: {
        'Content-Type': 'application/json'
      } as Record<string, string>
    }
  }

  const credentials = getServiceAccountCredentials()
  const auth = new GoogleAuth({
    credentials,
    scopes: [VISION_SCOPE]
  })
  const client = await auth.getClient()
  const accessTokenResponse = await client.getAccessToken()
  const accessToken =
    typeof accessTokenResponse === 'string' ? accessTokenResponse : accessTokenResponse?.token

  if (!accessToken) {
    throw new Error('Gagal mendapatkan access token Google Cloud Vision')
  }

  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT_ID ||
    credentials?.project_id ||
    (await auth.getProjectId().catch(() => undefined))

  return {
    url: 'https://vision.googleapis.com/v1/images:annotate',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(projectId ? { 'x-goog-user-project': projectId } : {})
    } as Record<string, string>
  }
}

const extractHeaderCrop = async (buffer: Buffer) => {
  const image = sharp(buffer)
  const metadata = await image.metadata()
  const width = metadata.width || 1200
  const height = metadata.height || 1600

  return sharp(buffer)
    .extract({
      left: Math.max(0, Math.floor(width * 0.08)),
      top: Math.max(0, Math.floor(height * 0.03)),
      width: Math.min(width - Math.floor(width * 0.08), Math.floor(width * 0.84)),
      height: Math.min(height - Math.floor(height * 0.03), Math.floor(height * 0.17))
    })
    .resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toBuffer()
}

const preprocessForVision = async (buffer: Buffer) => {
  return sharp(buffer)
    .resize({ width: 2200, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1.3 })
    .linear(1.16, -8)
    .png()
    .toBuffer()
}

const preprocessForGemini = async (buffer: Buffer) => {
  return sharp(buffer)
    .resize({ width: 1800, withoutEnlargement: true })
    .jpeg({ quality: 86, chromaSubsampling: '4:4:4' })
    .toBuffer()
}

const callVisionOcr = async (base64Image: string) => {
  const { url, headers } = await getVisionRequestUrlAndHeaders()
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION'
            }
          ],
          imageContext: {
            languageHints: ['id', 'en']
          }
        }
      ]
    })
  })

  const json = await response.json()

  if (!response.ok) {
    throw new Error(json?.error?.message || 'Vision OCR request gagal')
  }

  const annotation = json?.responses?.[0]

  if (annotation?.error?.message) {
    throw new Error(annotation.error.message)
  }

  return (annotation?.fullTextAnnotation?.text || '').trim()
}

const extractGeminiText = (responseJson: any) => {
  const text = responseJson?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part?.text || '')
    .join('')
    ?.trim()

  if (!text) {
    throw new Error('Gemini tidak mengembalikan konten')
  }

  return text
}

const normalizeCounts = (counts: Partial<StructuredCounts> | undefined): StructuredCounts => {
  const nextCounts = { ...DEFAULT_COUNTS }

  Object.entries(DEFAULT_COUNTS).forEach(([key]) => {
    const value = counts?.[key as keyof StructuredCounts]
    nextCounts[key as keyof StructuredCounts] = Number.isFinite(Number(value)) ? Number(value) : 0
  })

  return nextCounts
}

const BUSINESS_KEYWORD_PATTERNS = [
  /\bsholat\b/i,
  /\bistirahat\b/i,
  /\bevent\b/i,
  /\bsurvey\b/i,
  /\bsurvei\b/i,
  /\baqod\b/i,
  /\batod\b/i,
  /\bkunjungan\b/i,
  /\bfunding\b/i,
  /\btabungan\b/i,
  /\bmarketing\b/i,
  /\bwakaf\b/i,
  /\bqur'?an\b/i,
  /\bktp\b/i,
  /\badr\b/i,
  /\bmaintenance\b/i,
  /\bberangkat\b/i,
  /\bsampai\b/i,
  /\bselesai\b/i
]

const splitActivityLines = (activity: string) =>
  activity
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const normalizeBusinessTerms = (value: string) =>
  value
    .replace(/\b(atod|agod|aqed|aqad|akad)\b/gi, 'aqod')
    .replace(/\b(kunjugan|kunjgan|kunjngan)\b/gi, 'kunjungan')

const BUSINESS_ENTITY_PATTERNS = [
  /\bb2b\b/i,
  /\bud\b/i,
  /\btk\b/i,
  /\btb\b/i,
  /\bcv\b/i,
  /\bpt\b/i,
  /\btoko\b/i,
  /\bmotor\b/i,
  /\bcell\b/i,
  /\bsalon\b/i,
  /\bperabot\b/i,
  /\bbengkel\b/i,
  /\bstore\b/i,
  /\bshop\b/i,
  /\bcounter\b/i
]

const hasBusinessContext = (value: string) =>
  BUSINESS_ENTITY_PATTERNS.some((pattern) => pattern.test(normalizeBusinessTerms(value)))

const extractActivityMarkerCode = (value: string) => {
  const normalized = normalizeBusinessTerms(value).replace(/[^a-z0-9\s]/gi, ' ')
  const codes = normalized.match(/\b[alf]\b/gi)

  if (!codes?.length) {
    return null
  }

  return codes[codes.length - 1].toUpperCase()
}

const classifyFieldFromMarker = (
  value: string
): 'angsuran' | 'fundingPersonal' | 'fundingB2B' | 'marketingPersonal' | 'marketingB2B' | null => {
  const markerCode = extractActivityMarkerCode(value)

  if (!markerCode) {
    return null
  }

  if (markerCode === 'A') {
    return 'angsuran'
  }

  if (markerCode === 'F') {
    return hasBusinessContext(value) ? 'fundingB2B' : 'fundingPersonal'
  }

  if (markerCode === 'L') {
    return hasBusinessContext(value) ? 'marketingB2B' : 'marketingPersonal'
  }

  return null
}

const stripBulletPrefix = (value: string) => value.replace(/^-+\s*/, '').trim()

const looksLikePersonEntry = (value: string) => {
  const normalized = stripBulletPrefix(value)
    .replace(/\b(atod|agod|aqed|aqad|akad)\b/gi, 'aqod')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[’']/g, '')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return false
  }

  if (BUSINESS_KEYWORD_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false
  }

  if (/[0-9]/.test(normalized) || normalized.includes('+') || normalized.includes(':')) {
    return false
  }

  const words = normalized.split(' ').filter(Boolean)

  if (words.length < 1 || words.length > 4) {
    return false
  }

  return words.every((word) => /^[a-zA-Z]+$/.test(word))
}

const countAngsuranNamesFromActivity = (activity: string) => {
  const lines = splitActivityLines(activity)

  if (lines.length === 0) {
    return 0
  }

  const firstLine = stripBulletPrefix(lines[0])
  const firstLineWithoutPrefix = firstLine.replace(/^:+\s*/, '').trim()
  const bulletLines = lines.slice(1).map(stripBulletPrefix).filter(Boolean)
  const bulletCount = bulletLines.filter(looksLikePersonEntry).length

  if (/\bangsuran\b/i.test(firstLine)) {
    const trailingName = firstLine
      .replace(/^.*?\bangsuran\b/i, '')
      .replace(/^[:\-\s]+/, '')
      .trim()

    return bulletCount + (looksLikePersonEntry(trailingName) ? 1 : 0)
  }

  if ((!firstLineWithoutPrefix || firstLineWithoutPrefix === ':') && bulletCount > 0) {
    return bulletCount
  }

  const personLikeLineCount = lines
    .map(stripBulletPrefix)
    .filter(looksLikePersonEntry).length

  if (personLikeLineCount === lines.length && personLikeLineCount > 1) {
    return personLikeLineCount
  }

  return 0
}

const classifyMarketingActivity = (activity: string) => {
  const normalized = normalizeBusinessTerms(activity).toLowerCase()
  const markerField = classifyFieldFromMarker(normalized)

  if (markerField === 'marketingB2B' || markerField === 'marketingPersonal') {
    return markerField
  }

  if (!/\b(marketing|kunjungan)\b/.test(normalized)) {
    return null
  }

  return hasBusinessContext(normalized) ? 'marketingB2B' : 'marketingPersonal'
}

const inferStructuredCounts = (
  timeline: TimelineEntry[],
  counts: StructuredCounts
): StructuredCounts => {
  const inferredCounts = { ...counts }

  const inferredAngsuran = timeline.reduce((total, item) => {
    return total + countAngsuranNamesFromActivity(item.activity)
  }, 0)

  if (inferredAngsuran > inferredCounts.angsuran) {
    inferredCounts.angsuran = inferredAngsuran
  }

  const inferredAqod = timeline.reduce((total, item) => {
    const matches = normalizeBusinessTerms(item.activity).match(/\baqod\b/gi)
    return total + (matches?.length || 0)
  }, 0)

  if (inferredAqod > inferredCounts.aqod) {
    inferredCounts.aqod = inferredAqod
  }

  const inferredMarkerAngsuran = timeline.reduce((total, item) => {
    return total + (classifyFieldFromMarker(item.activity) === 'angsuran' ? 1 : 0)
  }, 0)

  if (inferredMarkerAngsuran > inferredCounts.angsuran) {
    inferredCounts.angsuran = inferredMarkerAngsuran
  }

  const inferredFundingPersonal = timeline.reduce((total, item) => {
    return total + (classifyFieldFromMarker(item.activity) === 'fundingPersonal' ? 1 : 0)
  }, 0)

  if (inferredFundingPersonal > inferredCounts.fundingPersonal) {
    inferredCounts.fundingPersonal = inferredFundingPersonal
  }

  const inferredFundingB2B = timeline.reduce((total, item) => {
    return total + (classifyFieldFromMarker(item.activity) === 'fundingB2B' ? 1 : 0)
  }, 0)

  if (inferredFundingB2B > inferredCounts.fundingB2B) {
    inferredCounts.fundingB2B = inferredFundingB2B
  }

  const inferredMarketingPersonal = timeline.reduce((total, item) => {
    return total + (classifyMarketingActivity(item.activity) === 'marketingPersonal' ? 1 : 0)
  }, 0)

  if (inferredMarketingPersonal > inferredCounts.marketingPersonal) {
    inferredCounts.marketingPersonal = inferredMarketingPersonal
  }

  const inferredMarketingB2B = timeline.reduce((total, item) => {
    return total + (classifyMarketingActivity(item.activity) === 'marketingB2B' ? 1 : 0)
  }, 0)

  if (inferredMarketingB2B > inferredCounts.marketingB2B) {
    inferredCounts.marketingB2B = inferredMarketingB2B
  }

  return inferredCounts
}

const normalizeStructuredResult = (payload: any): StructuredPhotoResult => {
  const timeline = Array.isArray(payload?.timeline)
    ? payload.timeline
        .map((item: any, index: number) => ({
          index: Number.isFinite(Number(item?.index)) ? Number(item.index) : index + 1,
          time: typeof item?.time === 'string' ? item.time.trim() : '',
          activity:
            typeof item?.activity === 'string'
              ? normalizeBusinessTerms(item.activity)
                  .replace(/\r/g, '\n')
                  .split('\n')
                  .map((line: string, lineIndex: number) => {
                    const trimmed = line.trim()

                    if (!trimmed) {
                      return ''
                    }

                    if (lineIndex === 0) {
                      return trimmed
                    }

                    return trimmed.startsWith('-') ? `- ${trimmed.replace(/^-+\s*/, '')}` : `- ${trimmed}`
                  })
                  .filter(Boolean)
                  .join('\n')
                  .trim()
              : ''
        }))
        .filter((item: TimelineEntry) => item.time || item.activity)
    : []

  const normalizedTranscript =
    typeof payload?.normalizedTranscript === 'string'
      ? normalizeBusinessTerms(payload.normalizedTranscript).trim()
      : ''

  return {
    displayDate: typeof payload?.displayDate === 'string' && payload.displayDate.trim() ? payload.displayDate.trim() : null,
    detectedDate: typeof payload?.detectedDate === 'string' && payload.detectedDate.trim() ? payload.detectedDate.trim() : null,
    normalizedTranscript,
    timeline,
    counts: inferStructuredCounts(timeline, normalizeCounts(payload?.counts)),
    notes: typeof payload?.notes === 'string' ? normalizeBusinessTerms(payload.notes).trim() : ''
  }
}

const callGeminiStructuring = async (fullImageBase64: string, headerImageBase64: string, visionText: string) => {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return null
  }

  const prompt = `
Anda mengekstrak catatan aktivitas harian tulisan tangan berbahasa Indonesia dari foto.

Tujuan:
1. Baca tanggal dari header foto. Jika terlihat "Sabtu 7 Maret 2026", hasilkan:
   - displayDate = "Sabtu 7 Maret 2026"
   - detectedDate = "2026-03-07"
2. Susun timeline bersih dari setiap baris bernomor yang benar-benar terlihat.
3. Hasilkan normalizedTranscript dengan format:
   Baris 1: displayDate
   Baris 2: kosong
   Baris berikutnya: "1. 08.30 Berangkat Survey" dan seterusnya.

Aturan format timeline:
- Jika sebuah item hanya 1 aktivitas biasa, formatkan seperti:
  "1. 08.20 - 09.00 : Ambil angsuran Eko nurul Huda"
- Jika sebuah blok mencakup rentang waktu lalu berisi beberapa nama/kegiatan di bawahnya, gabungkan menjadi SATU item timeline.
- Untuk blok seperti itu, kolom activity HARUS berupa teks multiline, misalnya:
  ":\n- Okik setyobudi\n- Dwi yanto\n- Gunawan (TF)"
- Pertahankan tanda kurung seperti "(TF)", "(Sda)", "(Senen)" apa adanya jika terlihat.
- Jika di foto ada kurung kurawal/garis penghubung yang menggabungkan beberapa nomor menjadi satu blok waktu, gabungkan semua isi blok itu menjadi satu item timeline.
- Jika waktu awal ada di baris atas dan waktu akhir ada di baris bawah blok yang sama, gunakan format "HH.MM - HH.MM".
- Jangan pecah daftar nama menjadi item timeline terpisah kalau sebenarnya masih satu blok waktu yang sama.

Contoh acuan yang harus diikuti untuk pola seperti foto lapangan:
Tanggal:
"Minggu 1 Maret 2026"

Timeline yang benar:
1. 08.20 - 09.00 : Ambil angsuran Eko nurul Huda
2. 09.00 - 12.00 :
   - Okik setyobudi
   - Dwi yanto
   - Gunawan (TF)
   - Dwi yulianti (TF)
   - Intarto (Sda)
   - Wahyu
   - Bambang Gunawan (Senen)
3. 12.00 - 13.00 : Sholat dhuhur + istirahat
4. 13.00 - 14.30 : Event di Sengon RT 2 + p. Supadi
5. 14.30 - 17.15 :
   - Ambil angsuran Siswanto
   - Didik
   - Ria aprilia (Sda)
   - Agus Bintaro

Untuk contoh di atas, nilai counts.angsuran yang benar adalah 12.

Aturan penting:
- Gunakan gambar sebagai sumber utama. OCR text hanya sebagai bantuan.
- Jangan mengarang isi yang tidak terlihat.
- Pertahankan nama orang apa adanya jika terbaca.
- Gunakan format waktu HH.MM.
- "tabungan", "simpanan", "deposito", dan "funding" dianggap fundingPersonal.
- Jika OCR membaca "atod", "agod", "aqed", "aqad", atau "akad", normalisasikan menjadi "aqod".
- Jika OCR membaca "kunjugan", normalisasikan menjadi "kunjungan".
- Jika ada kode huruf tunggal yang berdiri sendiri pada aktivitas, artinya:
  - "L" = lending / marketing
  - "F" = funding / tabungan
  - "A" = angsuran
- Kode "L/F/A" dipakai sebagai petunjuk klasifikasi count, terutama pada aktivitas kunjungan.
- Jika aktivitas berkonteks toko/usaha/instansi seperti "UD", "TB", "TK", "motor", "cell", "salon", "perabot", arahkan "L/F" ke field B2B.
- "Berangkat Survey" dan "Sampai tempat survey ..." masuk timeline, tetapi TIDAK menambah hitungan survey.
- Hitung survey hanya jika barisnya adalah kegiatan survey yang benar-benar dilakukan, misalnya "Survey Ruswanti".
- Hitung angsuran bila ada aktivitas "ambil/setor/tagih angsuran", termasuk jika muncul di dalam bullet list pada satu blok waktu.
- Hitung aqod hanya jika memang ada aktivitas aqod/akad yang terlihat jelas.
- Hitung "kunjungan" sebagai marketingPersonal secara default.
- Jika ada "marketing" atau "kunjungan" yang jelas bertuliskan "B2B", hitung sebagai marketingB2B.
- Jangan menghitung nama orang biasa sebagai survey/angsuran/funding kalau tidak ada kata kegiatannya.
- Aktivitas seperti "Sholat dhuhur + istirahat" atau "Event ..." masuk timeline, tetapi tidak menambah hitungan field bisnis kecuali ada kata kunci yang jelas.
- Jika tidak yakin, lebih baik kosongkan daripada menebak.
- Untuk timeline, gunakan urutan nomor yang terlihat pada kertas.

OCR bantuan dari Vision:
${visionText || '(tidak ada OCR bantuan)'}
`.trim()

  const schema = {
    type: 'object',
    properties: {
      displayDate: {
        type: ['string', 'null'],
        description: 'Tanggal tampilan persis seperti yang terlihat di foto, contoh: Sabtu 7 Maret 2026'
      },
      detectedDate: {
        type: ['string', 'null'],
        description: 'Tanggal ISO YYYY-MM-DD jika tanggal terlihat jelas'
      },
      normalizedTranscript: {
        type: 'string',
        description: 'Teks hasil normalisasi yang rapi'
      },
      timeline: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            index: { type: 'integer' },
            time: { type: 'string' },
            activity: {
              type: 'string',
              description: 'Deskripsi aktivitas. Boleh multiline dengan bullet list memakai format "- item" pada baris berikutnya.'
            }
          },
          required: ['index', 'time', 'activity']
        }
      },
      counts: {
        type: 'object',
        properties: {
          survey: { type: 'integer' },
          angsuran: { type: 'integer' },
          fundingPersonal: { type: 'integer' },
          fundingB2B: { type: 'integer' },
          aqod: { type: 'integer' },
          marketingPersonal: { type: 'integer' },
          marketingB2B: { type: 'integer' },
          ktp: { type: 'integer' },
          adr: { type: 'integer' },
          quran: { type: 'integer' },
          wakaf: { type: 'integer' },
          gota: { type: 'integer' },
          b2b: { type: 'integer' },
          maintenance: { type: 'integer' }
        },
        required: [
          'survey',
          'angsuran',
          'fundingPersonal',
          'fundingB2B',
          'aqod',
          'marketingPersonal',
          'marketingB2B',
          'ktp',
          'adr',
          'quran',
          'wakaf',
          'gota',
          'b2b',
          'maintenance'
        ]
      },
      notes: {
        type: 'string',
        description: 'Catatan singkat bila ada bagian yang meragukan'
      }
    },
    required: ['displayDate', 'detectedDate', 'normalizedTranscript', 'timeline', 'counts', 'notes']
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: fullImageBase64
                }
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: headerImageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseJsonSchema: schema
        }
      })
    }
  )

  const responseJson = await response.json()

  if (!response.ok) {
    throw new Error(responseJson?.error?.message || 'Gemini request gagal')
  }

  const text = extractGeminiText(responseJson)
  return normalizeStructuredResult(JSON.parse(text))
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('photo')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: 'File foto tidak ditemukan' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'File harus berupa gambar' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const normalizedImage = await sharp(Buffer.from(arrayBuffer))
      .rotate()
      .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
      .toBuffer()

    const [headerCrop, geminiImage] = await Promise.all([
      extractHeaderCrop(normalizedImage),
      preprocessForGemini(normalizedImage)
    ])

    let visionText = ''
    let visionErrorMessage = ''
    if (!visionBillingDisabled && hasVisionCredentials()) {
      try {
        const visionImage = await preprocessForVision(normalizedImage)
        visionText = await callVisionOcr(toBase64(visionImage))
      } catch (error) {
        const message = getErrorMessage(error)
        visionErrorMessage = message

        if (isVisionBillingError(message)) {
          visionBillingDisabled = true
          console.warn('Vision OCR dilewati: billing belum aktif, lanjut pakai Gemini.')
        } else {
          console.warn(`Vision OCR dilewati: ${message}`)
        }
      }
    }

    let structured: StructuredPhotoResult | null = null
    let geminiErrorMessage = ''
    try {
      structured = await callGeminiStructuring(toBase64(geminiImage), toBase64(headerCrop), visionText)
    } catch (error) {
      geminiErrorMessage = getErrorMessage(error)
      console.error('Gemini structuring error:', error)
    }

    if (!visionText && !structured) {
      const diagnostics = [visionErrorMessage, geminiErrorMessage].filter(Boolean)
      return NextResponse.json(
        {
          message:
            diagnostics.length > 0
              ? `OCR foto gagal diproses. ${diagnostics.join(' | ')}`
              : 'Google Vision OCR atau Gemini belum bisa dipakai. Set `GOOGLE_CLOUD_VISION_API_KEY` atau kredensial Google Cloud, dan `GEMINI_API_KEY`.'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      text: structured?.normalizedTranscript || visionText,
      ocrText: visionText,
      structured
    })
  } catch (error) {
    console.error('Photo OCR API error:', error)
    return NextResponse.json(
      { message: 'Gagal memproses foto OCR' },
      { status: 500 }
    )
  }
}
