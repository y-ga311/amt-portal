-- question_countsテーブルを再作成（シーケンス問題を解決）

-- 既存のデータをバックアップ
CREATE TABLE question_counts_backup AS 
SELECT * FROM question_counts;

-- 既存のテーブルを削除（関連する制約も削除される）
DROP TABLE question_counts CASCADE;

-- 新しいテーブルを作成
CREATE TABLE question_counts (
  id SERIAL PRIMARY KEY,
  test_name TEXT NOT NULL UNIQUE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- 基礎医学系
  medical_overview INTEGER, -- 医療概論
  public_health INTEGER, -- 衛生・公衆衛生学
  related_laws INTEGER, -- 関係法規
  anatomy INTEGER, -- 解剖学
  physiology INTEGER, -- 生理学
  pathology INTEGER, -- 病理学
  
  -- 臨床医学系
  clinical_medicine_overview INTEGER, -- 臨床医学総論
  clinical_medicine_detail INTEGER, -- 臨床医学各論
  clinical_medicine_detail_total INTEGER, -- 臨床医学各論（総合）
  rehabilitation INTEGER, -- リハビリテーション医学
  
  -- 東洋医学系
  oriental_medicine_overview INTEGER, -- 東洋医学概論
  meridian_points INTEGER, -- 経絡経穴概論
  oriental_medicine_clinical INTEGER, -- 東洋医学臨床論
  oriental_medicine_clinical_general INTEGER, -- 東洋医学臨床論（総合）
  
  -- 専門系
  acupuncture_theory INTEGER, -- はり理論
  moxibustion_theory INTEGER, -- きゅう理論
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスを作成
CREATE INDEX idx_question_counts_test_name ON question_counts(test_name);
CREATE INDEX idx_question_counts_test_date ON question_counts(test_date);

-- RLSポリシーを設定
ALTER TABLE question_counts ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーは全てのデータにアクセス可能
CREATE POLICY authenticated_all_access ON question_counts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 匿名ユーザーは読み取りのみ可能
CREATE POLICY anon_read_access ON question_counts
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

CREATE TRIGGER update_question_counts_updated_at
BEFORE UPDATE ON question_counts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- バックアップからデータを復元（IDは自動生成される）
INSERT INTO question_counts (
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
FROM question_counts_backup;

-- 復元結果を確認
SELECT 
  '復元結果' as info,
  COUNT(*) as record_count,
  MIN(id) as min_id,
  MAX(id) as max_id
FROM question_counts;

-- バックアップテーブルを削除（確認後）
-- DROP TABLE question_counts_backup; 