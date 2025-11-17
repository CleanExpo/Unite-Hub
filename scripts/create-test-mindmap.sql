-- =====================================================
-- CREATE TEST PROJECT WITH MINDMAP
-- =====================================================
-- Run this in Supabase SQL Editor to create a demo project
-- with a fully populated mindmap
-- =====================================================

-- Variables (update these with your actual IDs)
DO $$
DECLARE
  v_user_id UUID := '0082768b-c40a-4c4e-8150-84a3dd406cbc'; -- Replace with your user ID
  v_org_id UUID;
  v_workspace_id UUID;
  v_project_id UUID;
  v_mindmap_id UUID;
  v_root_node_id UUID;
  v_auth_node_id UUID;
  v_cart_node_id UUID;
  v_payment_node_id UUID;
  v_admin_node_id UUID;
  v_security_node_id UUID;
  v_milestone_node_id UUID;
BEGIN
  -- Get user's org and workspace
  SELECT org_id INTO v_org_id
  FROM user_organizations
  WHERE user_id = v_user_id
  LIMIT 1;

  SELECT id INTO v_workspace_id
  FROM workspaces
  WHERE org_id = v_org_id
  LIMIT 1;

  RAISE NOTICE 'Using org_id: %, workspace_id: %', v_org_id, v_workspace_id;

  -- Create project (without workspace_id due to schema cache issue)
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

  -- Update with workspace_id separately (workaround for schema cache)
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

  -- Create feature nodes
  INSERT INTO mindmap_nodes (
    mindmap_id,
    parent_id,
    node_type,
    label,
    description,
    position_x,
    position_y,
    created_by
  ) VALUES
  (
    v_mindmap_id,
    v_root_node_id,
    'feature',
    'User Authentication',
    'Login, signup, password reset, OAuth integration with Google and Facebook',
    200,
    200,
    v_user_id
  ),
  (
    v_mindmap_id,
    v_root_node_id,
    'feature',
    'Shopping Cart',
    'Add to cart, update quantities, save for later, persistent cart across sessions',
    400,
    200,
    v_user_id
  ),
  (
    v_mindmap_id,
    v_root_node_id,
    'feature',
    'Payment Processing',
    'Stripe integration, multiple payment methods (credit card, PayPal, Apple Pay)',
    600,
    200,
    v_user_id
  ),
  (
    v_mindmap_id,
    v_root_node_id,
    'feature',
    'Admin Dashboard',
    'Product management, order tracking, analytics, inventory management',
    200,
    350,
    v_user_id
  ),
  (
    v_mindmap_id,
    v_root_node_id,
    'requirement',
    'Security Requirements',
    'SSL/TLS encryption, GDPR compliance, PCI DSS for payment processing',
    400,
    350,
    v_user_id
  ),
  (
    v_mindmap_id,
    v_root_node_id,
    'milestone',
    'MVP Launch',
    'Launch with core features: authentication, shopping cart, and checkout',
    600,
    350,
    v_user_id
  ),
  (
    v_mindmap_id,
    v_root_node_id,
    'task',
    'Setup Database Schema',
    'PostgreSQL with tables for users, products, orders, cart items',
    100,
    500,
    v_user_id
  ),
  (
    v_mindmap_id,
    v_root_node_id,
    'idea',
    'AI Product Recommendations',
    'Future feature: AI-powered product recommendations based on browsing history',
    300,
    500,
    v_user_id
  ),
  (
    v_mindmap_id,
    v_root_node_id,
    'question',
    'Mobile App Support?',
    'Should we build React Native app or PWA for mobile users?',
    500,
    500,
    v_user_id
  ),
  (
    v_mindmap_id,
    v_root_node_id,
    'note',
    'Tech Stack Decision',
    'Next.js 16 + React 19 + Supabase + Stripe + shadcn/ui',
    700,
    500,
    v_user_id
  )
  RETURNING id;

  -- Get node IDs for connections
  SELECT id INTO v_auth_node_id FROM mindmap_nodes WHERE mindmap_id = v_mindmap_id AND label = 'User Authentication';
  SELECT id INTO v_cart_node_id FROM mindmap_nodes WHERE mindmap_id = v_mindmap_id AND label = 'Shopping Cart';
  SELECT id INTO v_payment_node_id FROM mindmap_nodes WHERE mindmap_id = v_mindmap_id AND label = 'Payment Processing';
  SELECT id INTO v_admin_node_id FROM mindmap_nodes WHERE mindmap_id = v_mindmap_id AND label = 'Admin Dashboard';

  RAISE NOTICE 'Created 10 feature nodes';

  -- Create connections
  INSERT INTO mindmap_connections (
    mindmap_id,
    from_node_id,
    to_node_id,
    connection_type,
    label,
    created_by
  ) VALUES
  (v_mindmap_id, v_root_node_id, v_auth_node_id, 'hierarchy', 'Core feature', v_user_id),
  (v_mindmap_id, v_root_node_id, v_cart_node_id, 'hierarchy', 'Core feature', v_user_id),
  (v_mindmap_id, v_root_node_id, v_payment_node_id, 'hierarchy', 'Core feature', v_user_id),
  (v_mindmap_id, v_auth_node_id, v_cart_node_id, 'dependency', 'Required for checkout', v_user_id),
  (v_mindmap_id, v_cart_node_id, v_payment_node_id, 'dependency', 'Checkout flow', v_user_id),
  (v_mindmap_id, v_auth_node_id, v_admin_node_id, 'dependency', 'Admin auth required', v_user_id);

  RAISE NOTICE 'Created 6 connections';

  -- Create AI suggestions
  INSERT INTO ai_suggestions (
    mindmap_id,
    node_id,
    suggestion_type,
    title,
    description,
    confidence_score,
    status
  ) VALUES
  (
    v_mindmap_id,
    v_auth_node_id,
    'add_feature',
    'Add Two-Factor Authentication',
    'For enhanced security, implement 2FA using TOTP (Time-based One-Time Password) or SMS verification',
    0.85,
    'pending'
  ),
  (
    v_mindmap_id,
    v_payment_node_id,
    'suggest_technology',
    'Use Stripe Checkout',
    'Stripe Checkout provides a pre-built, PCI-compliant payment form that reduces development time by 50%',
    0.90,
    'pending'
  ),
  (
    v_mindmap_id,
    v_root_node_id,
    'add_feature',
    'Product Search & Filtering',
    'Add Elasticsearch or Algolia for fast, typo-tolerant product search with faceted filtering',
    0.75,
    'pending'
  ),
  (
    v_mindmap_id,
    v_cart_node_id,
    'identify_dependency',
    'Inventory Management Needed',
    'Shopping cart needs real-time inventory checks to prevent overselling',
    0.80,
    'pending'
  ),
  (
    v_mindmap_id,
    v_root_node_id,
    'warn_complexity',
    'Scaling Considerations',
    'For 10k+ concurrent users, consider Redis for cart sessions and CDN for static assets',
    0.70,
    'pending'
  );

  RAISE NOTICE 'Created 5 AI suggestions';

  -- Output final summary
  RAISE NOTICE '================================================';
  RAISE NOTICE 'SUCCESS! Test project with mindmap created!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Project ID: %', v_project_id;
  RAISE NOTICE 'Mindmap ID: %', v_mindmap_id;
  RAISE NOTICE 'Nodes: 11 (1 root + 10 features)';
  RAISE NOTICE 'Connections: 6';
  RAISE NOTICE 'AI Suggestions: 5';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Access URL: http://localhost:3008/dashboard/projects/%/mindmap', v_project_id;
  RAISE NOTICE '================================================';

END $$;
