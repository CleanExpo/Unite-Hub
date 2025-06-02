

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."consent_type" AS ENUM (
    'privacy_policy',
    'terms_of_service',
    'marketing',
    'cookies',
    'data_processing'
);


ALTER TYPE "public"."consent_type" OWNER TO "postgres";


CREATE PROCEDURE "public"."bulk_resolve_errors"(IN "error_ids" "uuid"[], IN "resolved_by" "uuid")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE error_logs
    SET 
        resolved = TRUE,
        resolved_at = NOW(),
        resolved_by = bulk_resolve_errors.resolved_by,
        updated_at = NOW()
    WHERE id = ANY(error_ids) AND resolved = FALSE;
    
    -- Update any active assignments
    UPDATE error_assignments
    SET 
        status = 'completed',
        updated_at = NOW()
    WHERE error_id = ANY(error_ids) 
    AND status IN ('pending', 'in_progress');
    
    COMMIT;
END;
$$;


ALTER PROCEDURE "public"."bulk_resolve_errors"(IN "error_ids" "uuid"[], IN "resolved_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_error_logs"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Delete error logs older than 90 days that have been resolved
    DELETE FROM error_logs
    WHERE resolved = TRUE
    AND resolved_at < NOW() - INTERVAL '90 days';
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_error_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_assignee_statistics"() RETURNS TABLE("assignee_id" "uuid", "assignee_name" "text", "total_assigned" integer, "resolved_count" integer, "pending_count" integer, "in_progress_count" integer, "rejected_count" integer, "avg_resolution_time_hours" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH assignee_data AS (
        SELECT
            up.user_id,
            CONCAT(up.first_name, ' ', up.last_name) AS name,
            ea.status,
            el.resolved,
            el.created_at,
            el.resolved_at
        FROM
            error_assignments ea
        JOIN
            user_profiles up ON ea.assigned_to = up.user_id
        JOIN
            error_logs el ON ea.error_id = el.id
    )
    SELECT
        ad.user_id,
        ad.name,
        COUNT(*)::INTEGER AS total_assigned,
        COUNT(CASE WHEN ad.resolved = TRUE THEN 1 END)::INTEGER AS resolved_count,
        COUNT(CASE WHEN ad.status = 'pending' THEN 1 END)::INTEGER AS pending_count,
        COUNT(CASE WHEN ad.status = 'in_progress' THEN 1 END)::INTEGER AS in_progress_count,
        COUNT(CASE WHEN ad.status = 'rejected' THEN 1 END)::INTEGER AS rejected_count,
        COALESCE(
            AVG(
                CASE WHEN ad.resolved = TRUE AND ad.resolved_at IS NOT NULL
                THEN EXTRACT(EPOCH FROM (ad.resolved_at - ad.created_at))/3600
                END
            ),
            0
        )::NUMERIC AS avg_resolution_time_hours
    FROM
        assignee_data ad
    GROUP BY
        ad.user_id, ad.name;
END;
$$;


ALTER FUNCTION "public"."get_assignee_statistics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_error_statistics"() RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_count INTEGER;
  severity_counts JSON;
  category_counts JSON;
  resolved_counts JSON;
  recent_errors JSON;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_count FROM error_logs;
  
  -- Get severity counts
  SELECT json_agg(t) INTO severity_counts
  FROM (
    SELECT severity, COUNT(*) as count
    FROM error_logs
    GROUP BY severity
    ORDER BY severity
  ) t;
  
  -- Get category counts
  SELECT json_agg(t) INTO category_counts
  FROM (
    SELECT category, COUNT(*) as count
    FROM error_logs
    GROUP BY category
    ORDER BY count DESC
  ) t;
  
  -- Get resolved counts
  SELECT json_agg(t) INTO resolved_counts
  FROM (
    SELECT resolved, COUNT(*) as count
    FROM error_logs
    GROUP BY resolved
  ) t;
  
  -- Get recent errors (last 7 days)
  SELECT json_agg(t) INTO recent_errors
  FROM (
    SELECT created_at, severity
    FROM error_logs
    WHERE created_at >= NOW() - INTERVAL '7 days'
    ORDER BY created_at ASC
  ) t;
  
  -- Return all statistics as JSON
  RETURN json_build_object(
    'totalCount', total_count,
    'severityCounts', COALESCE(severity_counts, '[]'::JSON),
    'categoryCounts', COALESCE(category_counts, '[]'::JSON),
    'resolvedCounts', COALESCE(resolved_counts, '[]'::JSON),
    'recentErrors', COALESCE(recent_errors, '[]'::JSON)
  );
END;
$$;


