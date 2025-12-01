// Supabase客户端配置
import { createClient } from '@supabase/supabase-js';

// 从环境变量获取Supabase配置
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// 创建Supabase客户端实例
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;

// 以下是在Supabase中创建表的SQL语句示例：
/*
-- 创建AI配置表
CREATE TABLE ai_config (
  id SERIAL PRIMARY KEY,
  model TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
  temperature FLOAT NOT NULL DEFAULT 0.7,
  max_tokens INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建默认配置
INSERT INTO ai_config (model, temperature, max_tokens)
VALUES ('gpt-3.5-turbo', 0.7, 1000)
ON CONFLICT DO NOTHING;

-- 创建用户消息记录表
CREATE TABLE user_messages (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  message TEXT NOT NULL,
  ai_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 为ai_config表创建触发器，自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_ai_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_config_timestamp
BEFORE UPDATE ON ai_config
FOR EACH ROW
EXECUTE FUNCTION update_ai_config_timestamp();
*/