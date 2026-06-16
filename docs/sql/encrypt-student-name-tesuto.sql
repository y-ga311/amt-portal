-- students.name のうち平文「てすと」のみを pgp_sym_encrypt + base64 で暗号化する
-- 実行前: すべての「ここに暗号化キーを設定」を STUDENT_NAME_ENCRYPTION_KEY の実キーに置換
-- 前提: create-decrypt-student-name-function.sql を先に実行

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 対象行の確認（0件なら既に暗号化済み → verify-student-names.sql で確認）
SELECT id, gakusei_id, name, class
FROM public.students
WHERE btrim(name) = 'てすと';

-- 暗号化 + 復号確認（更新した行だけ）
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