ALTER FUNCTION "public"."get_error_statistics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_error_trends_by_time"("start_date" timestamp without time zone, "date_trunc_val" "text") RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSON;
BEGIN
  -- Get error counts by time period and severity
  WITH time_data AS (
    SELECT 
      date_trunc(date_trunc_val, created_at) AS time_period,
      severity,
      COUNT(*) AS count
    FROM 
      error_logs
    WHERE 
      created_at >= start_date
    GROUP BY 
      date_trunc(date_trunc_val, created_at), 
      severity
    ORDER BY 
      time_period
  ),
  pivoted AS (
    SELECT 
      time_period,
      SUM(CASE WHEN severity = 'critical' THEN count ELSE 0 END) AS critical,
      SUM(CASE WHEN severity = 'error' THEN count ELSE 0 END) AS error,
      SUM(CASE WHEN severity = 'warning' THEN count ELSE 0 END) AS warning,
      SUM(CASE WHEN severity = 'info' THEN count ELSE 0 END) AS info,
      SUM(CASE WHEN severity = 'debug' THEN count ELSE 0 END) AS debug
    FROM 
      time_data
    GROUP BY 
      time_period
    ORDER BY 
      time_period
  )
  SELECT json_agg(pivoted) INTO result FROM pivoted;

  -- Return the result
  RETURN COALESCE(result, '[]'::JSON);
END;
$$;


