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
    .png()
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

const normalizeStructuredResult = (payload: any): StructuredPhotoResult => {
  const timeline = Array.isArray(payload?.timeline)
    ? payload.timeline
        .map((item: any, index: number) => ({
          index: Number.isFinite(Number(item?.index)) ? Number(item.index) : index + 1,
          time: typeof item?.time === 'string' ? item.time.trim() : '',
          activity: typeof item?.activity === 'string' ? item.activity.trim() : ''
        }))
        .filter((item: TimelineEntry) => item.time || item.activity)
    : []

  const normalizedTranscript =
    typeof payload?.normalizedTranscript === 'string' ? payload.normalizedTranscript.trim() : ''

  return {
    displayDate: typeof payload?.displayDate === 'string' && payload.displayDate.trim() ? payload.displayDate.trim() : null,
    detectedDate: typeof payload?.detectedDate === 'string' && payload.detectedDate.trim() ? payload.detectedDate.trim() : null,
    normalizedTranscript,
    timeline,
    counts: normalizeCounts(payload?.counts),
    notes: typeof payload?.notes === 'string' ? payload.notes.trim() : ''
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

Aturan penting:
- Gunakan gambar sebagai sumber utama. OCR text hanya sebagai bantuan.
- Jangan mengarang isi yang tidak terlihat.
- Pertahankan nama orang apa adanya jika terbaca.
- Gunakan format waktu HH.MM.
- "tabungan", "simpanan", "deposito", dan "funding" dianggap fundingPersonal.
- "Berangkat Survey" dan "Sampai tempat survey ..." masuk timeline, tetapi TIDAK menambah hitungan survey.
- Hitung survey hanya jika barisnya adalah kegiatan survey yang benar-benar dilakukan, misalnya "Survey Ruswanti".
- Hitung angsuran bila baris menunjukkan ambil/setor/tagih angsuran.
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
            activity: { type: 'string' }
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
                  mimeType: 'image/png',
                  data: fullImageBase64
                }
              },
              {
                inlineData: {
                  mimeType: 'image/png',
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
    const rotatedImage = await sharp(Buffer.from(arrayBuffer)).rotate().png().toBuffer()
    const headerCrop = await extractHeaderCrop(rotatedImage)

    let visionText = ''
    if (!visionBillingDisabled && hasVisionCredentials()) {
      try {
        const visionImage = await preprocessForVision(rotatedImage)
        visionText = await callVisionOcr(toBase64(visionImage))
      } catch (error) {
        const message = getErrorMessage(error)

        if (isVisionBillingError(message)) {
          visionBillingDisabled = true
          console.warn('Vision OCR dilewati: billing belum aktif, lanjut pakai Gemini.')
        } else {
          console.warn(`Vision OCR dilewati: ${message}`)
        }
      }
    }

    let structured: StructuredPhotoResult | null = null
    try {
      structured = await callGeminiStructuring(toBase64(rotatedImage), toBase64(headerCrop), visionText)
    } catch (error) {
      console.error('Gemini structuring error:', error)
    }

    if (!visionText && !structured) {
      return NextResponse.json(
        {
          message:
            'Google Vision OCR atau Gemini belum bisa dipakai. Set `GOOGLE_CLOUD_VISION_API_KEY` atau kredensial Google Cloud, dan `GEMINI_API_KEY`.'
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
