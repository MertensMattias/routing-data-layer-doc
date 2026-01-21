-- =====================================================================
-- Seed: Backfill New Columns (Post-Migration)
-- File: 033_backfill_new_columns.sql
-- Purpose: Populate SourceSegmentName, NextSegmentName, TransitionOrder, and ConfigOrder
-- Dependencies: All other seed files (01x-032)
-- Re-run safe: Yes (updates existing records)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    PRINT '🔄 Backfilling SourceSegmentName and NextSegmentName...';

    -- Step 1: Backfill SourceSegmentName from SegmentId
    UPDATE t
    SET t.SourceSegmentName = s.SegmentName
    FROM ivr.seg_SegmentTransition t
    INNER JOIN ivr.seg_Segment s ON t.SegmentId = s.SegmentId
    WHERE t.SourceSegmentName IS NULL;

    PRINT '  ✅ SourceSegmentName backfilled';

    -- Step 2: Backfill NextSegmentName from NextSegmentId
    UPDATE t
    SET t.NextSegmentName = s.SegmentName
    FROM ivr.seg_SegmentTransition t
    INNER JOIN ivr.seg_Segment s ON t.NextSegmentId = s.SegmentId
    WHERE t.NextSegmentId IS NOT NULL
      AND t.NextSegmentName IS NULL;

    PRINT '  ✅ NextSegmentName backfilled';

    -- Step 3: Backfill TransitionOrder (0-indexed, ordered by ResultName)
    PRINT '🔄 Backfilling TransitionOrder...';

    WITH OrderedTransitions AS (
        SELECT
            SegmentTransitionId,
            ROW_NUMBER() OVER (
                PARTITION BY SegmentId
                ORDER BY ResultName
            ) - 1 AS NewOrder
        FROM ivr.seg_SegmentTransition
    )
    UPDATE st
    SET TransitionOrder = ot.NewOrder
    FROM [ivr].[seg_SegmentTransition] st
    INNER JOIN OrderedTransitions ot ON st.SegmentTransitionId = ot.SegmentTransitionId
    WHERE st.TransitionOrder IS NULL;

    PRINT '  ✅ TransitionOrder backfilled';

    -- Step 4: Backfill ConfigOrder (0-indexed, ordered by KeyName)
    PRINT '🔄 Backfilling ConfigOrder...';

    WITH OrderedConfigs AS (
        SELECT
            k.DicSegmentTypeId,
            k.DicKeyId,
            k.SegmentId,
            ROW_NUMBER() OVER (
                PARTITION BY k.SegmentId
                ORDER BY dk.KeyName
            ) - 1 AS NewOrder
        FROM ivr.seg_Key k
        INNER JOIN ivr.seg_Dic_Key dk ON k.DicKeyId = dk.DicKeyId
    )
    UPDATE k
    SET ConfigOrder = oc.NewOrder
    FROM ivr.seg_Key k
    INNER JOIN OrderedConfigs oc
        ON k.DicSegmentTypeId = oc.DicSegmentTypeId
        AND k.DicKeyId = oc.DicKeyId
        AND k.SegmentId = oc.SegmentId
    WHERE k.ConfigOrder IS NULL;

    PRINT '  ✅ ConfigOrder backfilled';

    -- Step 5: Validation
    PRINT '🔍 Running validation checks...';

    DECLARE @MissingSourceNames INT;
    DECLARE @MissingNextNames INT;
    DECLARE @MissingTransitionOrders INT;
    DECLARE @MissingConfigOrders INT;

    SELECT @MissingSourceNames = COUNT(*)
    FROM [ivr].[seg_SegmentTransition]
    WHERE SourceSegmentName IS NULL;

    SELECT @MissingNextNames = COUNT(*)
    FROM ivr.seg_SegmentTransition
    WHERE NextSegmentId IS NOT NULL
      AND NextSegmentName IS NULL;

    SELECT @MissingTransitionOrders = COUNT(*)
    FROM [ivr].[seg_SegmentTransition]
    WHERE TransitionOrder IS NULL;

    SELECT @MissingConfigOrders = COUNT(*)
    FROM ivr.seg_Key
    WHERE ConfigOrder IS NULL;

    IF @MissingSourceNames > 0
    BEGIN
        RAISERROR('Validation failed: %d transitions missing SourceSegmentName', 16, 1, @MissingSourceNames);
    END

    IF @MissingNextNames > 0
    BEGIN
        RAISERROR('Validation failed: %d transitions missing NextSegmentName', 16, 1, @MissingNextNames);
    END

    IF @MissingTransitionOrders > 0
    BEGIN
        RAISERROR('Validation failed: %d transitions missing TransitionOrder', 16, 1, @MissingTransitionOrders);
    END

    IF @MissingConfigOrders > 0
    BEGIN
        RAISERROR('Validation failed: %d keys missing ConfigOrder', 16, 1, @MissingConfigOrders);
    END

    PRINT '  ✅ All validations passed';

    COMMIT TRAN;

    PRINT '';
    PRINT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    PRINT '✅ Backfill completed successfully';
    PRINT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
