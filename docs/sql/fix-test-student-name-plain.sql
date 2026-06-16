-- 「テスト」氏名を平文に戻す（旧キーで暗号化された行の修復用）
-- 実行前: secret_key を実際に使っていた暗号化キーに置換
-- 本番キー: amt-portal-student-name-key-2026
-- 旧キー: ここに暗号化キーを設定

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) 対象行の確認
SELECT
  id,
  gakusei_id,
  left(name, 40) AS name_in_db,
  public.decrypt_student_name(name, 'amt-portal-student-name-key-2026') AS decrypted_new_key,
  public.decrypt_student_name(name, 'ここに暗号化キーを設定') AS decrypted_legacy_key
FROM public.students
WHERE btrim(name) = 'テスト'
   OR public.decrypt_student_name(name, 'amt-portal-student-name-key-2026') = 'テスト'
   OR public.decrypt_student_name(name, 'ここに暗号化キーを設定') = 'テスト';

-- 2) 平文「テスト」に統一（暗号化済み行のみ更新）
UPDATE public.students AS s
SET
  name = 'テスト',
  updated_at = NOW()
WHERE public.decrypt_student_name(s.name, 'amt-portal-student-name-key-2026') = 'テスト'
   OR public.decrypt_student_name(s.name, 'ここに暗号化キーを設定') = 'テスト';

-- 3) 更新後の確認
SELECT
  id,
  gakusei_id,
  name AS name_in_db,
  public.decrypt_student_name(name, 'amt-portal-student-name-key-2026') AS decrypted_name
FROM public.students
WHERE btrim(name) = 'テスト'
   OR public.decrypt_student_name(name, 'amt-portal-student-name-key-2026') = 'テスト';
