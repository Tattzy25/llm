-- Drop all custom tables (CASCADE will remove related constraints/indexes)
DROP TABLE IF EXISTS image_slugs CASCADE;
DROP TABLE IF EXISTS custom_models CASCADE;
DROP TABLE IF EXISTS custom_characters CASCADE;
DROP TABLE IF EXISTS environment_variables CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;

-- Optional: Also drop any custom functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
