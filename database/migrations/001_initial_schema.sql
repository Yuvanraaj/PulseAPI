-- 001_initial_schema.sql
-- Initial database schema for API Monitoring Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (admin users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitors table (configured endpoint checks)
CREATE TABLE monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  method VARCHAR(10) DEFAULT 'GET',
  interval_seconds INTEGER DEFAULT 60,
  timeout_seconds INTEGER DEFAULT 10,
  expected_status_code INTEGER DEFAULT 200,
  headers JSONB,
  body TEXT,
  validate_ssl BOOLEAN DEFAULT TRUE,
  response_body_match TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  current_status VARCHAR(20) DEFAULT 'unknown',
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_monitors_active ON monitors(is_active);
CREATE INDEX idx_monitors_status ON monitors(current_status);

-- Uptime checks table (individual check results)
CREATE TABLE uptime_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status_code INTEGER,
  response_time_ms INTEGER,
  is_up BOOLEAN,
  error_message TEXT,
  ssl_expiry_days INTEGER,
  ssl_valid BOOLEAN,
  response_headers JSONB,
  response_body_sample TEXT
);

CREATE INDEX idx_uptime_checks_monitor ON uptime_checks(monitor_id);
CREATE INDEX idx_uptime_checks_time ON uptime_checks(checked_at DESC);
CREATE INDEX idx_uptime_checks_monitor_time ON uptime_checks(monitor_id, checked_at DESC);

-- Incidents table
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID REFERENCES monitors(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'investigating',
  severity VARCHAR(20) DEFAULT 'minor',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  is_auto_detected BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_incidents_monitor ON incidents(monitor_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_started ON incidents(started_at DESC);

-- Incident updates table
CREATE TABLE incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  status VARCHAR(20),
  message TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_incident_updates_incident ON incident_updates(incident_id);

-- Alert channels table
CREATE TABLE alert_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitor <-> Alert channel join table
CREATE TABLE monitor_alert_channels (
  monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
  alert_channel_id UUID REFERENCES alert_channels(id) ON DELETE CASCADE,
  PRIMARY KEY (monitor_id, alert_channel_id)
);

-- Status page configuration
CREATE TABLE status_page_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) DEFAULT 'Status Page',
  logo_url TEXT,
  custom_domain VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  theme VARCHAR(10) DEFAULT 'light',
  header_text TEXT,
  footer_text TEXT,
  show_uptime_graph BOOLEAN DEFAULT TRUE,
  show_response_times BOOLEAN DEFAULT TRUE,
  show_past_incidents BOOLEAN DEFAULT TRUE,
  days_to_show INTEGER DEFAULT 90,
  allow_subscriptions BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default status page config
INSERT INTO status_page_config (company_name) VALUES ('My Status Page');
