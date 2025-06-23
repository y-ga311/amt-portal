-- Drop existing policy
DROP POLICY IF EXISTS "学生は自分のデータのみアクセス可能" ON test_scores;

-- Drop foreign key constraint
ALTER TABLE test_scores
DROP CONSTRAINT IF EXISTS test_scores_student_id_fkey;

-- Update student_id column type in test_scores table
ALTER TABLE test_scores
ALTER COLUMN student_id TYPE VARCHAR(255);

-- Add comment to explain the change
COMMENT ON COLUMN test_scores.student_id IS '学生ID (S + 5桁の数字)';

-- Recreate foreign key constraint
ALTER TABLE test_scores
ADD CONSTRAINT test_scores_student_id_fkey
FOREIGN KEY (student_id)
REFERENCES students(id)
ON DELETE CASCADE;

-- Recreate the policy with the new column type
CREATE POLICY "学生は自分のデータのみアクセス可能" ON test_scores
FOR ALL
USING (student_id = current_user)
WITH CHECK (student_id = current_user); 