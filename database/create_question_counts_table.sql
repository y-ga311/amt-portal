-- 既存のquestion_countsテーブルを削除（存在する場合）
DROP TABLE IF EXISTS question_counts;

-- 新しいquestion_countsテーブルを作成
CREATE TABLE question_counts (
  id SERIAL PRIMARY KEY,
  test_name TEXT NOT NULL,
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
  USING (true);

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

-- サンプルデータを追加
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
  moxibustion_theory
) VALUES 
-- 第1回模擬試験
(
  '第1回模擬試験',
  '2024-05-27',
  3, -- 医療概論
  7, -- 衛生・公衆衛生学
  4, -- 関係法規
  15, -- 解剖学
  15, -- 生理学
  7, -- 病理学
  13, -- 臨床医学総論
  21, -- 臨床医学各論
  4, -- 臨床医学各論（総合）
  5, -- リハビリテーション医学
  20, -- 東洋医学概論
  30, -- 経絡経穴概論
  20, -- 東洋医学臨床論
  10, -- 東洋医学臨床論（総合）
  10, -- はり理論
  10  -- きゅう理論
),
-- 第2回模擬試験
(
  '第2回模擬試験',
  '2024-07-15',
  3, -- 医療概論
  7, -- 衛生・公衆衛生学
  4, -- 関係法規
  15, -- 解剖学
  15, -- 生理学
  7, -- 病理学
  13, -- 臨床医学総論
  21, -- 臨床医学各論
  4, -- 臨床医学各論（総合）
  5, -- リハビリテーション医学
  20, -- 東洋医学概論
  30, -- 経絡経穴概論
  20, -- 東洋医学臨床論
  10, -- 東洋医学臨床論（総合）
  10, -- はり理論
  10  -- きゅう理論
); 