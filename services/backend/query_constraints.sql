-- Query all foreign key constraints on segment-related tables
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE 
    TABLE_NAME IN ('seg_Segment', 'seg_SegmentConfig', 'seg_SegmentTransition', 'seg_Dic_Key', 'seg_Dic_SegmentType')
    AND COLUMN_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;
