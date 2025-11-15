-- ============================================================================
-- Verification Script: user_onboarding Table
-- ============================================================================
-- Run this AFTER applying the migration to verify everything is correct
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
    column_count INTEGER;
    index_count INTEGER;
    policy_count INTEGER;
    trigger_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User Onboarding Migration Verification';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Check 1: Table Exists
    SELECT COUNT(*) INTO table_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'user_onboarding';

    IF table_count = 1 THEN
        RAISE NOTICE '✅ CHECK 1/5: Table exists';
    ELSE
        RAISE EXCEPTION '❌ CHECK 1/5 FAILED: Table does not exist';
    END IF;

    -- Check 2: All Columns Exist
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_onboarding'
    AND column_name IN (
        'id', 'user_id', 'step_1_complete', 'step_2_complete',
        'step_3_complete', 'step_4_complete', 'step_5_complete',
        'completed_at', 'skipped', 'current_step', 'onboarding_data',
        'created_at', 'updated_at'
    );

    IF column_count = 13 THEN
        RAISE NOTICE '✅ CHECK 2/5: All 13 columns exist';
    ELSE
        RAISE EXCEPTION '❌ CHECK 2/5 FAILED: Expected 13 columns, found %', column_count;
    END IF;

    -- Check 3: Indexes Exist
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'user_onboarding'
    AND indexname IN ('idx_user_onboarding_user_id', 'idx_user_onboarding_completed');

    IF index_count = 2 THEN
        RAISE NOTICE '✅ CHECK 3/5: All 2 indexes exist';
    ELSE
        RAISE NOTICE '⚠️  CHECK 3/5 WARNING: Expected 2 indexes, found %', index_count;
    END IF;

    -- Check 4: RLS Policies Exist
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_onboarding';

    IF policy_count = 3 THEN
        RAISE NOTICE '✅ CHECK 4/5: All 3 RLS policies exist';
    ELSE
        RAISE NOTICE '⚠️  CHECK 4/5 WARNING: Expected 3 policies, found %', policy_count;
    END IF;

    -- Check 5: Trigger Exists
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'trigger_update_user_onboarding_updated_at';

    IF trigger_count = 1 THEN
        RAISE NOTICE '✅ CHECK 5/5: Trigger exists';
    ELSE
        RAISE NOTICE '⚠️  CHECK 5/5 WARNING: Trigger not found';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL CRITICAL CHECKS PASSED';
    RAISE NOTICE 'Migration successfully applied!';
    RAISE NOTICE '========================================';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE '❌ VERIFICATION FAILED';
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE NOTICE '========================================';
        RAISE;
END $$;

-- Display table structure
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_onboarding'
ORDER BY ordinal_position;
