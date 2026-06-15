import { createServiceRoleClient } from "@/lib/supabase/serviceRole"

function getEncryptionKey() {
  return process.env.STUDENT_NAME_ENCRYPTION_KEY?.trim() ?? ""
}

/** Supabase 表示などで base64 暗号文に改行が混ざることがある */
function normalizeEncryptedStudentName(value: string) {
  return value.trim().replace(/\s+/g, "")
}

/** 平文の日本語氏名かどうか（base64 暗号文は除外） */
function looksLikePlainStudentName(value: string) {
  if (/^[A-Za-z0-9+/]+=*$/.test(value)) {
    return false
  }
  return /[\u3040-\u30ff\u4e00-\u9fafA-Za-z]/.test(value) && value.length <= 40
}

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

/** PostgreSQL pgp_sym_encrypt + base64 で保存された氏名かどうか */
export function looksLikeEncryptedStudentName(value: string) {
  const trimmed = normalizeEncryptedStudentName(value)

  // 短い平文（てすと等）はここで除外。base64 は長さに関係なく先に判定
  if (isBase64Ciphertext(trimmed)) {
    return true
  }

  if (trimmed.length < 20) {
    return false
  }

  if (looksLikePlainStudentName(trimmed)) {
    return false
  }

  return /^[\x21-\x7e]+$/.test(trimmed)
}

async function decryptWithPostgresRpc(
  encrypted: string,
  encryptionKey: string,
  original: string,
): Promise<string | null> {
  const supabase = createServiceRoleClient()
  if (!supabase) {
    return null
  }

  const candidates = [encrypted]
  if (original !== encrypted) {
    candidates.push(original)
  }

  for (const candidate of candidates) {
    const { data, error } = await supabase.rpc("decrypt_student_name", {
      encrypted_name: candidate,
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
      continue
    }

    if (typeof data !== "string") {
      continue
    }

    const decrypted = data.trim()
    if (!decrypted) {
      continue
    }

    const normalizedCandidate = normalizeEncryptedStudentName(candidate)
    if (
      decrypted === candidate ||
      decrypted === normalizedCandidate ||
      decrypted === original
    ) {
      continue
    }

    return decrypted
  }

  return null
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

  const encrypted = normalizeEncryptedStudentName(trimmed)
  const shouldTryDecrypt =
    isBase64Ciphertext(encrypted) || looksLikeEncryptedStudentName(encrypted)

  if (!shouldTryDecrypt) {
    return trimmed
  }

  const encryptionKey = getEncryptionKey()
  if (!encryptionKey) {
    console.warn(
      "[studentNameCrypto] STUDENT_NAME_ENCRYPTION_KEY is not set. Encrypted student names cannot be decrypted.",
    )
    return trimmed
  }

  const pgDecrypted = await decryptWithPostgresRpc(
    encrypted,
    encryptionKey,
    trimmed,
  )
  if (pgDecrypted) {
    return pgDecrypted
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
      const decrypted = rawName ? await decryptStudentName(rawName) : null
      return {
        ...score,
        student_name: decrypted || "不明",
      }
    }),
  )
}
