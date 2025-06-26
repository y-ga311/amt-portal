-- Update subject_criteria_data.sql reference to new test names
-- 基準値データの参照を新しい試験名に更新

-- 既存の基準値データを削除
DELETE FROM subject_criteria WHERE test_name LIKE '第%回模擬試験%';

-- 22期生3年次（1回目から10回目）の基準値を挿入
INSERT INTO subject_criteria (
  test_name,
  criteria_type,
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
  '第' || generate_series || '回模擬試験(22期生3年次)',
  'passing',
  CASE WHEN qc.medical_overview IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.public_health IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.related_laws IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.anatomy IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.physiology IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.pathology IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.clinical_medicine_overview IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.clinical_medicine_detail IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.clinical_medicine_detail_total IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.rehabilitation IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.oriental_medicine_overview IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.meridian_points IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.oriental_medicine_clinical IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.oriental_medicine_clinical_general IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.acupuncture_theory IS NOT NULL THEN 60 ELSE NULL END,
  CASE WHEN qc.moxibustion_theory IS NOT NULL THEN 60 ELSE NULL END
FROM generate_series(1, 10)
CROSS JOIN (
  SELECT * FROM question_counts WHERE test_name = '第1回模擬試験(22期生3年次)'
) qc;

-- 22期生3年次（1回目から10回目）の不合格基準も挿入
INSERT INTO subject_criteria (
  test_name,
  criteria_type,
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
  '第' || generate_series || '回模擬試験(22期生3年次)',
  'failing',
  CASE WHEN qc.medical_overview IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.public_health IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.related_laws IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.anatomy IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.physiology IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.pathology IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.clinical_medicine_overview IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.clinical_medicine_detail IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.clinical_medicine_detail_total IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.rehabilitation IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.oriental_medicine_overview IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.meridian_points IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.oriental_medicine_clinical IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.oriental_medicine_clinical_general IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.acupuncture_theory IS NOT NULL THEN 40 ELSE NULL END,
  CASE WHEN qc.moxibustion_theory IS NOT NULL THEN 40 ELSE NULL END
FROM generate_series(1, 10)
CROSS JOIN (
  SELECT * FROM question_counts WHERE test_name = '第1回模擬試験(22期生3年次)'
) qc;

-- 更新結果の確認
SELECT 
  test_name,
  criteria_type,
  COUNT(*) as record_count
FROM subject_criteria 
WHERE test_name LIKE '%22期生%' OR test_name LIKE '%23期生%' OR test_name LIKE '%24期生%'
GROUP BY test_name, criteria_type
ORDER BY test_name, criteria_type; 