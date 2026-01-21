-- =====================================================================
-- Verification Queries for Name-Based Transition Migration
-- Run these queries to verify the migration was successful
-- =====================================================================

PRINT '=== Migration Verification Report ===';
PRINT '';

-- Check 1: Column existence
PRINT '1. Checking new columns exist...';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'seg_SegmentTransition'
  AND COLUMN_NAME IN ('SourceSegmentName', 'NextSegmentName')
ORDER BY COLUMN_NAME;
PRINT '';

-- Check 2: Data population
PRINT '2. Checking data population...';
SELECT 
    'Total Transitions' as Metric,
    COUNT(*) as Count
FROM seg_SegmentTransition
UNION ALL
SELECT 
    'With SourceSegmentName',
    COUNT(*)
FROM seg_SegmentTransition
WHERE SourceSegmentName IS NOT NULL
UNION ALL
SELECT 
    'With NextSegmentName',
    COUNT(*)
FROM seg_SegmentTransition
WHERE NextSegmentName IS NOT NULL
UNION ALL
SELECT 
    'With NextSegmentId (Old)',
    COUNT(*)
FROM seg_SegmentTransition
WHERE NextSegmentId IS NOT NULL;
PRINT '';

-- Check 3: Index existence
PRINT '3. Checking indexes...';
SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique
FROM sys.indexes i
INNER JOIN sys.objects o ON i.object_id = o.object_id
WHERE o.name = 'seg_SegmentTransition'
  AND i.name IN ('ix_transition_source_name', 'ix_transition_target_name')
ORDER BY i.name;
PRINT '';

-- Check 4: Sample data verification
PRINT '4. Sample data (first 5 transitions)...';
SELECT TOP 5
    t.SegmentTransitionId,
    t.SourceSegmentName,
    s.SegmentName as ActualSourceName,
    t.ResultName,
    t.NextSegmentName,
    tgt.SegmentName as ActualTargetName,
    t.ContextKey,
    CASE 
        WHEN t.SourceSegmentName = s.SegmentName THEN 'OK'
        ELSE 'MISMATCH'
    END as SourceCheck,
    CASE 
        WHEN t.NextSegmentName IS NULL THEN 'NULL'
        WHEN t.NextSegmentName = tgt.SegmentName THEN 'OK'
        ELSE 'MISMATCH'
    END as TargetCheck
FROM seg_SegmentTransition t
INNER JOIN seg_Segment s ON t.SegmentId = s.SegmentId
LEFT JOIN seg_Segment tgt ON t.NextSegmentId = tgt.SegmentId
ORDER BY t.SegmentTransitionId;
PRINT '';

-- Check 5: Name resolution validation
PRINT '5. Checking name resolution works...';
SELECT 
    t.RoutingId,
    t.SourceSegmentName,
    t.NextSegmentName,
    CASE 
        WHEN t.NextSegmentName IS NULL THEN 'N/A'
        WHEN EXISTS (
            SELECT 1 FROM seg_Segment s
            WHERE s.SegmentName = t.NextSegmentName
              AND s.RoutingId = t.RoutingId
              AND (s.ChangeSetId = t.ChangeSetId OR (s.ChangeSetId IS NULL AND t.ChangeSetId IS NULL))
              AND s.IsActive = 1
        ) THEN 'RESOLVES'
        ELSE 'MISSING TARGET'
    END as ResolutionStatus
FROM seg_SegmentTransition t
WHERE t.NextSegmentName IS NOT NULL
GROUP BY t.RoutingId, t.SourceSegmentName, t.NextSegmentName, t.ChangeSetId
HAVING MAX(CASE 
    WHEN EXISTS (
        SELECT 1 FROM seg_Segment s
        WHERE s.SegmentName = t.NextSegmentName
          AND s.RoutingId = t.RoutingId
          AND (s.ChangeSetId = t.ChangeSetId OR (s.ChangeSetId IS NULL AND t.ChangeSetId IS NULL))
          AND s.IsActive = 1
    ) THEN 0 ELSE 1 END) = 1;

PRINT '';
PRINT '=== Verification Complete ===';
