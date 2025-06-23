-- メール送信履歴テーブルの作成
CREATE TABLE mail_send_history (
    id SERIAL PRIMARY KEY,
    notice_id INTEGER REFERENCES notices(id),
    student_id INTEGER REFERENCES students(id),
    status VARCHAR(20) NOT NULL,  -- 'pending', 'sent', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_mail_send_history_notice_id ON mail_send_history(notice_id);
CREATE INDEX idx_mail_send_history_student_id ON mail_send_history(student_id);
CREATE INDEX idx_mail_send_history_status ON mail_send_history(status);

-- トリガー関数の作成
CREATE OR REPLACE FUNCTION handle_notice_update()
RETURNS TRIGGER AS $$
BEGIN
    -- target_typeが'all'または'parent'の場合のみ処理
    IF NEW.target_type IN ('all', 'parent') THEN
        -- 対象クラスの学生を取得
        FOR student IN 
            SELECT id FROM students 
            WHERE class = NEW.target_class 
            AND mail IS NOT NULL
        LOOP
            -- メール送信履歴に記録
            INSERT INTO mail_send_history (
                notice_id,
                student_id,
                status,
                created_at
            ) VALUES (
                NEW.id,
                student.id,
                'pending',
                NOW()
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
CREATE TRIGGER on_notice_update
    AFTER UPDATE ON notices
    FOR EACH ROW
    WHEN (NEW.target_type IN ('all', 'parent'))
    EXECUTE FUNCTION handle_notice_update(); 