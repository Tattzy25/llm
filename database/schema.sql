-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hashed_key TEXT NOT NULL UNIQUE,
  masked_key TEXT NOT NULL,
  last_used TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NULL,
  permissions TEXT[] DEFAULT '{}',
  rate_limit INTEGER DEFAULT 1000,
  CONSTRAINT api_keys_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- Environment Variables table
CREATE TABLE environment_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, key),
  CONSTRAINT env_var_key_format CHECK (key ~ '^[A-Z_][A-Z0-9_]*$'),
  CONSTRAINT env_var_key_length CHECK (char_length(key) >= 1 AND char_length(key) <= 100)
);

-- Custom Characters table
CREATE TABLE custom_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personality TEXT NOT NULL,
  avatar_url TEXT NULL,
  system_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT character_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT character_personality_length CHECK (char_length(personality) >= 10),
  CONSTRAINT character_system_prompt_length CHECK (char_length(system_prompt) >= 10)
);

-- Custom Models table
CREATE TABLE custom_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT model_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT model_provider_valid CHECK (provider IN ('openai', 'anthropic', 'google', 'custom', 'digitalhustlelab')),
  CONSTRAINT model_endpoint_format CHECK (api_endpoint ~ '^https?://')
);

-- Row Level Security Policies

-- API Keys policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Environment Variables policies
ALTER TABLE environment_variables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own environment variables" ON environment_variables
  FOR ALL USING (auth.uid() = user_id);

-- Custom Characters policies
ALTER TABLE custom_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own characters" ON custom_characters
  FOR ALL USING (auth.uid() = user_id);

-- Custom Models policies
ALTER TABLE custom_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own models" ON custom_models
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_environment_variables_updated_at
  BEFORE UPDATE ON environment_variables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_hashed_key ON api_keys(hashed_key);
CREATE INDEX idx_env_vars_user_id ON environment_variables(user_id);
CREATE INDEX idx_env_vars_key ON environment_variables(user_id, key);
CREATE INDEX idx_characters_user_id ON custom_characters(user_id);
CREATE INDEX idx_characters_active ON custom_characters(user_id, is_active);
CREATE INDEX idx_models_user_id ON custom_models(user_id);
CREATE INDEX idx_models_active ON custom_models(user_id, is_active);

-- Comments for documentation
COMMENT ON TABLE api_keys IS 'User-generated API keys for external service authentication';
COMMENT ON TABLE environment_variables IS 'User environment variables for configuration';
COMMENT ON TABLE custom_characters IS 'User-defined AI characters with personalities and prompts';
COMMENT ON TABLE custom_models IS 'User-defined custom AI models and endpoints';

COMMENT ON COLUMN api_keys.hashed_key IS 'SHA-256 hashed version of the actual API key';
COMMENT ON COLUMN api_keys.masked_key IS 'Display version showing only first 8 and last 4 characters';
COMMENT ON COLUMN environment_variables.is_sensitive IS 'Whether the value should be encrypted/masked in UI';
COMMENT ON COLUMN custom_characters.system_prompt IS 'AI system prompt defining character behavior';
COMMENT ON COLUMN custom_models.settings IS 'JSON configuration for model parameters (temperature, max_tokens, etc.)';
