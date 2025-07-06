-- studentsテーブルにログイン状況を記録するカラムを追加
ALTER TABLE students
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN login_count INTEGER DEFAULT 0;

-- コメントを追加
COMMENT ON COLUMN students.last_login IS '最新のログイン時間';
COMMENT ON COLUMN students.login_count IS 'ログイン回数';

-- 既存のレコードのlogin_countを0に初期化
UPDATE students SET login_count = 0 WHERE login_count IS NULL; 