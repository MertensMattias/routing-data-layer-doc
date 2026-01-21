-- =====================================================================
-- Seed: Dictionary - Segment Types
-- File: 004_seed_dictionaries_segment_types.sql
-- Purpose: Seed seg_Dic_SegmentType table with segment type definitions
-- Dependencies: None
-- Records: 11 segment types
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Seed segment types
    MERGE [ivr].[seg_Dic_SegmentType] AS target
    USING (
        SELECT 'language' AS SegmentTypeName, 'Language' AS DisplayName, 'Language selection segment' AS Description, 'interactive' AS Category, 0 AS IsTerminal, NULL AS Hooks, NULL AS HooksSchema
        UNION ALL
        SELECT 'scheduler', 'Scheduler', 'Checks business hours and availability', 'scheduling', 0, NULL, NULL
        UNION ALL
        SELECT 'identification', 'Identification', 'Customer identification segment', 'interactive', 0, NULL, NULL
        UNION ALL
        SELECT 'intent', 'Intent', 'Intent detection segment', 'interactive', 0, NULL, NULL
        UNION ALL
        SELECT 'routing', 'Routing', 'Base routing segment for call flow navigation', 'system', 0, NULL, NULL
        UNION ALL
        SELECT 'message', 'Message', 'Plays a message to the caller', 'interactive', 0, NULL, NULL
        UNION ALL
        SELECT 'matrix', 'Matrix', 'Matrix routing segment', 'routing', 0, NULL, NULL
        UNION ALL
        SELECT 'api', 'API', 'API integration segment', 'api', 0, NULL, NULL
        UNION ALL
        SELECT 'transfer', 'Transfer', 'Transfers call to destination', 'terminal', 1, NULL, NULL
        UNION ALL
        SELECT 'disconnect', 'Disconnect', 'Terminates the call', 'terminal', 1, NULL, NULL
    ) AS source (SegmentTypeName, DisplayName, Description, Category, IsTerminal, Hooks, HooksSchema)
    ON target.SegmentTypeName = source.SegmentTypeName
    WHEN MATCHED THEN
        UPDATE SET
            DisplayName = source.DisplayName,
            Description = source.Description,
            Category = source.Category,
            IsTerminal = source.IsTerminal,
            Hooks = source.Hooks,
            HooksSchema = source.HooksSchema
    WHEN NOT MATCHED THEN
        INSERT (SegmentTypeName, DisplayName, Description, Category, IsTerminal, Hooks, HooksSchema, IsActive)
        VALUES (source.SegmentTypeName, source.DisplayName, source.Description, source.Category, source.IsTerminal, source.Hooks, source.HooksSchema, 1);

    COMMIT TRAN;

    PRINT '✅ Segment types seeded successfully (10 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
