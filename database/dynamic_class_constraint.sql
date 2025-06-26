-- Dynamic class constraint management for future periods
-- 将来の期生追加に対応した動的クラス制約管理

-- 1. 期生管理テーブルの作成
CREATE TABLE IF NOT EXISTS period_classes (
  id SERIAL PRIMARY KEY,
  period_name VARCHAR(20) NOT NULL UNIQUE, -- 例: '22期生', '23期生'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 初期データの挿入
INSERT INTO period_classes (period_name) VALUES 
  ('22期生'),
  ('23期生'),
  ('24期生'),
  ('25期生'),
  ('26期生'),
  ('27期生'),
  ('28期生'),
  ('29期生'),
  ('30期生')
ON CONFLICT (period_name) DO NOTHING;

-- 3. 動的にクラス制約を生成する関数
CREATE OR REPLACE FUNCTION generate_class_constraint()
RETURNS TEXT AS $$
DECLARE
  constraint_text TEXT := 'CHECK (target_class IN (''all''';
  period_record RECORD;
BEGIN
  FOR period_record IN SELECT period_name FROM period_classes WHERE is_active = true ORDER BY period_name
  LOOP
    constraint_text := constraint_text || ', ''' || period_record.period_name || '昼間部''';
    constraint_text := constraint_text || ', ''' || period_record.period_name || '夜間部''';
  END LOOP;
  
  constraint_text := constraint_text || '))';
  RETURN constraint_text;
END;
$$ LANGUAGE plpgsql;

-- 4. 制約を動的に更新する関数
CREATE OR REPLACE FUNCTION update_notice_class_constraint()
RETURNS VOID AS $$
DECLARE
  new_constraint TEXT;
BEGIN
  -- 既存の制約を削除
  ALTER TABLE notice DROP CONSTRAINT IF EXISTS notice_target_class_check;
  
  -- 新しい制約を生成
  new_constraint := generate_class_constraint();
  
  -- 新しい制約を追加
  EXECUTE 'ALTER TABLE notice ADD CONSTRAINT notice_target_class_check ' || new_constraint;
  
  RAISE NOTICE 'Notice table constraint updated: %', new_constraint;
END;
$$ LANGUAGE plpgsql;

-- 5. 初期制約の適用
SELECT update_notice_class_constraint();

-- 6. 新しい期生を追加する関数
CREATE OR REPLACE FUNCTION add_new_period(period_name VARCHAR(20))
RETURNS VOID AS $$
BEGIN
  -- 新しい期生を追加
  INSERT INTO period_classes (period_name) VALUES (period_name)
  ON CONFLICT (period_name) DO NOTHING;
  
  -- 制約を更新
  PERFORM update_notice_class_constraint();
  
  RAISE NOTICE 'New period added: %', period_name;
END;
$$ LANGUAGE plpgsql;

-- 使用例：
-- SELECT add_new_period('31期生');
-- SELECT add_new_period('32期生');

-- 現在の制約を確認
SELECT generate_class_constraint() as current_constraint; 