ALTER FUNCTION "public"."get_error_trends_by_time"("start_date" timestamp without time zone, "date_trunc_val" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_error_trends_by_time_period"("start_date" timestamp with time zone, "end_date" timestamp with time zone DEFAULT "now"(), "interval_type" "text" DEFAULT 'day'::"text") RETURNS TABLE("time_period" timestamp with time zone, "total_count" integer, "critical_count" integer, "error_count" integer, "warning_count" integer, "info_count" integer, "debug_count" integer, "resolved_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH time_periods AS (
        SELECT
            date_trunc(interval_type, generate_series(start_date, end_date, ('1 ' || interval_type)::INTERVAL)) AS period
    )
    SELECT
        tp.period,
        COUNT(el.id)::INTEGER AS total_count,
        COUNT(CASE WHEN el.severity = 'critical' THEN 1 END)::INTEGER AS critical_count,
        COUNT(CASE WHEN el.severity = 'error' THEN 1 END)::INTEGER AS error_count,
        COUNT(CASE WHEN el.severity = 'warning' THEN 1 END)::INTEGER AS warning_count,
        COUNT(CASE WHEN el.severity = 'info' THEN 1 END)::INTEGER AS info_count,
        COUNT(CASE WHEN el.severity = 'debug' THEN 1 END)::INTEGER AS debug_count,
        COUNT(CASE WHEN el.resolved = TRUE THEN 1 END)::INTEGER AS resolved_count
    FROM
        time_periods tp
    LEFT JOIN
        error_logs el ON date_trunc(interval_type, el.created_at) = tp.period
    GROUP BY
        tp.period
    ORDER BY
        tp.period;
END;
$$;


ALTER FUNCTION "public"."get_error_trends_by_time_period"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "interval_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recent_errors_with_assignments"("limit_count" integer DEFAULT 50, "include_resolved" boolean DEFAULT false) RETURNS TABLE("id" "uuid", "message" "text", "severity" "text", "category" "text", "url" "text", "created_at" timestamp with time zone, "resolved" boolean, "resolved_at" timestamp with time zone, "assigned_to" "uuid", "assignee_name" "text", "assignment_status" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        el.id,
        el.message,
        el.severity,
        el.category,
        el.url,
        el.created_at,
        el.resolved,
        el.resolved_at,
        ea.assigned_to,
        CONCAT(up.first_name, ' ', up.last_name) AS assignee_name,
        ea.status AS assignment_status
    FROM
        error_logs el
    LEFT JOIN
        error_assignments ea ON el.id = ea.error_id AND ea.id = (
            SELECT id FROM error_assignments 
            WHERE error_id = el.id 
            ORDER BY created_at DESC LIMIT 1
        )
    LEFT JOIN
        user_profiles up ON ea.assigned_to = up.user_id
    WHERE
        (include_resolved = TRUE OR el.resolved = FALSE)
    ORDER BY
        el.created_at DESC
    LIMIT
        limit_count;
END;
$$;


ALTER FUNCTION "public"."get_recent_errors_with_assignments"("limit_count" integer, "include_resolved" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."should_notify_user"("user_id" "uuid", "notification_type" "text", "error_severity" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    should_notify BOOLEAN;
BEGIN
    SELECT
        CASE
            WHEN notification_type = 'email' AND np.email_notifications = TRUE THEN
                CASE
                    WHEN np.email_critical_only = TRUE THEN
                        error_severity = 'critical'
                    ELSE
                        TRUE
                END
            WHEN notification_type = 'assignment' THEN
                np.assignment_notifications
            WHEN notification_type = 'status_change' THEN
                np.status_change_notifications
            WHEN notification_type = 'in_app' THEN
                np.in_app_notifications
            ELSE
                FALSE
        END INTO should_notify
    FROM
        notification_preferences np
    WHERE
        np.user_id = user_id;
    
    -- Default to TRUE if no preferences are set
    RETURN COALESCE(should_notify, TRUE);
END;
$$;


ALTER FUNCTION "public"."should_notify_user"("user_id" "uuid", "notification_type" "text", "error_severity" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_communication_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_communication_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_error_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE error_logs
    SET 
        assigned_to = NEW.assigned_to,
        assignment_status = NEW.status,
        assignment_date = NEW.assigned_at,
        updated_at = NOW()
    WHERE id = NEW.error_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_error_assignment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ERROR_WEBHOOK_URL" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ERROR_WEBHOOK_URL" OWNER TO "postgres";


COMMENT ON TABLE "public"."ERROR_WEBHOOK_URL" IS 'Supabase webhook errors';



ALTER TABLE "public"."ERROR_WEBHOOK_URL" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."ERROR_WEBHOOK_URL_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_notification_settings" (
    "id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_notifications" boolean DEFAULT true NOT NULL,
    "email_critical_only" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_notification_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_notification_settings" IS 'Stores notification preferences for admin users';



CREATE SEQUENCE IF NOT EXISTS "public"."admin_notification_settings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."admin_notification_settings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."admin_notification_settings_id_seq" OWNED BY "public"."admin_notification_settings"."id";



CREATE TABLE IF NOT EXISTS "public"."availability_schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "is_available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."availability_schedule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_name" character varying(255) NOT NULL,
    "contact_person" character varying(255),
    "email" character varying(255) NOT NULL,
    "phone" character varying(50),
    "website" character varying(255),
    "industry" character varying(100),
    "company_size" character varying(50),
    "annual_revenue" numeric(15,2),
    "client_status" character varying(50) DEFAULT 'lead'::character varying,
    "tags" "text"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" "uuid",
    "last_contact_date" timestamp with time zone,
    "address_line1" character varying(255),
    "address_line2" character varying(255),
    "city" character varying(100),
    "state" character varying(100),
    "postal_code" character varying(20),
    "country" character varying(100) DEFAULT 'Australia'::character varying
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "task_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action_type" "text" NOT NULL,
    "action_details" "jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "admin_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."compliance_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consultations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_name" "text" NOT NULL,
    "client_email" "text" NOT NULL,
    "company" "text",
    "phone" "text",
    "service_type" "text" NOT NULL,
    "preferred_date" timestamp with time zone,
    "preferred_time" "text",
    "alternate_date" timestamp with time zone,
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "scheduled_at" timestamp with time zone,
    "duration_minutes" integer DEFAULT 60,
    "meeting_link" "text",
    "meeting_notes" "text",
    "payment_status" "text" DEFAULT 'unpaid'::"text",
    "payment_amount" numeric(10,2) DEFAULT 550.00
);


ALTER TABLE "public"."consultations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cookie_consents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "uuid",
    "necessary" boolean DEFAULT true,
    "preferences" boolean DEFAULT false,
    "analytics" boolean DEFAULT false,
    "marketing" boolean DEFAULT false,
    "ip_address" "text",
    "user_agent" "text",
    "consent_timestamp" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cookie_consents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "interaction_type" character varying(50) NOT NULL,
    "subject" character varying(255),
    "summary" "text",
    "details" "jsonb",
    "interaction_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "next_action" character varying(255),
    "next_action_date" "date",
    "performed_by" "uuid",
    "email_direction" character varying(20),
    "email_message_id" character varying(255),
    "meeting_duration" integer,
    "meeting_location" character varying(255),
    "attendees" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."crm_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid",
    "project_id" "uuid",
    "document_name" character varying(255) NOT NULL,
    "document_type" character varying(100) NOT NULL,
    "file_path" character varying(500) NOT NULL,
    "file_size" bigint,
    "mime_type" character varying(100),
    "description" "text",
    "version" character varying(50) DEFAULT '1.0'::character varying,
    "uploaded_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" "uuid",
    "is_confidential" boolean DEFAULT false,
    "expiry_date" "date",
    "metadata" "jsonb",
    "previous_version" "uuid",
    "version_notes" "text"
);


ALTER TABLE "public"."crm_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_emails" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid",
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "from_email" "text" NOT NULL,
    "to_emails" "text"[] NOT NULL,
    "cc_emails" "text"[],
    "bcc_emails" "text"[],
    "status" "text" NOT NULL,
    "thread_id" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_emails_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'received'::"text"])))
);


ALTER TABLE "public"."crm_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "content" "text" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    CONSTRAINT "crm_notes_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['client'::"text", 'project'::"text", 'task'::"text"])))
);


ALTER TABLE "public"."crm_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "amount" numeric(15,2),
    "currency" character varying(10) DEFAULT 'AUD'::character varying,
    "pipeline_id" "uuid" NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "owner_id" "uuid",
    "expected_close_date" "date",
    "closed_at" timestamp with time zone,
    "closed_reason" "text",
    "status" character varying(20) DEFAULT 'open'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deals_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "deals_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['open'::character varying, 'won'::character varying, 'lost'::character varying])::"text"[])))
);


