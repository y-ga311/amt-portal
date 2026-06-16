-- students.name の平文行をすべて pgp_sym_encrypt + base64 で暗号化する
-- 既に暗号化済みの行は encrypt_student_name がそのまま返すため二重暗号化されない
--
-- 実行前: secret_key を STUDENT_NAME_ENCRYPTION_KEY（アプリ・Vercel と同じ値）に置換
-- 前提:
--   docs/sql/create-decrypt-student-name-function.sql
--   docs/sql/create-encrypt-student-name-function.sql
--
-- 推奨手順:
--   1) 下記「実行前確認」を実行し、対象件数を確認
--   2) バックアップまたはステージングで試す
--   3) UPDATE を実行
--   4) 「実行後確認」で平文残件が 0 であることを確認

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 実行前確認
-- ============================================================

-- 全件数
SELECT count(*) AS total_students FROM public.students;

-- 暗号化が必要な行（encrypt 結果が現在値と異なる = 平文または要再暗号化）
SELECT
  id,
  gakusei_id,
  left(name, 40) AS name_in_db,
  (name ~ '[ぁ-んァ-ン一-龥]') AS looks_japanese_plain
FROM public.students
WHERE name IS NOT NULL
  AND btrim(name) <> ''
  AND public.encrypt_student_name(
        name,
        'ここに暗号化キーを設定'
      ) IS DISTINCT FROM regexp_replace(btrim(name), '\s+', '', 'g')
ORDER BY id;

-- 対象件数
SELECT count(*) AS rows_to_encrypt
FROM public.students
WHERE name IS NOT NULL
  AND btrim(name) <> ''
  AND public.encrypt_student_name(
        name,
        'ここに暗号化キーを設定'
      ) IS DISTINCT FROM regexp_replace(btrim(name), '\s+', '', 'g');

-- ============================================================
-- 暗号化 UPDATE（対象行のみ・冪等）
-- ============================================================

WITH targets AS (
  SELECT id
  FROM public.students
  WHERE name IS NOT NULL
    AND btrim(name) <> ''
    AND public.encrypt_student_name(
          name,
          'ここに暗号化キーを設定'
        ) IS DISTINCT FROM regexp_replace(btrim(name), '\s+', '', 'g')
),
updated AS (
  UPDATE public.students AS s
  SET
    name = public.encrypt_student_name(s.name, 'ここに暗号化キーを設定'),
    updated_at = NOW()
  FROM targets AS t
  WHERE s.id = t.id
  RETURNING s.id, s.gakusei_id, s.name
)
SELECT
  count(*) AS updated_count
FROM updated;

-- ============================================================
-- 実行後確認
-- ============================================================

-- 平文残件（0 件であること）
SELECT count(*) AS remaining_plaintext_rows
FROM public.students
WHERE name IS NOT NULL
  AND btrim(name) <> ''
  AND public.encrypt_student_name(
        name,
        'ここに暗号化キーを設定'
      ) IS DISTINCT FROM regexp_replace(btrim(name), '\s+', '', 'g');

-- 全学生の復号確認（先頭 20 件）
SELECT
  id,
  gakusei_id,
  left(name, 40) AS encrypted_name,
  (name ~ '[ぁ-んァ-ン一-龥]') AS still_plaintext,
  public.decrypt_student_name(name, 'ここに暗号化キーを設定') AS decrypted_name
FROM public.students
ORDER BY id
LIMIT 20;
