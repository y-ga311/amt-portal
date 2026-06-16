-- 「テスト」「てすと」の平文氏名のみを pgp_sym_encrypt + base64 で暗号化する
-- 実行前: secret_key を STUDENT_NAME_ENCRYPTION_KEY（アプリ・Vercel と同じ値）に置換
-- 前提:
--   docs/sql/create-decrypt-student-name-function.sql
--   docs/sql/create-encrypt-student-name-function.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) 対象行の確認（平文のみ。既に暗号化済みの行は表示されない）
SELECT id, gakusei_id, name, class
FROM public.students
WHERE btrim(name) IN ('テスト', 'てすと')
  AND name ~ '[ぁ-んァ-ン一-龥]';

-- 2) 暗号化（平文の「テスト」「てすと」のみ）
WITH targets AS (
  SELECT id
  FROM public.students
  WHERE btrim(name) IN ('テスト', 'てすと')
    AND name ~ '[ぁ-んァ-ン一-龥]'
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
  u.id,
  u.gakusei_id,
  u.name AS encrypted_name,
  public.decrypt_student_name(u.name, 'ここに暗号化キーを設定') AS decrypted_name
FROM updated AS u;

-- 3) 暗号化後の確認（復号結果でフィルタ）
SELECT
  id,
  gakusei_id,
  left(name, 40) AS encrypted_name,
  public.decrypt_student_name(name, 'ここに暗号化キーを設定') AS decrypted_name
FROM public.students
WHERE public.decrypt_student_name(name, 'ここに暗号化キーを設定') IN ('テスト', 'てすと');
