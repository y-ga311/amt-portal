-- Update class names in students and notice tables
-- 学生とお知らせテーブルのクラス名を新しい命名規則に更新

-- 1. Update students table class column
UPDATE students
SET class = CASE
  WHEN class = '昼1' THEN '24期生昼間部'
  WHEN class = '夜1' THEN '24期生夜間部'
  WHEN class = '昼2' THEN '23期生昼間部'
  WHEN class = '夜2' THEN '23期生夜間部'
  WHEN class = '昼3' THEN '22期生昼間部'
  WHEN class = '夜3' THEN '22期生夜間部'
  ELSE class
END;

-- 2. Update notice table constraints
ALTER TABLE notice DROP CONSTRAINT IF EXISTS notice_target_class_check;

ALTER TABLE notice ADD CONSTRAINT notice_target_class_check 
CHECK (target_class IN ('22期生昼間部', '22期生夜間部', '23期生昼間部', '23期生夜間部', '24期生昼間部', '24期生夜間部', 'all'));

-- 3. Update notice table data
UPDATE notice
SET target_class = CASE
  WHEN target_class = '昼1' THEN '24期生昼間部'
  WHEN target_class = '夜1' THEN '24期生夜間部'
  WHEN target_class = '昼2' THEN '23期生昼間部'
  WHEN target_class = '夜2' THEN '23期生夜間部'
  WHEN target_class = '昼3' THEN '22期生昼間部'
  WHEN target_class = '夜3' THEN '22期生夜間部'
  ELSE target_class
END;

-- 4. Update column comments
COMMENT ON COLUMN students.class IS '学生のクラス分類（22期生昼間部/22期生夜間部/23期生昼間部/23期生夜間部/24期生昼間部/24期生夜間部/その他）';
COMMENT ON COLUMN notice.target_class IS '対象クラス（22期生昼間部/22期生夜間部/23期生昼間部/23期生夜間部/24期生昼間部/24期生夜間部, all: 全クラス）'; 