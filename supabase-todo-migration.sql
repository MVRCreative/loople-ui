-- Supabase Todo System Migration
-- Run this in your Supabase SQL editor

-- 1. Create the club_tasks table
CREATE TABLE IF NOT EXISTS club_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id BIGINT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id TEXT, -- User ID from auth.users
    due_date TIMESTAMP WITH TIME ZONE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'completed', 'overdue')),
    created_by TEXT NOT NULL, -- User ID from auth.users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_tasks_club_id ON club_tasks(club_id);
CREATE INDEX IF NOT EXISTS idx_club_tasks_assignee_id ON club_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_club_tasks_status ON club_tasks(status);
CREATE INDEX IF NOT EXISTS idx_club_tasks_due_date ON club_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_club_tasks_created_by ON club_tasks(created_by);

-- 3. Add a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_club_tasks_updated_at ON club_tasks;
CREATE TRIGGER update_club_tasks_updated_at
    BEFORE UPDATE ON club_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security
ALTER TABLE club_tasks ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Policy 1: Club admins can manage all tasks for their club
CREATE POLICY "Club admins can manage tasks" ON club_tasks
    FOR ALL USING (
        club_id IN (
            SELECT club_id FROM members 
            WHERE user_id = auth.uid()::text
            AND role IN ('Admin', 'Owner')
            AND membership_status = 'active'
        )
    );

-- Policy 2: Users can view tasks assigned to them
CREATE POLICY "Users can view assigned tasks" ON club_tasks
    FOR SELECT USING (assignee_id = auth.uid()::text);

-- Policy 3: Users can update tasks assigned to them (for status changes)
CREATE POLICY "Users can update assigned tasks" ON club_tasks
    FOR UPDATE USING (assignee_id = auth.uid()::text);

-- 6. Grant necessary permissions
GRANT ALL ON club_tasks TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 7. Insert some test data (optional - remove in production)
INSERT INTO club_tasks (club_id, title, description, priority, status, created_by) VALUES
(1, 'Welcome to the new task system!', 'This is a test task to verify everything is working.', 'high', 'todo', auth.uid()::text),
(1, 'Review club policies', 'Update and review all club policies for the new season.', 'medium', 'todo', auth.uid()::text),
(1, 'Plan summer events', 'Organize and schedule summer swimming events.', 'low', 'todo', auth.uid()::text);

-- 8. Verify the setup
SELECT 'club_tasks table created successfully!' as status;
SELECT COUNT(*) as task_count FROM club_tasks;
