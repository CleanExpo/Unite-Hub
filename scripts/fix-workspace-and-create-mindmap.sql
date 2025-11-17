-- =====================================================
-- FIX WORKSPACE AND CREATE TEST MINDMAP
-- =====================================================
-- This fixes the "No workspace selected" error and creates a test project
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := '0082768b-c40a-4c4e-8150-84a3dd406cbc';
  v_org_id UUID := 'adedf006-ca69-47d4-adbf-fc91bd7f225d'; -- From your logs
  v_workspace_id UUID;
  v_project_id UUID;
  v_mindmap_id UUID;
  v_root_node_id UUID;
BEGIN
  -- Check if workspace exists
  SELECT id INTO v_workspace_id
  FROM workspaces
  WHERE org_id = v_org_id
  LIMIT 1;

  -- Create workspace if it doesn't exist
  IF v_workspace_id IS NULL THEN
    INSERT INTO workspaces (
      name,
      org_id,
      created_by
    ) VALUES (
      'Default Workspace',
      v_org_id,
      v_user_id
    )
    RETURNING id INTO v_workspace_id;

    RAISE NOTICE 'Created workspace: %', v_workspace_id;
  ELSE
    RAISE NOTICE 'Using existing workspace: %', v_workspace_id;
  END IF;

  -- Create test project
  INSERT INTO projects (
    org_id,
    title,
    client_name,
    description,
    status,
    priority,
    progress
  ) VALUES (
    v_org_id,
    'Demo E-Commerce Platform',
    'Acme Corporation',
    'A full-featured e-commerce platform with shopping cart, payment processing, and admin dashboard',
    'on-track',
    'high',
    25
  )
  RETURNING id INTO v_project_id;

  -- Update with workspace_id
  UPDATE projects
  SET workspace_id = v_workspace_id
  WHERE id = v_project_id;

  RAISE NOTICE 'Created project: %', v_project_id;

  -- Create mindmap
  INSERT INTO project_mindmaps (
    project_id,
    workspace_id,
    org_id,
    version,
    created_by,
    last_updated_by
  ) VALUES (
    v_project_id,
    v_workspace_id,
    v_org_id,
    1,
    v_user_id,
    v_user_id
  )
  RETURNING id INTO v_mindmap_id;

  RAISE NOTICE 'Created mindmap: %', v_mindmap_id;

  -- Create root node
  INSERT INTO mindmap_nodes (
    mindmap_id,
    node_type,
    label,
    description,
    position_x,
    position_y,
    created_by
  ) VALUES (
    v_mindmap_id,
    'project_root',
    'Demo E-Commerce Platform',
    'A full-featured e-commerce platform with shopping cart, payment processing, and admin dashboard',
    400,
    50,
    v_user_id
  )
  RETURNING id INTO v_root_node_id;

  RAISE NOTICE 'Created root node: %', v_root_node_id;

  -- Output summary
  RAISE NOTICE '================================================';
  RAISE NOTICE 'SUCCESS! Workspace fixed and test project created!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Workspace ID: %', v_workspace_id;
  RAISE NOTICE 'Project ID: %', v_project_id;
  RAISE NOTICE 'Mindmap ID: %', v_mindmap_id;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Refresh your browser, then go to:';
  RAISE NOTICE 'http://localhost:3008/dashboard/projects/%/mindmap', v_project_id;
  RAISE NOTICE '================================================';

END $$;
