-- Modify notice table to remove date columns
ALTER TABLE notice DROP COLUMN IF EXISTS start_date;
ALTER TABLE notice DROP COLUMN IF EXISTS end_date;

-- Drop date index if exists
DROP INDEX IF EXISTS idx_notice_dates;

-- Update sample data
DELETE FROM notice;
INSERT INTO notice (title, content, target_type, target_class) VALUES
('4月の授業開始について', '4月1日より新学期が開始されます。', 'all', 'all'),
('昼間部実習のスケジュール', '昼間部の実習スケジュールが更新されました。', 'student', '昼1'),
('夜間部実習のスケジュール', '夜間部の実習スケジュールが更新されました。', 'student', '夜1'),
('保護者向け説明会のご案内', '保護者向け説明会を開催します。', 'parent', 'all'); 