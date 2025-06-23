-- 既存のstudentsテーブルを削除（存在する場合）
DROP TABLE IF EXISTS students CASCADE;

-- 新しいstudentsテーブルを作成
CREATE TABLE students (
  id INTEGER PRIMARY KEY CHECK (id >= 1000000 AND id <= 9999999), -- 7桁の半角数字
  student_id VARCHAR(20) UNIQUE NOT NULL CHECK (student_id ~ '^[A-Z0-9]+$'), -- 大文字英語と半角数字
  password VARCHAR(20) NOT NULL, -- 一時的に制約を外す
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスを作成
CREATE INDEX idx_students_student_id ON students(student_id);

-- RLSポリシーを設定
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーは全てのデータにアクセス可能
CREATE POLICY authenticated_all_access ON students
  FOR ALL
  TO authenticated
  USING (true);

-- 匿名ユーザーは読み取りのみ可能
CREATE POLICY anon_read_access ON students
  FOR SELECT
  TO anon
  USING (true);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータを追加
INSERT INTO students (id, student_id, password, name) VALUES
(1000001, 'STUDENT001', '123456', '山田 太郎'),
(1000002, 'STUDENT002', '234567', '鈴木 花子'),
(1000003, 'STUDENT003', '345678', '佐藤 次郎');

-- インポート後に実行するSQL（コメントアウト）
/*
-- パスワードの制約を追加
ALTER TABLE students
ADD CONSTRAINT students_password_check
CHECK (password ~ '^[0-9]{6,20}$');
*/ 