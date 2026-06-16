-- 氏名の暗号化状態を確認する（実行前に secret_key を実キーに置換）
-- 2件目が何も返らない場合: 暗号化未実施 / キー不一致 / RPC 未更新 のいずれか

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) 平文 RPC テスト
SELECT
  'テスト' AS input,
  public.decrypt_student_name('テスト', 'ここに暗号化キーを設定') AS output;

-- 2) 全学生の name 状態（平文・暗号文・復号結果を一覧）
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

-- 3) 「てすと」相当の行だけ（復号結果でフィルタ。0件なら暗号化 or キーを確認）
SELECT
  id,
  gakusei_id,
  left(name, 40) AS encrypted_name,
  public.decrypt_student_name(name, 'ここに暗号化キーを設定') AS decrypted_name
FROM public.students
WHERE public.decrypt_student_name(name, 'ここに暗号化キーを設定') = 'てすと';
