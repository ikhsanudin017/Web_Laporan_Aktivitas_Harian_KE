import type { DailyReportData } from '@/types'

type ReportSuggestionKey = keyof DailyReportData

export interface ProcessedPhotoReport {
  cleanedText: string
  timelineText: string
  detectedDate?: string
  detectedCounts: Partial<Record<ReportSuggestionKey, number>>
  suggestions: Partial<Record<ReportSuggestionKey, string | number>>
  activityCount: number
  summary: string
}

const MONTH_MAP: Record<string, string> = {
  januari: '01',
  februari: '02',
  maret: '03',
  april: '04',
  mei: '05',
  juni: '06',
  juli: '07',
  agustus: '08',
  september: '09',
  oktober: '10',
  november: '11',
  desember: '12'
}

const WEEKDAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']

const SUMMARY_LABELS: Partial<Record<ReportSuggestionKey, string>> = {
  survey: 'survey',
  angsuran: 'angsuran',
  fundingB2B: 'funding B2B',
  fundingPersonal: 'funding personal',
  aqod: 'aqod',
  marketingB2B: 'marketing B2B',
  marketingPersonal: 'marketing personal',
  ktp: 'KTP',
  adr: 'ADR',
  quran: "QUR'AN",
  wakaf: 'wakaf',
  gota: 'GOTA',
  b2b: 'B2B',
  maintenance: 'maintenance'
}

const formatTimelineLine = (line: string) => line.replace(/^(\d{2}):(\d{2})\b/, '$1.$2')

const normalizeBusinessTerms = (value: string) =>
  value.replace(/\b(atod|agod|aqed|aqad|akad)\b/gi, 'aqod')

const normalizeWhitespace = (value: string) =>
  normalizeBusinessTerms(value)
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[|•·]/g, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .trim()

const normalizeOcrDigits = (value: string) =>
  value
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/Z/g, '2')
    .replace(/S/g, '5')
    .replace(/B/g, '8')

const normalizeTimePrefix = (line: string) =>
  line.replace(/^([0-2]?\d)[\s.:]([0-5]\d)\b/, (_, hour: string, minute: string) => {
    return `${hour.padStart(2, '0')}:${minute}`
  })

const levenshtein = (source: string, target: string) => {
  const sourceChars = source.toLowerCase()
  const targetChars = target.toLowerCase()
  const matrix = Array.from({ length: sourceChars.length + 1 }, () => Array(targetChars.length + 1).fill(0))

  for (let row = 0; row <= sourceChars.length; row += 1) {
    matrix[row][0] = row
  }

  for (let column = 0; column <= targetChars.length; column += 1) {
    matrix[0][column] = column
  }

  for (let row = 1; row <= sourceChars.length; row += 1) {
    for (let column = 1; column <= targetChars.length; column += 1) {
      const cost = sourceChars[row - 1] === targetChars[column - 1] ? 0 : 1
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      )
    }
  }

  return matrix[sourceChars.length][targetChars.length]
}

const normalizeWord = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/jurnat|jumal|jurnat/g, 'jumat')
    .replace(/rn/g, 'm')
    .trim()

const findClosestMonth = (value: string) => {
  const normalized = normalizeWord(value)

  if (!normalized) {
    return undefined
  }

  if (MONTH_MAP[normalized]) {
    return normalized
  }

  let bestMatch: string | undefined
  let smallestDistance = Number.POSITIVE_INFINITY

  Object.keys(MONTH_MAP).forEach((month) => {
    const distance = levenshtein(normalized, month)

    if (distance < smallestDistance) {
      smallestDistance = distance
      bestMatch = month
    }
  })

  if (smallestDistance <= 2) {
    return bestMatch
  }

  return undefined
}

const buildLineSignature = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()

const normalizeTimelineLine = (line: string) => {
  let cleaned = line
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  cleaned = cleaned.replace(/^[\[(]?\d{1,2}[\])\].:-]?\s*/, '')
  cleaned = normalizeTimePrefix(cleaned)
  cleaned = normalizeBusinessTerms(cleaned)

  return cleaned.trim()
}

const hasTimePrefix = (line: string) => /^\d{2}:\d{2}\b/.test(normalizeTimePrefix(line))

