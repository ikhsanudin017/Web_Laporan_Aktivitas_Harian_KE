import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { getAuthToken } from '@heyputer/puter.js/src/init.cjs'

const envPath = resolve(process.cwd(), '.env')

const escapeEnvValue = (value) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const upsertEnvValue = (envText, key, value) => {
  const line = `${key}="${escapeEnvValue(value)}"`
  const pattern = new RegExp(`^${key}=.*$`, 'm')

  if (pattern.test(envText)) {
    return envText.replace(pattern, line)
  }

  return `${envText.trimEnd()}\n${line}\n`
}

console.log('Membuka browser untuk login Puter...')
const token = await getAuthToken()

if (!token) {
  throw new Error('Login Puter tidak mengembalikan token.')
}

const envText = await readFile(envPath, 'utf8').catch(() => '')
await writeFile(envPath, upsertEnvValue(envText, 'PUTER_AUTH_TOKEN', token))

console.log('PUTER_AUTH_TOKEN sudah diperbarui di .env')
