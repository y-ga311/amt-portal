-- 二重暗号化された students.name を修復する（管理画面の保存不具合で発生した場合）
-- 実行前: secret_key を STUDENT_NAME_ENCRYPTION_KEY の実キーに置換
-- 前提: create-decrypt / create-encrypt RPC が最新版であること
--
-- 手順:
--   1) 下記「問題行の確認」で decrypted_name がまだ base64 っぽい行を特定
--   2) UPDATE で平文化 → 再暗号化（1層のみ）
--   3) verify-student-names.sql で確認

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) 復号結果がまだ暗号文っぽい行（二重暗号化の疑い）
SELECT
  id,
  gakusei_id,
  left(name, 40) AS encrypted_name,
  public.decrypt_student_name(name, 'ここに暗号化キーを設定') AS decrypted_once,
  (
    public.decrypt_student_name(name, 'ここに暗号化キーを設定')
    ~ '^[A-Za-z0-9+/]+=*$'
    AND public.decrypt_student_name(name, 'ここに暗号化キーを設定') !~ '[ぁ-んァ-ン一-龥]'
  ) AS looks_still_encrypted
FROM public.students
WHERE name IS NOT NULL
  AND btrim(name) <> ''
ORDER BY id;

-- 2) 二重暗号化行を修復（復号を2回かけて平文化し、1層だけ再暗号化）
WITH targets AS (
  SELECT
    s.id,
    public.decrypt_student_name(
      public.decrypt_student_name(s.name, 'ここに暗号化キーを設定'),
      'ここに暗号化キーを設定'
    ) AS plain_name
  FROM public.students AS s
  WHERE s.name IS NOT NULL
    AND btrim(s.name) <> ''
    AND public.decrypt_student_name(s.name, 'ここに暗号化キーを設定') ~ '^[A-Za-z0-9+/]+=*$'
    AND public.decrypt_student_name(s.name, 'ここに暗号化キーを設定') !~ '[ぁ-んァ-ン一-龥]'
),
updated AS (
  UPDATE public.students AS s
  SET
    name = public.encrypt_student_name(t.plain_name, 'ここに暗号化キーを設定'),
    updated_at = NOW()
  FROM targets AS t
  WHERE s.id = t.id
    AND t.plain_name IS NOT NULL
    AND btrim(t.plain_name) <> ''
    AND t.plain_name ~ '[ぁ-んァ-ン一-龥]'
  RETURNING s.id, s.gakusei_id, s.name
)
SELECT
  u.id,
  u.gakusei_id,
  public.decrypt_student_name(u.name, 'ここに暗号化キーを設定') AS decrypted_name
FROM updated AS u;
