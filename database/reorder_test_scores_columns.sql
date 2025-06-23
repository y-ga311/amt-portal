-- admin_usersテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 一時テーブルを作成して現在のデータをバックアップ
CREATE TEMP TABLE temp_test_scores AS SELECT * FROM test_scores;

-- 既存のtest_scoresテーブルを削除
DROP TABLE IF EXISTS test_scores;

-- studentsテーブルを元の状態に戻す
DROP TABLE IF EXISTS students;
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 新しいユーザーを登録
INSERT INTO students (id, student_id, password, name)
VALUES (5, 'S00000', '000', 'テスト');

-- 既存のstudent_idをstudentsテーブルに挿入
INSERT INTO students (student_id, password, name)
SELECT DISTINCT 'S' || LPAD(student_id::text, 5, '0'), student_id::text, '学生' || student_id::text
FROM temp_test_scores
WHERE student_id IS NOT NULL
ON CONFLICT (student_id) DO NOTHING;

-- question_countsテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS question_counts (
  id SERIAL PRIMARY KEY,
  test_name TEXT UNIQUE NOT NULL,
  medical_overview INTEGER NOT NULL DEFAULT 0,
  public_health INTEGER NOT NULL DEFAULT 0,
  related_laws INTEGER NOT NULL DEFAULT 0,
  anatomy INTEGER NOT NULL DEFAULT 0,
  physiology INTEGER NOT NULL DEFAULT 0,
  pathology INTEGER NOT NULL DEFAULT 0,
  clinical_medicine_overview INTEGER NOT NULL DEFAULT 0,
  clinical_medicine_detail INTEGER NOT NULL DEFAULT 0,
  clinical_medicine_detail_total INTEGER NOT NULL DEFAULT 0,
  rehabilitation INTEGER NOT NULL DEFAULT 0,
  oriental_medicine_overview INTEGER NOT NULL DEFAULT 0,
  meridian_points INTEGER NOT NULL DEFAULT 0,
  oriental_medicine_clinical INTEGER NOT NULL DEFAULT 0,
  oriental_medicine_clinical_general INTEGER NOT NULL DEFAULT 0,
  acupuncture_theory INTEGER NOT NULL DEFAULT 0,
  moxibustion_theory INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- テスト用の問題数データを挿入（既に存在する場合はスキップ）
INSERT INTO question_counts (
  test_name,
  medical_overview,
  public_health,
  related_laws,
  anatomy,
  physiology,
  pathology,
  clinical_medicine_overview,
  clinical_medicine_detail,
  clinical_medicine_detail_total,
  rehabilitation,
  oriental_medicine_overview,
  meridian_points,
  oriental_medicine_clinical,
  oriental_medicine_clinical_general,
  acupuncture_theory,
  moxibustion_theory
)
SELECT 
  '模擬試験',
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10,
  10
WHERE NOT EXISTS (
  SELECT 1 FROM question_counts WHERE test_name = '模擬試験'
);

-- test_scoresテーブルを再作成（元のカラム順序で）
CREATE TABLE test_scores (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  test_name TEXT NOT NULL DEFAULT '模擬試験',
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- 基礎医学系
  medical_overview NUMERIC, -- 医療概論
  public_health NUMERIC, -- 衛生・公衆衛生学
  related_laws NUMERIC, -- 関係法規
  anatomy NUMERIC, -- 解剖学
  physiology NUMERIC, -- 生理学
  pathology NUMERIC, -- 病理学
  
  -- 臨床医学系
  clinical_medicine_overview NUMERIC, -- 臨床医学総論
  clinical_medicine_detail NUMERIC, -- 臨床医学各論
  clinical_medicine_detail_total NUMERIC, -- 臨床医学各論（総合）
  rehabilitation NUMERIC, -- リハビリテーション医学
  
  -- 東洋医学系
  oriental_medicine_overview NUMERIC, -- 東洋医学概論
  meridian_points NUMERIC, -- 経絡経穴概論
  oriental_medicine_clinical NUMERIC, -- 東洋医学臨床論
  oriental_medicine_clinical_general NUMERIC, -- 東洋医学臨床論（総合）
  
  -- 専門系
  acupuncture_theory NUMERIC, -- はり理論
  moxibustion_theory NUMERIC, -- きゅう理論
  
  -- 合計点（自動計算用）
  total_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(medical_overview, 0) +
    COALESCE(public_health, 0) +
    COALESCE(related_laws, 0) +
    COALESCE(anatomy, 0) +
    COALESCE(physiology, 0) +
    COALESCE(pathology, 0) +
    COALESCE(clinical_medicine_overview, 0) +
    COALESCE(clinical_medicine_detail, 0) +
    COALESCE(rehabilitation, 0) +
    COALESCE(oriental_medicine_overview, 0) +
    COALESCE(meridian_points, 0) +
    COALESCE(oriental_medicine_clinical, 0) +
    COALESCE(oriental_medicine_clinical_general, 0) +
    COALESCE(acupuncture_theory, 0) +
    COALESCE(moxibustion_theory, 0)
  ) STORED,
  
  -- 基礎医学系合計
  basic_medicine_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(medical_overview, 0) +
    COALESCE(public_health, 0) +
    COALESCE(related_laws, 0) +
    COALESCE(anatomy, 0) +
    COALESCE(physiology, 0) +
    COALESCE(pathology, 0)
  ) STORED,
  
  -- 臨床医学系合計
  clinical_medicine_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(clinical_medicine_overview, 0) +
    COALESCE(clinical_medicine_detail, 0) +
    COALESCE(rehabilitation, 0)
  ) STORED,
  
  -- 東洋医学系合計
  oriental_medicine_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(oriental_medicine_overview, 0) +
    COALESCE(meridian_points, 0) +
    COALESCE(oriental_medicine_clinical, 0) +
    COALESCE(oriental_medicine_clinical_general, 0)
  ) STORED,
  
  -- 専門系合計
  specialized_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(acupuncture_theory, 0) +
    COALESCE(moxibustion_theory, 0)
  ) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスを作成
