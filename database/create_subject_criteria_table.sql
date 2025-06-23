-- 既存のsubject_criteriaテーブルを削除（存在する場合）
DROP TABLE IF EXISTS subject_criteria;

-- 新しいsubject_criteriaテーブルを作成
CREATE TABLE subject_criteria (
  id SERIAL PRIMARY KEY,
  test_name TEXT NOT NULL,
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('passing', 'failing')),
  
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
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスを作成
CREATE INDEX idx_subject_criteria_test_name ON subject_criteria(test_name);
CREATE INDEX idx_subject_criteria_criteria_type ON subject_criteria(criteria_type);

-- RLSポリシーを設定
ALTER TABLE subject_criteria ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーは全てのデータにアクセス可能
CREATE POLICY authenticated_all_access ON subject_criteria
  FOR ALL
  TO authenticated
  USING (true);

-- 匿名ユーザーは読み取りのみ可能
CREATE POLICY anon_read_access ON subject_criteria
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

CREATE TRIGGER update_subject_criteria_updated_at
BEFORE UPDATE ON subject_criteria
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 