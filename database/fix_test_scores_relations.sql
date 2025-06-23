-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "学生は自分のデータのみアクセス可能" ON test_scores;
DROP POLICY IF EXISTS "管理者は全データにアクセス可能" ON test_scores;
DROP POLICY IF EXISTS "匿名ユーザーはアクセス不可" ON test_scores;

-- studentsテーブルを修正
ALTER TABLE students
ADD COLUMN IF NOT EXISTS student_id TEXT UNIQUE;

-- 既存のデータを更新
UPDATE students
SET student_id = 'S' || LPAD(id::text, 5, '0')
WHERE student_id IS NULL;

-- test_scoresテーブルのstudent_idカラムの型を修正
ALTER TABLE test_scores
DROP CONSTRAINT IF EXISTS test_scores_student_id_fkey;

ALTER TABLE test_scores
ALTER COLUMN student_id TYPE TEXT;

-- studentsテーブルのstudent_idを参照する外部キー制約を追加
ALTER TABLE test_scores
ADD CONSTRAINT test_scores_student_id_fkey
FOREIGN KEY (student_id) REFERENCES students(student_id);

-- test_nameテーブルとの関連付けを追加
ALTER TABLE test_scores
DROP CONSTRAINT IF EXISTS test_scores_test_name_fkey;

ALTER TABLE test_scores
ADD CONSTRAINT test_scores_test_name_fkey
FOREIGN KEY (test_name) REFERENCES question_counts(test_name);

-- インデックスを再作成
DROP INDEX IF EXISTS idx_test_scores_student_id;
CREATE INDEX idx_test_scores_student_id ON test_scores(student_id);

DROP INDEX IF EXISTS idx_test_scores_test_name;
CREATE INDEX idx_test_scores_test_name ON test_scores(test_name);

-- RLSポリシーを再作成
CREATE POLICY "管理者は全データにアクセス可能" ON test_scores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "学生は自分のデータのみアクセス可能" ON test_scores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.student_id = test_scores.student_id
      AND (
        students.student_id = auth.uid()::text
        OR students.student_id = 'S' || LPAD(auth.uid()::text, 5, '0')
      )
    )
  );

CREATE POLICY "匿名ユーザーはアクセス不可" ON test_scores
  FOR ALL
  TO anon
  USING (false); 