-- Update sample data in create_question_counts_table.sql to new test names
-- サンプルデータの試験名を新しい命名規則に更新

-- 既存のサンプルデータを削除
DELETE FROM question_counts WHERE test_name IN (
  '第1回模擬試験',
  '第2回模擬試験'
);

-- 新しい命名規則でサンプルデータを追加
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
-- 第1回模擬試験(22期生3年次)
(
  '第1回模擬試験(22期生3年次)',
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
-- 第2回模擬試験(22期生3年次)
(
  '第2回模擬試験(22期生3年次)',
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

-- 更新結果の確認
SELECT 
  test_name,
  test_date,
  COUNT(*) as record_count
FROM question_counts 
WHERE test_name LIKE '%22期生%' OR test_name LIKE '%23期生%' OR test_name LIKE '%24期生%'
GROUP BY test_name, test_date
ORDER BY test_name; 