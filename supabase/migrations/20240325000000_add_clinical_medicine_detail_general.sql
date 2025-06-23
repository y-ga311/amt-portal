-- Add clinical_medicine_detail_general column to test_scores table
ALTER TABLE test_scores
ADD COLUMN clinical_medicine_detail_general INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN test_scores.clinical_medicine_detail_general IS '臨床医学各論（総合）の点数'; 