-- Add class column to students table
ALTER TABLE students ADD COLUMN class VARCHAR(10);

-- Update existing records with default class based on gakusei_id
UPDATE students
SET class = CASE
  WHEN SUBSTRING(gakusei_id, 3, 1) = '2' AND SUBSTRING(gakusei_id, 4, 1) = '1' THEN '昼1'
  WHEN SUBSTRING(gakusei_id, 3, 1) = '2' AND SUBSTRING(gakusei_id, 4, 1) = '2' THEN '昼2'
  WHEN SUBSTRING(gakusei_id, 3, 1) = '2' AND SUBSTRING(gakusei_id, 4, 1) = '3' THEN '昼3'
  WHEN SUBSTRING(gakusei_id, 3, 1) = '3' AND SUBSTRING(gakusei_id, 4, 1) = '1' THEN '夜1'
  WHEN SUBSTRING(gakusei_id, 3, 1) = '3' AND SUBSTRING(gakusei_id, 4, 1) = '2' THEN '夜2'
  WHEN SUBSTRING(gakusei_id, 3, 1) = '3' AND SUBSTRING(gakusei_id, 4, 1) = '3' THEN '夜3'
  ELSE 'その他'
END;

-- Make class column NOT NULL after setting default values
ALTER TABLE students ALTER COLUMN class SET NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN students.class IS '学生のクラス分類（昼1/昼2/昼3/夜1/夜2/夜3/その他）'; 