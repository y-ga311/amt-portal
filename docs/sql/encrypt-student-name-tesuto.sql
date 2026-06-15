-- students.name のうち平文「てすと」のみを pgp_sym_encrypt + base64 で暗号化する
-- 実行前: secret_key を STUDENT_NAME_ENCRYPTION_KEY（アプリ・Vercel と同じ値）に置き換えること
-- 前提: decrypt_student_name RPC が作成済み（docs/sql/create-decrypt-student-name-function.sql）

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ★ 実行前に secret_key を置き換え
-- \set secret_key 'your-actual-key'  -- psql の場合
-- Supabase SQL Editor では下記2箇所のプレースホルダーを手動で同じ値に置換

-- 対象行の確認（実行前）
SELECT id, gakusei_id, name, class
FROM public.students
WHERE btrim(name) = 'てすと';

-- 暗号化 + 復号確認（更新した行だけを検証。全行に decrypt をかけない）
WITH targets AS (
  SELECT id
  FROM public.students
  WHERE btrim(name) = 'てすと'
),
updated AS (
  UPDATE public.students AS s
  SET
    name = encode(
      pgp_sym_encrypt(btrim(s.name), 'ここに暗号化キーを設定'),
      'base64'
    ),
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

-- 既に暗号化済みで再実行した場合の確認用（平文 WHERE は一致しないため別クエリ）
-- SELECT id, gakusei_id, name,
--   public.decrypt_student_name(name, 'ここに暗号化キーを設定') AS decrypted_name
-- FROM public.students
-- WHERE public.decrypt_student_name(name, 'ここに暗号化キーを設定') = 'てすと';
