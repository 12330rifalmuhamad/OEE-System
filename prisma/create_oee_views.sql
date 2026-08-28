-- ============================================================
-- SQL SCRIPT: PostgreSQL View Tables for OEE Analytics
-- Database: PostgreSQL
-- ============================================================

-- 1. View: v_oee_line_daily_summary
-- Aggregates daily OEE score, Availability, Performance, Quality, and Total Output per Line Process.
CREATE OR REPLACE VIEW v_oee_line_daily_summary AS
SELECT 
    m."intLineProcess_ID" AS line_process_id,
    o."dtmDate"::date AS transaction_date,
    COALESCE(SUM(o."fltTotalOutput"), 0) AS total_output,
    COALESCE(AVG(o."decAvailability"), 0) AS availability_rate,
    COALESCE(AVG(o."decPerformance"), 0) AS performance_rate,
    COALESCE(AVG(o."decQuality"), 100) AS quality_rate,
    COALESCE(AVG(o."decOEE"), 0) AS oee
FROM "trOkpLog" o
JOIN "mMachine" m ON o."intMachine_ID" = m."intMachine_ID"
WHERE m."intLineProcess_ID" IS NOT NULL
GROUP BY m."intLineProcess_ID", o."dtmDate"::date;


-- 2. View: v_oee_pareto_downtime
-- Aggregates downtime frequency count and total duration per category for Pareto analysis.
CREATE OR REPLACE VIEW v_oee_pareto_downtime AS
SELECT 
    m."intLineProcess_ID" AS line_process_id,
    o."dtmDate"::date AS transaction_date,
    cat."txtCode" AS category_code,
    cat."txtName" AS category_name,
    COUNT(a."intActivityLog_ID") AS frequency_count,
    COALESCE(SUM(a."fltDuration"), 0) AS total_duration_minutes
FROM "trActivityLog" a
JOIN "trOkpLog" o ON a."intOkpLog_ID" = o."intOkpLog_ID"
JOIN "mMachine" m ON o."intMachine_ID" = m."intMachine_ID"
JOIN "mActivityCode" ac ON a."intActivityCode_ID" = ac."intActivityCode_ID"
JOIN "mActivityCategory" cat ON ac."intActivityCategory_ID" = cat."intActivityCategory_ID"
WHERE cat."txtCode" != 'PR' AND m."intLineProcess_ID" IS NOT NULL
GROUP BY m."intLineProcess_ID", o."dtmDate"::date, cat."txtCode", cat."txtName";


-- 3. View: v_oee_hourly_timeline
-- Aggregates running, downtime, and minor stoppage minutes grouped by hour of day for timeline trends.
CREATE OR REPLACE VIEW v_oee_hourly_timeline AS
SELECT 
    m."intLineProcess_ID" AS line_process_id,
    o."dtmDate"::date AS transaction_date,
    EXTRACT(HOUR FROM COALESCE(a."dtmStartTime", a."dtmCreatedAt"))::integer AS hour_of_day,
    COALESCE(SUM(CASE WHEN cat."txtCode" = 'PR' THEN a."fltDuration" ELSE 0 END), 0) AS running_minutes,
    COALESCE(SUM(CASE WHEN cat."txtCode" NOT IN ('PR', 'MI') THEN a."fltDuration" ELSE 0 END), 0) AS downtime_minutes,
    COALESCE(SUM(CASE WHEN cat."txtCode" = 'MI' THEN a."fltDuration" ELSE 0 END), 0) AS minor_stoppage_minutes
FROM "trActivityLog" a
JOIN "trOkpLog" o ON a."intOkpLog_ID" = o."intOkpLog_ID"
JOIN "mMachine" m ON o."intMachine_ID" = m."intMachine_ID"
JOIN "mActivityCode" ac ON a."intActivityCode_ID" = ac."intActivityCode_ID"
JOIN "mActivityCategory" cat ON ac."intActivityCategory_ID" = cat."intActivityCategory_ID"
WHERE m."intLineProcess_ID" IS NOT NULL
GROUP BY m."intLineProcess_ID", o."dtmDate"::date, EXTRACT(HOUR FROM COALESCE(a."dtmStartTime", a."dtmCreatedAt"));
