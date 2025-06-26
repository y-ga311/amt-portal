-- Update students class based on gakusei_id conditions
-- gakusei_idの条件に基づいてstudentsテーブルのclassを修正

-- 1. 各条件に基づいてclassを修正
-- gakusei_idが254から始まるもの→classを24期生昼間部に修正
UPDATE students
SET class = '24期生昼間部'
WHERE gakusei_id LIKE '254%';

-- gakusei_idが255から始まるもの→classを24期生夜間部に修正
UPDATE students
SET class = '24期生夜間部'
WHERE gakusei_id LIKE '255%';

-- gakusei_idが244から始まるもの→classを23期生昼間部に修正
UPDATE students
SET class = '23期生昼間部'
WHERE gakusei_id LIKE '244%';

-- gakusei_idが245から始まるもの→classを23期生夜間部に修正
UPDATE students
SET class = '23期生夜間部'
WHERE gakusei_id LIKE '245%';

-- gakusei_idが234から始まるもの→classを22期生昼間部に修正
UPDATE students
SET class = '22期生昼間部'
WHERE gakusei_id LIKE '234%';

-- gakusei_idが235から始まるもの→classを22期生夜間部に修正
UPDATE students
SET class = '22期生夜間部'
WHERE gakusei_id LIKE '235%';

-- 2. 修正前の確認クエリ（実行前に確認用）
-- SELECT gakusei_id, name, class FROM students 
-- WHERE gakusei_id LIKE '254%' OR gakusei_id LIKE '255%' 
--    OR gakusei_id LIKE '244%' OR gakusei_id LIKE '245%'
--    OR gakusei_id LIKE '234%' OR gakusei_id LIKE '235%'
-- ORDER BY gakusei_id;

-- 3. 修正後の確認クエリ（実行後に確認用）
SELECT 
  gakusei_id, 
  name, 
  class,
  CASE 
    WHEN gakusei_id LIKE '254%' THEN '24期生昼間部'
    WHEN gakusei_id LIKE '255%' THEN '24期生夜間部'
    WHEN gakusei_id LIKE '244%' THEN '23期生昼間部'
    WHEN gakusei_id LIKE '245%' THEN '23期生夜間部'
    WHEN gakusei_id LIKE '234%' THEN '22期生昼間部'
    WHEN gakusei_id LIKE '235%' THEN '22期生夜間部'
    ELSE 'その他'
  END as expected_class,
  CASE 
    WHEN class = CASE 
      WHEN gakusei_id LIKE '254%' THEN '24期生昼間部'
      WHEN gakusei_id LIKE '255%' THEN '24期生夜間部'
      WHEN gakusei_id LIKE '244%' THEN '23期生昼間部'
      WHEN gakusei_id LIKE '245%' THEN '23期生夜間部'
      WHEN gakusei_id LIKE '234%' THEN '22期生昼間部'
      WHEN gakusei_id LIKE '235%' THEN '22期生夜間部'
      ELSE 'その他'
    END THEN 'OK'
    ELSE 'NG'
  END as status
FROM students 
WHERE gakusei_id LIKE '254%' OR gakusei_id LIKE '255%' 
   OR gakusei_id LIKE '244%' OR gakusei_id LIKE '245%'
   OR gakusei_id LIKE '234%' OR gakusei_id LIKE '235%'
ORDER BY gakusei_id;

-- 4. 修正件数の確認（条件別）
SELECT 
  '254% (24期生昼間部)' as condition,
  COUNT(*) as count
FROM students 
WHERE gakusei_id LIKE '254%'
UNION ALL
SELECT 
  '255% (24期生夜間部)' as condition,
  COUNT(*) as count
FROM students 
WHERE gakusei_id LIKE '255%'
UNION ALL
SELECT 
  '244% (23期生昼間部)' as condition,
  COUNT(*) as count
FROM students 
WHERE gakusei_id LIKE '244%'
UNION ALL
SELECT 
  '245% (23期生夜間部)' as condition,
  COUNT(*) as count
FROM students 
WHERE gakusei_id LIKE '245%'
UNION ALL
SELECT 
  '234% (22期生昼間部)' as condition,
  COUNT(*) as count
FROM students 
WHERE gakusei_id LIKE '234%'
UNION ALL
SELECT 
  '235% (22期生夜間部)' as condition,
  COUNT(*) as count
FROM students 
WHERE gakusei_id LIKE '235%';

-- 5. 総修正件数の確認
SELECT 
  COUNT(*) as total_updated_count,
  'Total students updated' as description
FROM students 
WHERE gakusei_id LIKE '254%' OR gakusei_id LIKE '255%' 
   OR gakusei_id LIKE '244%' OR gakusei_id LIKE '245%'
   OR gakusei_id LIKE '234%' OR gakusei_id LIKE '235%';

-- 6. 注意事項
-- - このSQLを実行する前に、必ずバックアップを取得してください
-- - 修正前の確認クエリを実行して、対象データを確認してからUPDATEを実行してください
-- - 必要に応じて、WHERE条件を調整してください
-- - 各UPDATE文は独立して実行されるため、順序は重要ではありません 