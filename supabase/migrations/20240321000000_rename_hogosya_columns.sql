-- Rename columns for parent authentication
ALTER TABLE students
RENAME COLUMN student_id TO hogosya_id;

ALTER TABLE students
RENAME COLUMN password TO hogosya_pass;

-- Add comment to explain the change
COMMENT ON COLUMN students.hogosya_id IS '保護者ID';
COMMENT ON COLUMN students.hogosya_pass IS '保護者パスワード'; 