ALTER TABLE "public"."deals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_assignments" (
    "id" integer NOT NULL,
    "error_id" integer NOT NULL,
    "assigned_by" "uuid" NOT NULL,
    "assigned_to" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL
);


ALTER TABLE "public"."error_assignments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."error_assignments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."error_assignments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."error_assignments_id_seq" OWNED BY "public"."error_assignments"."id";



CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" integer NOT NULL,
    "message" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "category" "text" NOT NULL,
    "stack_trace" "text",
    "context" "jsonb",
    "user_agent" "text",
    "ip_address" "text",
    "url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved" boolean DEFAULT false NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolution_notes" "text",
    "assigned_to" "uuid",
    "assignment_status" "text" DEFAULT 'unassigned'::"text",
    "assignment_date" timestamp with time zone
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."error_logs" IS 'Stores application error logs with detailed information for debugging and monitoring';



CREATE OR REPLACE VIEW "public"."error_assignments_view" AS
 SELECT "ea"."id" AS "assignment_id",
    "ea"."error_id",
    "ea"."assigned_by",
    "ea"."assigned_to",
    "ea"."assigned_at",
    "ea"."notes",
    "ea"."status" AS "assignment_status",
    "el"."message" AS "error_message",
    "el"."severity" AS "error_severity",
    "el"."category" AS "error_category",
    "el"."resolved" AS "error_resolved",
    "el"."created_at" AS "error_created_at"
   FROM ("public"."error_assignments" "ea"
     JOIN "public"."error_logs" "el" ON (("ea"."error_id" = "el"."id")));


ALTER TABLE "public"."error_assignments_view" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."error_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."error_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."error_logs_id_seq" OWNED BY "public"."error_logs"."id";



CREATE OR REPLACE VIEW "public"."error_statistics_view" AS
 SELECT "date_trunc"('day'::"text", "error_logs"."created_at") AS "day",
    "error_logs"."severity",
    "count"(*) AS "count",
    "count"(
        CASE
            WHEN ("error_logs"."resolved" = true) THEN 1
            ELSE NULL::integer
        END) AS "resolved_count"
   FROM "public"."error_logs"
  WHERE ("error_logs"."created_at" > ("now"() - '30 days'::interval))
  GROUP BY ("date_trunc"('day'::"text", "error_logs"."created_at")), "error_logs"."severity"
  ORDER BY ("date_trunc"('day'::"text", "error_logs"."created_at")) DESC, "error_logs"."severity";


ALTER TABLE "public"."error_statistics_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_notifications" boolean DEFAULT true,
    "email_critical_only" boolean DEFAULT true,
    "assignment_notifications" boolean DEFAULT true,
    "status_change_notifications" boolean DEFAULT true,
    "in_app_notifications" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."notification_preferences_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."notification_preferences_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notification_preferences_id_seq" OWNED BY "public"."notification_preferences"."id";



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "business_unit" character varying(50),
    "resource" character varying(100),
    "action" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "permissions_business_unit_check" CHECK ((("business_unit")::"text" = ANY ((ARRAY['CARSI'::character varying, 'Website Builder'::character varying, 'Directory'::character varying, 'AGI Builder'::character varying, 'Oz-Invoice'::character varying, 'CRM'::character varying, NULL::character varying])::"text"[])))
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_automations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "trigger_stage_id" "uuid",
    "target_stage_id" "uuid",
    "condition_type" character varying(50) NOT NULL,
    "condition_config" "jsonb" NOT NULL,
    "action_type" character varying(50) NOT NULL,
    "action_config" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."pipeline_automations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_stages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "order_index" integer NOT NULL,
    "probability" numeric(5,2),
    "color" character varying(20),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pipeline_stages_probability_check" CHECK ((("probability" >= (0)::numeric) AND ("probability" <= (100)::numeric)))
);


ALTER TABLE "public"."pipeline_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipelines" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."pipelines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'user'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "communication_preferences" "jsonb" DEFAULT '{"newsletter": false, "productUpdates": false, "marketingEmails": false}'::"jsonb",
    "data_processing_preferences" "jsonb" DEFAULT '{"analytics": false, "profiling": false, "thirdPartySharing": false}'::"jsonb",
    "last_privacy_consent_date" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_members" (
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_members_role_check" CHECK (("role" = ANY (ARRAY['member'::"text", 'manager'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."project_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'active'::"text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."system_health" AS
 SELECT ( SELECT "count"(*) AS "count"
           FROM "public"."error_logs") AS "total_error_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."error_logs"
          WHERE ("error_logs"."resolved" = false)) AS "unresolved_error_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."error_logs"
          WHERE (("error_logs"."severity" = 'critical'::"text") AND ("error_logs"."resolved" = false))) AS "critical_unresolved_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."error_assignments"
          WHERE ("error_assignments"."status" = 'pending'::"text")) AS "pending_assignments_count",
    ( SELECT "avg"((EXTRACT(epoch FROM ("error_logs"."resolved_at" - "error_logs"."created_at")) / (3600)::numeric)) AS "avg"
           FROM "public"."error_logs"
          WHERE (("error_logs"."resolved" = true) AND ("error_logs"."resolved_at" IS NOT NULL))) AS "avg_resolution_time_hours";


