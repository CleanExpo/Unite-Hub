-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can read any profile
CREATE POLICY profiles_read_policy ON profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects policies
-- Project owners can do anything with their projects
CREATE POLICY projects_owner_policy ON projects
  FOR ALL USING (auth.uid() = owner_id);

-- Project members can read projects they are members of
CREATE POLICY projects_member_read_policy ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = id
      AND project_members.profile_id = auth.uid()
    )
  );

-- Project managers can update projects they are managers of
CREATE POLICY projects_manager_update_policy ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = id
      AND project_members.profile_id = auth.uid()
      AND project_members.role = 'manager'
    )
  );

-- Project_members policies
-- Project owners can manage project members
CREATE POLICY project_members_owner_policy ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Project managers can manage project members
CREATE POLICY project_members_manager_policy ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_id
      AND pm.profile_id = auth.uid()
      AND pm.role = 'manager'
    )
  );

-- Users can read project members for projects they are members of
CREATE POLICY project_members_read_policy ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_id
      AND pm.profile_id = auth.uid()
    )
  );

-- Tasks policies
-- Project owners can do anything with tasks in their projects
CREATE POLICY tasks_project_owner_policy ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Project managers can do anything with tasks in their projects
CREATE POLICY tasks_project_manager_policy ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_id
      AND project_members.profile_id = auth.uid()
      AND project_members.role = 'manager'
    )
  );

-- Project members can create and update tasks
CREATE POLICY tasks_project_member_create_policy ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_id
      AND project_members.profile_id = auth.uid()
      AND project_members.role IN ('manager', 'member')
    )
  );

CREATE POLICY tasks_project_member_update_policy ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_id
      AND project_members.profile_id = auth.uid()
      AND project_members.role IN ('manager', 'member')
    )
  );

-- All project members can read tasks
CREATE POLICY tasks_project_member_read_policy ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- Task creators can delete their own tasks
CREATE POLICY tasks_creator_delete_policy ON tasks
  FOR DELETE USING (auth.uid() = created_by);

-- Comments policies
-- Project owners can do anything with comments in their projects
CREATE POLICY comments_project_owner_policy ON comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON tasks.project_id = projects.id
      WHERE tasks.id = task_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Project members can create comments
CREATE POLICY comments_project_member_create_policy ON comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN project_members ON tasks.project_id = project_members.project_id
      WHERE tasks.id = task_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- Comment creators can update and delete their own comments
CREATE POLICY comments_creator_update_policy ON comments
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY comments_creator_delete_policy ON comments
  FOR DELETE USING (auth.uid() = profile_id);

-- All project members can read comments
CREATE POLICY comments_project_member_read_policy ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN project_members ON tasks.project_id = project_members.project_id
      WHERE tasks.id = task_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- Task attachments policies
-- Project owners can do anything with attachments in their projects
CREATE POLICY attachments_project_owner_policy ON task_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON tasks.project_id = projects.id
      WHERE tasks.id = task_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Project members can create attachments
CREATE POLICY attachments_project_member_create_policy ON task_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN project_members ON tasks.project_id = project_members.project_id
      WHERE tasks.id = task_id
      AND project_members.profile_id = auth.uid()
      AND project_members.role IN ('manager', 'member')
    )
  );

-- Attachment uploaders can update and delete their own attachments
CREATE POLICY attachments_uploader_update_policy ON task_attachments
  FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY attachments_uploader_delete_policy ON task_attachments
  FOR DELETE USING (auth.uid() = uploaded_by);

-- All project members can read attachments
CREATE POLICY attachments_project_member_read_policy ON task_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN project_members ON tasks.project_id = project_members.project_id
      WHERE tasks.id = task_id
      AND project_members.profile_id = auth.uid()
    )
  );
