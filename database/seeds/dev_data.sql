-- dev_data.sql
-- Sample development data

-- Sample monitors
INSERT INTO monitors (name, url, method, interval_seconds, timeout_seconds, expected_status_code, description, tags, current_status) VALUES
  ('Google', 'https://www.google.com', 'GET', 60, 10, 200, 'Google search homepage', '["external", "dns"]'::jsonb, 'up'),
  ('GitHub API', 'https://api.github.com', 'GET', 300, 15, 200, 'GitHub REST API', '["external", "api"]'::jsonb, 'up'),
  ('JSONPlaceholder', 'https://jsonplaceholder.typicode.com/posts/1', 'GET', 120, 10, 200, 'Test REST API', '["test"]'::jsonb, 'up');

-- Sample status page config
UPDATE status_page_config SET company_name = 'Acme Corp', header_text = 'Current system status for all Acme services.';