ALTER TABLE "public"."system_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'todo'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "due_date" timestamp with time zone,
    "project_id" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['todo'::"text", 'in_progress'::"text", 'done'::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unavailable_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."unavailable_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_consents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "consent_type" "public"."consent_type" NOT NULL,
    "consented" boolean NOT NULL,
    "consent_version" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_consents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_notification_settings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."admin_notification_settings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."error_assignments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."error_assignments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."error_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."error_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notification_preferences" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notification_preferences_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ERROR_WEBHOOK_URL"
    ADD CONSTRAINT "ERROR_WEBHOOK_URL_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_notification_settings"
    ADD CONSTRAINT "admin_notification_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_notification_settings"
    ADD CONSTRAINT "admin_notification_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."availability_schedule"
    ADD CONSTRAINT "availability_schedule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_audit_log"
    ADD CONSTRAINT "compliance_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultations"
    ADD CONSTRAINT "consultations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cookie_consents"
    ADD CONSTRAINT "cookie_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_documents"
    ADD CONSTRAINT "crm_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_emails"
    ADD CONSTRAINT "crm_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_notes"
    ADD CONSTRAINT "crm_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_assignments"
    ADD CONSTRAINT "error_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_automations"
    ADD CONSTRAINT "pipeline_automations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pipeline_id_name_key" UNIQUE ("pipeline_id", "name");



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("project_id", "user_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unavailable_dates"
    ADD CONSTRAINT "unavailable_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



CREATE INDEX "compliance_audit_log_action_type_idx" ON "public"."compliance_audit_log" USING "btree" ("action_type");



CREATE INDEX "compliance_audit_log_created_idx" ON "public"."compliance_audit_log" USING "btree" ("created_at");



CREATE INDEX "compliance_audit_log_user_id_idx" ON "public"."compliance_audit_log" USING "btree" ("user_id");



CREATE INDEX "consultations_client_email_idx" ON "public"."consultations" USING "btree" ("client_email");



CREATE INDEX "consultations_created_at_idx" ON "public"."consultations" USING "btree" ("created_at");



CREATE INDEX "consultations_scheduled_at_idx" ON "public"."consultations" USING "btree" ("scheduled_at");



CREATE INDEX "consultations_status_idx" ON "public"."consultations" USING "btree" ("status");



CREATE INDEX "consultations_user_id_idx" ON "public"."consultations" USING "btree" ("user_id");



CREATE INDEX "cookie_consents_session_id_idx" ON "public"."cookie_consents" USING "btree" ("session_id");



CREATE INDEX "cookie_consents_timestamp_idx" ON "public"."cookie_consents" USING "btree" ("consent_timestamp");



CREATE INDEX "cookie_consents_user_id_idx" ON "public"."cookie_consents" USING "btree" ("user_id");



CREATE INDEX "idx_activities_client" ON "public"."crm_activities" USING "btree" ("client_id");



CREATE INDEX "idx_activities_date" ON "public"."crm_activities" USING "btree" ("interaction_date");



CREATE INDEX "idx_activities_type" ON "public"."crm_activities" USING "btree" ("interaction_type");



CREATE INDEX "idx_activity_logs_entity_id" ON "public"."activity_logs" USING "btree" ("entity_id");



CREATE INDEX "idx_activity_logs_user_id" ON "public"."activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_admin_notification_settings_user_id" ON "public"."admin_notification_settings" USING "btree" ("user_id");



CREATE INDEX "idx_clients_company" ON "public"."clients" USING "btree" ("company_name");



CREATE INDEX "idx_clients_email" ON "public"."clients" USING "btree" ("email");



CREATE INDEX "idx_clients_status" ON "public"."clients" USING "btree" ("client_status");



CREATE INDEX "idx_comments_task_id" ON "public"."comments" USING "btree" ("task_id");



CREATE INDEX "idx_crm_emails_client_id" ON "public"."crm_emails" USING "btree" ("client_id");



CREATE INDEX "idx_crm_emails_thread_id" ON "public"."crm_emails" USING "btree" ("thread_id");



CREATE INDEX "idx_crm_emails_user_id" ON "public"."crm_emails" USING "btree" ("user_id");



CREATE INDEX "idx_crm_notes_entity" ON "public"."crm_notes" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_crm_notes_user_id" ON "public"."crm_notes" USING "btree" ("user_id");



CREATE INDEX "idx_deals_client" ON "public"."deals" USING "btree" ("client_id");



CREATE INDEX "idx_deals_owner" ON "public"."deals" USING "btree" ("owner_id");



CREATE INDEX "idx_deals_pipeline_stage" ON "public"."deals" USING "btree" ("pipeline_id", "stage_id");



CREATE INDEX "idx_deals_status" ON "public"."deals" USING "btree" ("status");



CREATE INDEX "idx_documents_client" ON "public"."crm_documents" USING "btree" ("client_id");



CREATE INDEX "idx_documents_project" ON "public"."crm_documents" USING "btree" ("project_id");



CREATE INDEX "idx_documents_type" ON "public"."crm_documents" USING "btree" ("document_type");



CREATE INDEX "idx_error_assignments_assigned_to" ON "public"."error_assignments" USING "btree" ("assigned_to");



CREATE INDEX "idx_error_assignments_error_id" ON "public"."error_assignments" USING "btree" ("error_id");



CREATE INDEX "idx_error_logs_assigned_to" ON "public"."error_logs" USING "btree" ("assigned_to");



CREATE INDEX "idx_error_logs_category" ON "public"."error_logs" USING "btree" ("category");



CREATE INDEX "idx_error_logs_created_at" ON "public"."error_logs" USING "btree" ("created_at");



CREATE INDEX "idx_error_logs_resolved" ON "public"."error_logs" USING "btree" ("resolved");



CREATE INDEX "idx_error_logs_severity" ON "public"."error_logs" USING "btree" ("severity");



CREATE INDEX "idx_pipeline_stages_pipeline" ON "public"."pipeline_stages" USING "btree" ("pipeline_id");



CREATE INDEX "idx_pipelines_name" ON "public"."pipelines" USING "btree" ("name");



CREATE INDEX "idx_project_members_user_id" ON "public"."project_members" USING "btree" ("user_id");



CREATE INDEX "idx_tasks_assigned_to" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_tasks_project_id" ON "public"."tasks" USING "btree" ("project_id");



CREATE INDEX "profiles_email_idx" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "projects_created_idx" ON "public"."projects" USING "btree" ("created_at");



CREATE INDEX "projects_status_idx" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "projects_user_id_idx" ON "public"."projects" USING "btree" ("user_id");



CREATE INDEX "unavailable_dates_date_idx" ON "public"."unavailable_dates" USING "btree" ("date");



CREATE INDEX "unavailable_dates_user_id_idx" ON "public"."unavailable_dates" USING "btree" ("user_id");



CREATE INDEX "user_consents_created_idx" ON "public"."user_consents" USING "btree" ("created_at");



CREATE INDEX "user_consents_type_idx" ON "public"."user_consents" USING "btree" ("consent_type");



CREATE INDEX "user_consents_user_id_idx" ON "public"."user_consents" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "error_assignment_trigger" AFTER INSERT OR UPDATE ON "public"."error_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_error_assignment"();



CREATE OR REPLACE TRIGGER "trigger_cleanup_old_error_logs" AFTER INSERT ON "public"."error_logs" FOR EACH STATEMENT EXECUTE FUNCTION "public"."cleanup_old_error_logs"();



CREATE OR REPLACE TRIGGER "update_automations_updated_at" BEFORE UPDATE ON "public"."pipeline_automations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_availability_schedule_updated_at" BEFORE UPDATE ON "public"."availability_schedule" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_consultations_updated_at" BEFORE UPDATE ON "public"."consultations" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_crm_activities_updated_at" BEFORE UPDATE ON "public"."crm_activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_crm_emails_updated_at" BEFORE UPDATE ON "public"."crm_emails" FOR EACH ROW EXECUTE FUNCTION "public"."update_communication_updated_at"();



CREATE OR REPLACE TRIGGER "update_crm_notes_updated_at" BEFORE UPDATE ON "public"."crm_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_communication_updated_at"();



CREATE OR REPLACE TRIGGER "update_deals_updated_at" BEFORE UPDATE ON "public"."deals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_permissions_updated_at" BEFORE UPDATE ON "public"."permissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pipeline_stages_updated_at" BEFORE UPDATE ON "public"."pipeline_stages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pipelines_updated_at" BEFORE UPDATE ON "public"."pipelines" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_roles_updated_at" BEFORE UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_notification_settings"
    ADD CONSTRAINT "admin_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."availability_schedule"
    ADD CONSTRAINT "availability_schedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_audit_log"
    ADD CONSTRAINT "compliance_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compliance_audit_log"
    ADD CONSTRAINT "compliance_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."consultations"
    ADD CONSTRAINT "consultations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cookie_consents"
    ADD CONSTRAINT "cookie_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_activities"
    ADD CONSTRAINT "crm_activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_documents"
    ADD CONSTRAINT "crm_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_documents"
    ADD CONSTRAINT "crm_documents_previous_version_fkey" FOREIGN KEY ("previous_version") REFERENCES "public"."crm_documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_documents"
    ADD CONSTRAINT "crm_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_documents"
    ADD CONSTRAINT "crm_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_emails"
    ADD CONSTRAINT "crm_emails_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_emails"
    ADD CONSTRAINT "crm_emails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_notes"
    ADD CONSTRAINT "crm_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id");



ALTER TABLE ONLY "public"."error_assignments"
    ADD CONSTRAINT "error_assignments_error_id_fkey" FOREIGN KEY ("error_id") REFERENCES "public"."error_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_automations"
    ADD CONSTRAINT "pipeline_automations_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_automations"
    ADD CONSTRAINT "pipeline_automations_target_stage_id_fkey" FOREIGN KEY ("target_stage_id") REFERENCES "public"."pipeline_stages"("id");



ALTER TABLE ONLY "public"."pipeline_automations"
    ADD CONSTRAINT "pipeline_automations_trigger_stage_id_fkey" FOREIGN KEY ("trigger_stage_id") REFERENCES "public"."pipeline_stages"("id");



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unavailable_dates"
    ADD CONSTRAINT "unavailable_dates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage availability schedule" ON "public"."availability_schedule" USING (("auth"."uid"() IN ( SELECT "availability_schedule"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can manage unavailable dates" ON "public"."unavailable_dates" USING (("auth"."uid"() IN ( SELECT "unavailable_dates"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can update all consultations" ON "public"."consultations" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "consultations"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can view all consultations" ON "public"."consultations" FOR SELECT USING (("auth"."uid"() IN ( SELECT "consultations"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Anyone can create a consultation" ON "public"."consultations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view activity logs" ON "public"."activity_logs" FOR SELECT USING (true);



CREATE POLICY "Anyone can view comments" ON "public"."comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."tasks"
     JOIN "public"."project_members" ON (("tasks"."project_id" = "project_members"."project_id")))
  WHERE (("comments"."task_id" = "tasks"."id") AND ("project_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Authenticated users can create comments" ON "public"."comments" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM ("public"."tasks"
     JOIN "public"."project_members" ON (("tasks"."project_id" = "project_members"."project_id")))
  WHERE (("comments"."task_id" = "tasks"."id") AND ("project_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."ERROR_WEBHOOK_URL" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Enable insert for authenticated users only" ON "public"."ERROR_WEBHOOK_URL" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."ERROR_WEBHOOK_URL" FOR SELECT USING (true);



CREATE POLICY "Project members can create tasks" ON "public"."tasks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "tasks"."project_id") AND ("project_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Project members can view tasks" ON "public"."tasks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "tasks"."project_id") AND ("project_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "System can create activity logs" ON "public"."activity_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Task creators and assignees can update tasks" ON "public"."tasks" FOR UPDATE USING ((("auth"."uid"() = "created_by") OR ("auth"."uid"() = "assigned_to") OR (EXISTS ( SELECT 1
   FROM "public"."project_members"
  WHERE (("project_members"."project_id" = "tasks"."project_id") AND ("project_members"."user_id" = "auth"."uid"()) AND ("project_members"."role" = 'manager'::"text"))))));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage their own consents" ON "public"."user_consents" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own cookie consents" ON "public"."cookie_consents" USING ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "Users can manage their own emails" ON "public"."crm_emails" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own notes" ON "public"."crm_notes" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own projects" ON "public"."projects" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read client emails" ON "public"."crm_emails" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE ("clients"."id" = "crm_emails"."client_id"))));



CREATE POLICY "Users can read entity notes" ON "public"."crm_notes" FOR SELECT USING (((("entity_type" = 'client'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE ("clients"."id" = "crm_notes"."entity_id")))) OR (("entity_type" = 'project'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE ("projects"."id" = "crm_notes"."entity_id")))) OR (("entity_type" = 'task'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."tasks"
  WHERE ("tasks"."id" = "crm_notes"."entity_id"))))));



