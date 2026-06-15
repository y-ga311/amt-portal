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

/** PostgreSQL pgp_sym_encrypt + base64 で保存された氏名かどうか */
export function looksLikeEncryptedStudentName(value: string) {
  const trimmed = normalizeEncryptedStudentName(value)
  if (trimmed.length < 20) {
    return false
  }

  if (looksLikePlainStudentName(trimmed)) {
    return false
  }

  if (/^[A-Za-z0-9+/]+=*$/.test(trimmed)) {
    try {
      return Buffer.from(trimmed, "base64").length >= 12
    } catch {
      return false
    }
  }

  return /^[\x21-\x7e]+$/.test(trimmed)
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
  if (!decrypted || decrypted === encrypted) {
    return null
  }

  return decrypted
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
  if (!looksLikeEncryptedStudentName(encrypted)) {
    return trimmed
  }

  const encryptionKey = getEncryptionKey()
  if (!encryptionKey) {
    console.warn(
      "[studentNameCrypto] STUDENT_NAME_ENCRYPTION_KEY is not set. Encrypted student names cannot be decrypted.",
    )
    return trimmed
  }

  const pgDecrypted = await decryptWithPostgresRpc(encrypted, encryptionKey)
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
