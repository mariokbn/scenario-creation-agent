-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create upload_sessions table (optional, for tracking uploads)
CREATE TABLE IF NOT EXISTS upload_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  csv_filename TEXT,
  json_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_created_at ON upload_sessions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on scenarios" ON scenarios
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on upload_sessions" ON upload_sessions
  FOR ALL USING (true) WITH CHECK (true);
