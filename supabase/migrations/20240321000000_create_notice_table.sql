-- Create notice table
CREATE TABLE notice (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('student', 'parent', 'all')),
    target_class VARCHAR(10) CHECK (target_class IN ('昼1', '昼2', '昼3', '夜1', '夜2', '夜3', 'all')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comment to explain the table
COMMENT ON TABLE notice IS 'お知らせテーブル';

-- Add comments to explain the columns
COMMENT ON COLUMN notice.title IS 'お知らせのタイトル';
COMMENT ON COLUMN notice.content IS 'お知らせの本文';
COMMENT ON COLUMN notice.target_type IS '対象者タイプ（student: 学生のみ, parent: 保護者のみ, all: 全員）';
COMMENT ON COLUMN notice.target_class IS '対象クラス（昼1〜夜3, all: 全クラス）';

-- Create index for efficient querying
CREATE INDEX idx_notice_target ON notice(target_type, target_class);

-- Insert sample data
INSERT INTO notice (title, content, target_type, target_class) VALUES
('4月の授業開始について', '4月1日より新学期が開始されます。', 'all', 'all'),
('昼間部実習のスケジュール', '昼間部の実習スケジュールが更新されました。', 'student', '昼1'),
('夜間部実習のスケジュール', '夜間部の実習スケジュールが更新されました。', 'student', '夜1'),
('保護者向け説明会のご案内', '保護者向け説明会を開催します。', 'parent', 'all'); 