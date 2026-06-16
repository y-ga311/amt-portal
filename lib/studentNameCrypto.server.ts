import { createServiceRoleClient } from "@/lib/supabase/serviceRole"

/** 移行期間中に使われていたプレースホルダーキー（旧暗号化データの復号用） */
const LEGACY_PLACEHOLDER_KEY = "ここに暗号化キーを設定"

/** DB 保存用の現行暗号化キー（環境変数のみ。Git にコミットしない） */
export function getPrimaryEncryptionKey(): string | null {
  const key = process.env.STUDENT_NAME_ENCRYPTION_KEY?.trim()
  return key || null
}

function getEncryptionKeys(): string[] {
  const keys: string[] = []
  const add = (value: string | undefined) => {
    const trimmed = value?.trim()
    if (trimmed && !keys.includes(trimmed)) {
      keys.push(trimmed)
    }
  }

  add(process.env.STUDENT_NAME_ENCRYPTION_KEY)
  add(process.env.STUDENT_NAME_ENCRYPTION_KEY_LEGACY)
  if (!keys.includes(LEGACY_PLACEHOLDER_KEY)) {
    add(LEGACY_PLACEHOLDER_KEY)
  }

  return keys
}

/** Supabase 表示などで base64 暗号文に改行が混ざることがある */
function normalizeStudentName(value: string) {
  return value.trim().replace(/\s+/g, "")
}

/** ひらがな・カタカナ・漢字を含む → DB 上の平文氏名 */
function containsJapanese(value: string) {
  return /[\u3040-\u30ff\u4e00-\u9faf]/.test(value)
}

/** pgp_sym_encrypt + base64 の暗号文形式か */
function isBase64Ciphertext(value: string) {
  if (!/^[A-Za-z0-9+/]+=*$/.test(value)) {
    return false
  }

  try {
    return Buffer.from(value, "base64").length >= 8
  } catch {
    return false
  }
}

/** 復号 RPC を呼ぶべきか（平文の日本語氏名は除外） */
export function looksLikeEncryptedStudentName(value: string) {
  const normalized = normalizeStudentName(value)
  if (!normalized) {
    return false
  }
  if (containsJapanese(normalized)) {
    return false
  }
  return isBase64Ciphertext(normalized)
}

async function decryptWithPostgresRpc(
  encrypted: string,
  encryptionKey: string,
): Promise<string | null> {
  const supabase = createServiceRoleClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.rpc("decrypt_student_name", {
    encrypted_name: encrypted,
    secret_key: encryptionKey,
  })

  if (error) {
    if (
      error.message.includes("decrypt_student_name") ||
      error.code === "PGRST202"
    ) {
      console.warn(
        "[studentNameCrypto] decrypt_student_name RPC is missing. Run docs/sql/create-decrypt-student-name-function.sql in Supabase.",
      )
    } else {
      console.error("[studentNameCrypto] rpc decrypt failed:", error.message)
    }
    return null
  }

  if (typeof data !== "string") {
    return null
  }

  const decrypted = data.trim()
  if (!decrypted) {
    return null
  }

  // RPC が復号失敗時に暗号文をそのまま返した場合は採用しない
  if (
    decrypted === encrypted ||
    normalizeStudentName(decrypted) === encrypted
  ) {
    return null
  }

  return decrypted
}

async function encryptWithPostgresRpc(
  plainName: string,
  encryptionKey: string,
): Promise<string | null> {
  const supabase = createServiceRoleClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.rpc("encrypt_student_name", {
    plain_name: plainName,
    secret_key: encryptionKey,
  })

  if (error) {
    if (
      error.message.includes("encrypt_student_name") ||
      error.code === "PGRST202"
    ) {
      console.warn(
        "[studentNameCrypto] encrypt_student_name RPC is missing. Run docs/sql/create-encrypt-student-name-function.sql in Supabase.",
      )
    } else {
      console.error("[studentNameCrypto] rpc encrypt failed:", error.message)
    }
    return null
  }

  if (typeof data !== "string") {
    return null
  }

  const encrypted = normalizeStudentName(data)
  if (!encrypted || !looksLikeEncryptedStudentName(encrypted)) {
    return null
  }

  return encrypted
}