const extractDateFromCandidate = (candidate: string) => {
  const normalized = normalizeOcrDigits(
    candidate
      .toLowerCase()
      .replace(/jum['` ]?at/g, 'jumat')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/(\d)([a-z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
  )

  const patterns = [
    /(?:senin|selasa|rabu|kamis|jumat|sabtu|minggu)?\s*(\d{1,2})\s+([a-z]{3,12})\s+(\d{4})/i,
    /([a-z]{3,12})\s+(\d{1,2})\s+(\d{4})/i
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern)

    if (!match) {
      continue
    }

    const [, first, second, third] = match
    const isMonthFirst = pattern === patterns[1]
    const day = isMonthFirst ? second : first
    const monthWord = isMonthFirst ? first : second
    const year = third
    const month = findClosestMonth(monthWord)

    if (!month) {
      continue
    }

    const numericDay = Number.parseInt(normalizeOcrDigits(day), 10)
    const numericYear = Number.parseInt(normalizeOcrDigits(year), 10)

    if (!Number.isFinite(numericDay) || numericDay < 1 || numericDay > 31) {
      continue
    }

    if (!Number.isFinite(numericYear) || numericYear < 2020 || numericYear > 2100) {
      continue
    }

    return `${numericYear}-${month}-${String(numericDay).padStart(2, '0')}`
  }

  return undefined
}

const extractDetectedDate = (value: string) => {
  const cleanedValue = normalizeWhitespace(value)
  const lines = cleanedValue
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const priorityLines = [
    ...lines.slice(0, 12),
    ...lines.filter((line) => {
      const normalized = line.toLowerCase()
      return WEEKDAYS.some((weekday) => normalized.includes(weekday)) || Object.keys(MONTH_MAP).some((month) => normalized.includes(month.slice(0, 3)))
    })
  ]

  for (const candidate of priorityLines) {
    const detected = extractDateFromCandidate(candidate)

    if (detected) {
      return detected
    }
  }

  return extractDateFromCandidate(cleanedValue)
}

const isNoiseLine = (line: string) => {
  if (!line || line.length < 3) {
    return true
  }

  const lower = line.toLowerCase()

  if (/^(no|date|tanggal|hari)$/i.test(lower)) {
    return true
  }

  if (extractDateFromCandidate(lower)) {
    return true
  }

  if (!/[a-zA-Z]/.test(line)) {
    return true
  }

  return false
}

const mergeContinuationLines = (lines: string[]) => {
  return lines.reduce<string[]>((merged, currentLine) => {
    if (merged.length === 0) {
      merged.push(currentLine)
      return merged
    }

    const lastLine = merged[merged.length - 1]

    if (!hasTimePrefix(currentLine)) {
      merged[merged.length - 1] = `${lastLine} ${currentLine}`.replace(/\s+/g, ' ').trim()
      return merged
    }

    merged.push(currentLine)
    return merged
  }, [])
}

const splitIntoRawLines = (value: string) => {
  const withTimeBreaks = normalizeWhitespace(value)
    .replace(/([^\n])(\s\d{1,2}[\s.:]\d{2}\s+)/g, '$1\n$2')
    .replace(/([^\n])(\s\d{1,2}[.)]\s+\d{1,2}[\s.:]\d{2}\s+)/g, '$1\n$2')

  const baseLines = withTimeBreaks
    .split(/\n+/)
    .flatMap((line) => line.split(/(?=\b\d{1,2}[\s.:]\d{2}\b)/g))
    .map((line) => normalizeTimelineLine(line))
    .filter(Boolean)

  return mergeContinuationLines(baseLines).filter((line) => !isNoiseLine(line))
}

const dedupeLines = (lines: string[]) => {
  const seen = new Set<string>()

  return lines.filter((line) => {
    const signature = buildLineSignature(line)

    if (!signature || seen.has(signature)) {
      return false
    }

    seen.add(signature)
    return true
  })
}

const removeTimePrefix = (line: string) => line.replace(/^\d{2}:\d{2}\s*/, '').trim()

const incrementField = (
  target: Partial<Record<ReportSuggestionKey, number>>,
  field: ReportSuggestionKey,
  availableFields: string[]
) => {
  if (!availableFields.includes(field)) {
    return
  }

  target[field] = (target[field] || 0) + 1
}

