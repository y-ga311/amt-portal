-- Update students table class column to new naming convention
-- 既存のクラス名を新しい命名規則に変更

UPDATE students
SET class = CASE
  WHEN class = '昼1' THEN '24期生昼間部'
  WHEN class = '夜1' THEN '24期生夜間部'
  WHEN class = '昼2' THEN '23期生昼間部'
  WHEN class = '夜2' THEN '23期生夜間部'
  WHEN class = '昼3' THEN '22期生昼間部'
  WHEN class = '夜3' THEN '22期生夜間部'
  ELSE class  -- その他の値は変更しない
END;

-- 更新結果の確認用クエリ
SELECT 
  class,
  COUNT(*) as student_count
FROM students 
GROUP BY class 
ORDER BY class;

-- コメントの更新
COMMENT ON COLUMN students.class IS '学生のクラス分類（22期生昼間部/22期生夜間部/23期生昼間部/23期生夜間部/24期生昼間部/24期生夜間部/その他）'; 