/** 平文氏名を DB 保存用に暗号化（既に暗号化済みならそのまま返す） */
export async function encryptStudentNameForStorage(
  value: string | null | undefined,
): Promise<string | null> {
  if (value === null || value === undefined) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return trimmed
  }

  const normalized = normalizeStudentName(trimmed)
  if (looksLikeEncryptedStudentName(normalized)) {
    return normalized
  }

  const encryptionKey = getPrimaryEncryptionKey()
  if (!encryptionKey) {
    console.error(
      "[studentNameCrypto] STUDENT_NAME_ENCRYPTION_KEY is not set. Cannot encrypt student name for storage.",
    )
    return null
  }

  return encryptWithPostgresRpc(trimmed, encryptionKey)
}

/**
 * 管理画面の登録・更新用: 入力値を一度平文化してから暗号化する。
 * 編集フォームに暗号文が残っていても二重暗号化しない。
 */
export async function prepareStudentNameForStorage(
  value: string | null | undefined,
): Promise<string | null> {
  if (value === null || value === undefined) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return trimmed
  }

  const plaintext = (await decryptStudentName(trimmed)) ?? trimmed
  const normalizedPlain = normalizeStudentName(plaintext)

  if (looksLikeEncryptedStudentName(normalizedPlain)) {
    console.error(
      "[studentNameCrypto] Could not normalize student name to plaintext before encryption.",
    )
    return null
  }

  return encryptStudentNameForStorage(plaintext)
}

export async function decryptStudentName(
  value: string | null | undefined,
): Promise<string | null> {
  if (value === null || value === undefined) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return trimmed
  }

  const normalized = normalizeStudentName(trimmed)

  // 平文（日本語氏名・非 base64）はそのまま返す
  if (!looksLikeEncryptedStudentName(normalized)) {
    return trimmed
  }

  const encryptionKeys = getEncryptionKeys()
  if (encryptionKeys.length === 0) {
    console.warn(
      "[studentNameCrypto] STUDENT_NAME_ENCRYPTION_KEY is not set. Encrypted student names cannot be decrypted.",
    )
    return trimmed
  }

  // 二重暗号化など、復号結果がまだ暗号文の場合は最大5回まで再試行
  let candidate = normalized
  for (let depth = 0; depth < 5; depth++) {
    if (!looksLikeEncryptedStudentName(candidate)) {
      return candidate
    }

    let decrypted: string | null = null
    for (const encryptionKey of encryptionKeys) {
      decrypted = await decryptWithPostgresRpc(candidate, encryptionKey)
      if (decrypted) {
        break
      }
    }

    if (!decrypted) {
      break
    }

    candidate = normalizeStudentName(decrypted)
  }

  if (!looksLikeEncryptedStudentName(candidate)) {
    return candidate
  }

  console.error(
    "[studentNameCrypto] Failed to decrypt student name. Check STUDENT_NAME_ENCRYPTION_KEY and decrypt_student_name RPC.",
  )
  return trimmed
}

export async function decryptStudentRows<T extends { name: string | null }>(
  rows: T[],
): Promise<T[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      name: row.name === null ? null : await decryptStudentName(row.name),
    })),
  )
}

export async function mapScoresWithDecryptedStudentNames<
  T extends { students?: { name?: string | null } | null },
>(scores: T[]): Promise<(T & { student_name: string })[]> {
  return Promise.all(
    scores.map(async (score) => {
      const rawName = score.students?.name
      if (!rawName) {
        return { ...score, student_name: "不明" }
      }
      const decrypted = await decryptStudentName(rawName)
      return {
        ...score,
        student_name: decrypted ?? rawName,
      }
    }),
  )
}
