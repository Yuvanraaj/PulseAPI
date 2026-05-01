-- 002_add_ssl_checks.sql
-- Add additional SSL tracking columns

ALTER TABLE monitors ADD COLUMN IF NOT EXISTS ssl_check_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE uptime_checks ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'default';

-- Add a function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monitors_updated_at
  BEFORE UPDATE ON monitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_channels_updated_at
  BEFORE UPDATE ON alert_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_status_page_config_updated_at
  BEFORE UPDATE ON status_page_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
