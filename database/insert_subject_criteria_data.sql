-- 既存のデータを削除
DELETE FROM subject_criteria;

-- 1回目から10回目の試験の基準値を挿入
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
  '第' || generate_series || '回模擬試験',
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
  SELECT * FROM question_counts WHERE test_name = '第1回模擬試験'
) qc;

-- 不合格基準も同様に挿入
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
  '第' || generate_series || '回模擬試験',
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
  SELECT * FROM question_counts WHERE test_name = '第1回模擬試験'
) qc; 