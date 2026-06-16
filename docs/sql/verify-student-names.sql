-- 氏名の暗号化状態を確認する（実行前に secret_key を実キーに置換）

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) 平文 RPC テスト
SELECT
  'テスト' AS input,
  public.decrypt_student_name('テスト', 'ここに暗号化キーを設定') AS output;

-- 2) 暗号化が必要な行数（encrypt-all 実行前後の確認用）
SELECT count(*) AS rows_needing_encryption
FROM public.students
WHERE name IS NOT NULL
  AND btrim(name) <> ''
  AND public.encrypt_student_name(
        name,
        'ここに暗号化キーを設定'
      ) IS DISTINCT FROM regexp_replace(btrim(name), '\s+', '', 'g');

-- 3) 全学生の name 状態（平文・暗号文・復号結果を一覧）
SELECT
  id,
  gakusei_id,
  left(name, 40) AS name_in_db,
  length(name) AS name_len,
  (name ~ '^[A-Za-z0-9+/]+=*$') AS looks_base64,
  (name ~ '[ぁ-んァ-ン一-龥]') AS looks_japanese_plain,
  public.decrypt_student_name(name, 'ここに暗号化キーを設定') AS decrypted_name
FROM public.students
ORDER BY id;