CREATE POLICY "Users can update their own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their memberships" ON "public"."project_members" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own audit logs" ON "public"."compliance_audit_log" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own consultations" ON "public"."consultations" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("client_email" = "auth"."email"())));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."availability_schedule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consultations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cookie_consents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "create_activities" ON "public"."crm_activities" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "performed_by"));



CREATE POLICY "create_documents" ON "public"."crm_documents" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "uploaded_by"));



ALTER TABLE "public"."crm_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_clients" ON "public"."clients" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "insert_clients" ON "public"."clients" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "manage_deals" ON "public"."deals" TO "authenticated" USING (true);



ALTER TABLE "public"."pipeline_automations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipeline_stages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipelines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read_all_clients" ON "public"."clients" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unavailable_dates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_activities" ON "public"."crm_activities" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "performed_by"));



CREATE POLICY "update_clients" ON "public"."clients" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "update_documents" ON "public"."crm_documents" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "uploaded_by"));



ALTER TABLE "public"."user_consents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "view_activities" ON "public"."crm_activities" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "view_documents" ON "public"."crm_documents" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "view_pipeline_stages" ON "public"."pipeline_stages" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "view_pipelines" ON "public"."pipelines" FOR SELECT TO "authenticated" USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ERROR_WEBHOOK_URL";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON PROCEDURE "public"."bulk_resolve_errors"(IN "error_ids" "uuid"[], IN "resolved_by" "uuid") TO "anon";
GRANT ALL ON PROCEDURE "public"."bulk_resolve_errors"(IN "error_ids" "uuid"[], IN "resolved_by" "uuid") TO "authenticated";
GRANT ALL ON PROCEDURE "public"."bulk_resolve_errors"(IN "error_ids" "uuid"[], IN "resolved_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_error_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_error_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_error_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_assignee_statistics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_assignee_statistics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_assignee_statistics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_error_statistics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_error_statistics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_error_statistics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_error_trends_by_time"("start_date" timestamp without time zone, "date_trunc_val" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_error_trends_by_time"("start_date" timestamp without time zone, "date_trunc_val" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_error_trends_by_time"("start_date" timestamp without time zone, "date_trunc_val" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_error_trends_by_time_period"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "interval_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_error_trends_by_time_period"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "interval_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_error_trends_by_time_period"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "interval_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_errors_with_assignments"("limit_count" integer, "include_resolved" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_errors_with_assignments"("limit_count" integer, "include_resolved" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_errors_with_assignments"("limit_count" integer, "include_resolved" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."should_notify_user"("user_id" "uuid", "notification_type" "text", "error_severity" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."should_notify_user"("user_id" "uuid", "notification_type" "text", "error_severity" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."should_notify_user"("user_id" "uuid", "notification_type" "text", "error_severity" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_communication_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_communication_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_communication_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_error_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_error_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_error_assignment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."ERROR_WEBHOOK_URL" TO "anon";
GRANT ALL ON TABLE "public"."ERROR_WEBHOOK_URL" TO "authenticated";
GRANT ALL ON TABLE "public"."ERROR_WEBHOOK_URL" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ERROR_WEBHOOK_URL_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ERROR_WEBHOOK_URL_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ERROR_WEBHOOK_URL_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."admin_notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_notification_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."admin_notification_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."admin_notification_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."admin_notification_settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."availability_schedule" TO "anon";
GRANT ALL ON TABLE "public"."availability_schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."availability_schedule" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."compliance_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."consultations" TO "anon";
GRANT ALL ON TABLE "public"."consultations" TO "authenticated";
GRANT ALL ON TABLE "public"."consultations" TO "service_role";



GRANT ALL ON TABLE "public"."cookie_consents" TO "anon";
GRANT ALL ON TABLE "public"."cookie_consents" TO "authenticated";
GRANT ALL ON TABLE "public"."cookie_consents" TO "service_role";



GRANT ALL ON TABLE "public"."crm_activities" TO "anon";
GRANT ALL ON TABLE "public"."crm_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_activities" TO "service_role";



GRANT ALL ON TABLE "public"."crm_documents" TO "anon";
GRANT ALL ON TABLE "public"."crm_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_documents" TO "service_role";



GRANT ALL ON TABLE "public"."crm_emails" TO "anon";
GRANT ALL ON TABLE "public"."crm_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_emails" TO "service_role";



GRANT ALL ON TABLE "public"."crm_notes" TO "anon";
GRANT ALL ON TABLE "public"."crm_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_notes" TO "service_role";



GRANT ALL ON TABLE "public"."deals" TO "anon";
GRANT ALL ON TABLE "public"."deals" TO "authenticated";
GRANT ALL ON TABLE "public"."deals" TO "service_role";



GRANT ALL ON TABLE "public"."error_assignments" TO "anon";
GRANT ALL ON TABLE "public"."error_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."error_assignments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."error_assignments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."error_assignments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."error_assignments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."error_assignments_view" TO "anon";
GRANT ALL ON TABLE "public"."error_assignments_view" TO "authenticated";
GRANT ALL ON TABLE "public"."error_assignments_view" TO "service_role";



GRANT ALL ON SEQUENCE "public"."error_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."error_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."error_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."error_statistics_view" TO "anon";
GRANT ALL ON TABLE "public"."error_statistics_view" TO "authenticated";
GRANT ALL ON TABLE "public"."error_statistics_view" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notification_preferences_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notification_preferences_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notification_preferences_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_automations" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_automations" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_automations" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_stages" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "service_role";



GRANT ALL ON TABLE "public"."pipelines" TO "anon";
GRANT ALL ON TABLE "public"."pipelines" TO "authenticated";
GRANT ALL ON TABLE "public"."pipelines" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_members" TO "anon";
GRANT ALL ON TABLE "public"."project_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_members" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."system_health" TO "anon";
GRANT ALL ON TABLE "public"."system_health" TO "authenticated";
GRANT ALL ON TABLE "public"."system_health" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."unavailable_dates" TO "anon";
GRANT ALL ON TABLE "public"."unavailable_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."unavailable_dates" TO "service_role";



GRANT ALL ON TABLE "public"."user_consents" TO "anon";
GRANT ALL ON TABLE "public"."user_consents" TO "authenticated";
GRANT ALL ON TABLE "public"."user_consents" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
