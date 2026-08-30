# Donations table migration (Postgres)

CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  donor TEXT,
  method TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metric_points (
  id TEXT PRIMARY KEY,
  repo TEXT NOT NULL,
  metric TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  value NUMERIC NOT NULL
);
