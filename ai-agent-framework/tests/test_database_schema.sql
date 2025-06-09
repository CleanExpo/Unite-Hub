
-- Database Schema Tests
-- Tests for table creation and constraints

-- Test 1: Verify clients table structure
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') 
        THEN 'PASS: clients table exists'
        ELSE 'FAIL: clients table missing'
    END as test_result;

-- Test 2: Verify deals table structure
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deals') 
        THEN 'PASS: deals table exists'
        ELSE 'FAIL: deals table missing'
    END as test_result;

-- Test 3: Verify tasks table structure
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') 
        THEN 'PASS: tasks table exists'
        ELSE 'FAIL: tasks table missing'
    END as test_result;
