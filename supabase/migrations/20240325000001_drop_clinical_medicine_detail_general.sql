-- Drop clinical_medicine_detail_general column from test_scores table
ALTER TABLE test_scores
DROP COLUMN IF EXISTS clinical_medicine_detail_general; 