-- Add new columns for student authentication
ALTER TABLE students
ADD COLUMN gakusei_id VARCHAR(255),
ADD COLUMN gakusei_password VARCHAR(255);

-- Add comments to explain the columns
COMMENT ON COLUMN students.gakusei_id IS '学生ID';
COMMENT ON COLUMN students.gakusei_password IS '学生パスワード';

-- Copy existing hogosya_id and hogosya_pass data to new columns
UPDATE students
SET gakusei_id = hogosya_id,
    gakusei_password = hogosya_pass; 