CREATE INDEX idx_test_scores_student_id ON test_scores(student_id);
CREATE INDEX idx_test_scores_test_date ON test_scores(test_date);

-- データを復元（シーケンスをリセット）
ALTER SEQUENCE test_scores_id_seq RESTART WITH 1;

-- データを復元（すべてのテスト結果をstudent_id = 5に設定）
INSERT INTO test_scores (
  student_id,
  test_name,
  test_date,
  medical_overview,
  public_health,
  related_laws,
  anatomy,
  physiology,
  pathology,
  clinical_medicine_overview,
  clinical_medicine_detail,
  clinical_medicine_detail_total,
  rehabilitation,
  oriental_medicine_overview,
  meridian_points,
  oriental_medicine_clinical,
  oriental_medicine_clinical_general,
  acupuncture_theory,
  moxibustion_theory,
  created_at,
  updated_at
)
SELECT 
  5,
  t.test_name,
  t.test_date,
  t.medical_overview,
  t.public_health,
  t.related_laws,
  t.anatomy,
  t.physiology,
  t.pathology,
  t.clinical_medicine_overview,
  t.clinical_medicine_detail,
  t.clinical_medicine_detail_total,
  t.rehabilitation,
  t.oriental_medicine_overview,
  t.meridian_points,
  t.oriental_medicine_clinical,
  t.oriental_medicine_clinical_general,
  t.acupuncture_theory,
  t.moxibustion_theory,
  t.created_at,
  t.updated_at
FROM temp_test_scores t;

-- 一時テーブルを削除
DROP TABLE temp_test_scores;

-- RLSを有効化
ALTER TABLE test_scores ENABLE ROW LEVEL SECURITY;

-- 管理者アクセスポリシー
CREATE POLICY "管理者は全データにアクセス可能" ON test_scores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- 学生アクセスポリシー
CREATE POLICY "学生は自分のデータのみアクセス可能" ON test_scores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = test_scores.student_id
      AND (
        students.student_id = auth.uid()::text
        OR students.student_id = 'S' || LPAD(auth.uid()::text, 5, '0')
      )
    )
  );

-- 匿名ユーザーのアクセス制限
CREATE POLICY "匿名ユーザーはアクセス不可" ON test_scores
  FOR ALL
  TO anon
  USING (false);

-- updated_atを自動更新するトリガーを作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_test_scores_updated_at
  BEFORE UPDATE ON test_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 