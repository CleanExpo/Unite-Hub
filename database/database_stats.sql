-- Create a function to get database statistics
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'profiles', (SELECT count(*) FROM profiles),
    'projects', (SELECT count(*) FROM projects),
    'project_members', (SELECT count(*) FROM project_members),
    'tasks', (SELECT count(*) FROM tasks),
    'comments', (SELECT count(*) FROM comments),
    'task_attachments', (SELECT count(*) FROM task_attachments)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_database_stats TO authenticated;