const countDetectedFields = (timelineLines: string[], availableFields: string[]) => {
  const counts: Partial<Record<ReportSuggestionKey, number>> = {}

  timelineLines.forEach((line) => {
    const content = normalizeBusinessTerms(removeTimePrefix(line).toLowerCase())
    const compact = content.replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim()

    const isTravelSurveyLine =
      /^(berangkat|sampai|menuju|ke tempat|perjalanan)/.test(compact) &&
      /\b(survey|survei)\b/.test(compact)

    if (!isTravelSurveyLine && /\b(survey|survei)\b/.test(compact)) {
      incrementField(counts, 'survey', availableFields)
      return
    }

    if (/\bangsuran\b/.test(compact)) {
      incrementField(counts, 'angsuran', availableFields)
      return
    }

    if (/\baqod\b/.test(compact)) {
      incrementField(counts, 'aqod', availableFields)
      return
    }

    if (/\bmarketing\b/.test(compact) && /\bb2b\b/.test(compact)) {
      incrementField(counts, 'marketingB2B', availableFields)
      return
    }

    if (/\bmarketing\b/.test(compact)) {
      incrementField(counts, 'marketingPersonal', availableFields)
      return
    }

    if ((/\bfunding\b/.test(compact) || /\btabungan\b/.test(compact)) && /\bb2b\b/.test(compact)) {
      incrementField(counts, 'fundingB2B', availableFields)
      return
    }

    if (/\b(tabungan|simpanan|deposito)\b/.test(compact) || /\bfunding\b/.test(compact)) {
      incrementField(counts, 'fundingPersonal', availableFields)
      return
    }

    if (/\bktp\b/.test(compact)) {
      incrementField(counts, 'ktp', availableFields)
      return
    }

    if (/\badr\b/.test(compact)) {
      incrementField(counts, 'adr', availableFields)
      return
    }

    if (/\bqur'?an\b/.test(compact) || /\bquran\b/.test(compact)) {
      incrementField(counts, 'quran', availableFields)
      return
    }

    if (/\bwakaf\b/.test(compact)) {
      incrementField(counts, 'wakaf', availableFields)
      return
    }

    if (/\bgota\b/.test(compact)) {
      incrementField(counts, 'gota', availableFields)
      return
    }

    if (/\bmaintenance\b/.test(compact)) {
      incrementField(counts, 'maintenance', availableFields)
      return
    }

    if (/\bb2b\b/.test(compact)) {
      incrementField(counts, 'b2b', availableFields)
    }
  })

  return counts
}

export const processPhotoOcrText = (
  rawText: string,
  availableFields: string[],
  currentData: Partial<Record<ReportSuggestionKey, string | number>> = {}
): ProcessedPhotoReport => {
  const cleanedText = normalizeWhitespace(rawText)
  const detectedDate = extractDetectedDate(cleanedText)
  const timelineLines = dedupeLines(splitIntoRawLines(cleanedText))
  const formattedTimelineLines = timelineLines.map((line, index) => `${index + 1}. ${formatTimelineLine(line)}`)
  const timelineText = formattedTimelineLines.join('\n')
  const detectedCounts = countDetectedFields(timelineLines, availableFields)
  const suggestions: Partial<Record<ReportSuggestionKey, string | number>> = {}

  if (timelineText && availableFields.includes('timelineHarian')) {
    suggestions.timelineHarian = timelineText
  }

  if (timelineText && availableFields.includes('aktivitasHarian')) {
    const existing = typeof currentData.aktivitasHarian === 'string' ? currentData.aktivitasHarian.trim() : ''
    suggestions.aktivitasHarian = existing ? `${existing}\n\n${timelineText}` : timelineText
  }

  Object.entries(detectedCounts).forEach(([fieldName, count]) => {
    if (!count) {
      return
    }

    suggestions[fieldName as ReportSuggestionKey] = count
  })

  const summaryItems = Object.entries(detectedCounts)
    .filter(([, count]) => Boolean(count))
    .map(([fieldName, count]) => `${count} ${SUMMARY_LABELS[fieldName as ReportSuggestionKey] || fieldName}`)

  return {
    cleanedText,
    timelineText,
    detectedDate,
    detectedCounts,
    suggestions,
    activityCount: timelineLines.length,
    summary: summaryItems.length > 0 ? summaryItems.join(', ') : 'Belum ada hitungan otomatis yang terdeteksi'
  }
}
