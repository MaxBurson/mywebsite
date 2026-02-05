# Supabase Database Setup

## Database Schema

You need to create a table called `evaluations` in your Supabase database with the following structure:

```sql
CREATE TABLE evaluations (
  id BIGSERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  participant_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_quality INTEGER,
  consistency_character INTEGER,
  context_awareness INTEGER,
  engagement INTEGER,
  responsiveness INTEGER,
  problems_issues TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_evaluations_participant ON evaluations(participant_name);
CREATE INDEX idx_evaluations_timestamp ON evaluations(timestamp DESC);
CREATE INDEX idx_evaluations_session ON evaluations(session_id);
```

## Row Level Security (RLS)

Enable RLS and create policies to allow public access:

```sql
-- Enable RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read evaluations
CREATE POLICY "Allow public read access"
ON evaluations FOR SELECT
TO public
USING (true);

-- Allow anyone to insert evaluations
CREATE POLICY "Allow public insert access"
ON evaluations FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to delete evaluations (for the delete all feature)
CREATE POLICY "Allow public delete access"
ON evaluations FOR DELETE
TO public
USING (true);
```

## Configuration

The application uses these Supabase credentials:
- **URL**: `https://ckvoydadpgnrcvuxgfat.supabase.co`
- **Anon Key**: Already configured in the code

## Features

### Data Submission
- Evaluations are automatically saved to Supabase when users complete a session
- Data includes participant name, session ID, all ratings, and any issues reported
- LocalStorage is kept as a backup

### Results Page
- Fetches all evaluation data from Supabase in real-time
- Data is accessible from anywhere with internet connection
- Organized by participant name with full session details

### Delete Functionality
- Z+Q menu on results page includes "Delete All Data" option
- Removes all records from Supabase database
- Also clears localStorage backup

## Testing

1. Complete an evaluation on the main page
2. Check Supabase dashboard to verify data was inserted
3. Visit `/results/` page to see data fetched from database
4. Test from different devices/locations to verify cloud access

## Benefits

✅ **Cloud Storage**: Data persists across devices and browsers
✅ **Secure**: Supabase handles authentication and security
✅ **Scalable**: Can handle unlimited participants and sessions
✅ **Accessible**: View results from anywhere with internet
✅ **Backup**: LocalStorage still maintained as fallback
