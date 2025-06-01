-- Projects Table
CREATE TABLE crm_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES crm_clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) CHECK(status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    budget NUMERIC(15,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE crm_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES crm_projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) CHECK(status IN ('todo', 'in_progress', 'review', 'completed', 'blocked')),
    priority VARCHAR(20) CHECK(priority IN ('low', 'medium', 'high', 'critical')),
    due_date DATE,
    estimated_hours NUMERIC(5,2),
    actual_hours NUMERIC(5,2),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Task Dependencies Table
CREATE TABLE crm_task_dependencies (
    task_id UUID REFERENCES crm_tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES crm_tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, depends_on_task_id)
);

-- Project Members Table
CREATE TABLE crm_project_members (
    project_id UUID REFERENCES crm_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) CHECK(role IN ('manager', 'member', 'contractor')),
    PRIMARY KEY (project_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_crm_projects_client_id ON crm_projects(client_id);
CREATE INDEX idx_crm_tasks_project_id ON crm_tasks(project_id);
CREATE INDEX idx_crm_task_dependencies_task_id ON crm_task_dependencies(task_id);
CREATE INDEX idx_crm_project_members_project_id ON crm_project_members(project_id);

-- Triggers for activity logging (using existing crm_activity_logs table)
CREATE OR REPLACE FUNCTION log_project_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO crm_activity_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
        auth.uid(), 
        TG_OP, 
        'project', 
        COALESCE(NEW.id, OLD.id), 
        jsonb_build_object(
            'name', COALESCE(NEW.name, OLD.name),
            'status', COALESCE(NEW.status, OLD.status)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON crm_projects
FOR EACH ROW EXECUTE FUNCTION log_project_activity();

CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO crm_activity_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
        auth.uid(), 
        TG_OP, 
        'task', 
        COALESCE(NEW.id, OLD.id), 
        jsonb_build_object(
            'title', COALESCE(NEW.title, OLD.title),
            'status', COALESCE(NEW.status, OLD.status)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON crm_tasks
FOR EACH ROW EXECUTE FUNCTION log_task_activity();
