-- =====================================================================
-- Seed: Segments
-- File: 030_seed_segments.sql
-- Purpose: Seed seg_Segment table with segment definitions for EEBL-ENERGYLINE-MAIN flow
-- Dependencies: 004_seed_dictionaries_segment_types.sql
-- Records: 32 segments
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables for segment type IDs
    DECLARE @SegmentTypeLanguage INT;
    DECLARE @SegmentTypeScheduler INT;
    DECLARE @SegmentTypeIdentification INT;
    DECLARE @SegmentTypeIntent INT;
    DECLARE @SegmentTypeRouting INT;
    DECLARE @SegmentTypeMessage INT;
    DECLARE @SegmentTypeMatrix INT;
    DECLARE @SegmentTypeApi INT;
    DECLARE @SegmentTypeTransfer INT;
    DECLARE @SegmentTypeDisconnect INT;

    -- Get segment type IDs
    SELECT @SegmentTypeLanguage = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'language';
    SELECT @SegmentTypeScheduler = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'scheduler';
    SELECT @SegmentTypeIdentification = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'identification';
    SELECT @SegmentTypeIntent = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'intent';
    SELECT @SegmentTypeRouting = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'routing';
    SELECT @SegmentTypeMessage = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'message';
    SELECT @SegmentTypeMatrix = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'matrix';
    SELECT @SegmentTypeApi = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'api';
    SELECT @SegmentTypeTransfer = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'transfer';
    SELECT @SegmentTypeDisconnect = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'disconnect';

    -- Seed segments (NULL changeSetId = published/active segments)
    MERGE [ivr].[seg_Segment] AS target
    USING (
        -- EEBL-ENERGYLINE-MAIN segments (with SegmentOrder and Hooks)
        SELECT NEWID() AS SegmentId, 'EEBL-ENERGYLINE-MAIN' AS RoutingId, 'get_language' AS SegmentName, @SegmentTypeLanguage AS DicSegmentTypeId, 'Language Selection' AS DisplayName, NULL AS ChangeSetId, 1 AS SegmentOrder, NULL AS Hooks
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'check_scheduler', @SegmentTypeScheduler, 'Business Hours Check', NULL, 2, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'identification', @SegmentTypeIdentification, 'Customer Identification', NULL, 3, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'get_intent', @SegmentTypeIntent, 'Get Customer Intent', NULL, 4, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'general_event', @SegmentTypeRouting, 'General Customer Event Check', NULL, 5, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'customer_event', @SegmentTypeMessage, 'Customer Event Message', NULL, 6, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'intent_msg_001', @SegmentTypeMessage, 'Intent Message 001', NULL, 7, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'intent_msg_002', @SegmentTypeMessage, 'Intent Message 002', NULL, 8, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'billing_matrix', @SegmentTypeMatrix, 'Billing Matrix Routing', NULL, 9, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'move_matrix', @SegmentTypeMatrix, 'Move Matrix Routing', NULL, 10, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'sales_matrix', @SegmentTypeMatrix, 'Sales Matrix Routing', NULL, 11, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'home_matrix', @SegmentTypeMatrix, 'Home Matrix Routing', NULL, 12, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'other_matrix', @SegmentTypeMatrix, 'Other Matrix Routing', NULL, 13, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'ssvim_selfservice', @SegmentTypeApi, 'Self Service Invoice Move', NULL, 14, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'ssvsmi_selfservice', @SegmentTypeApi, 'Self Service Invoice', NULL, 15, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'resi_billing', @SegmentTypeRouting, 'Residential Billing Transfer', NULL, 16, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'resi_move', @SegmentTypeRouting, 'Residential Move Transfer', NULL, 17, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'resi_sales', @SegmentTypeRouting, 'Residential Sales Transfer', NULL, 18, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'resi_home', @SegmentTypeRouting, 'Residential Home Transfer', NULL, 19, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'resi_other', @SegmentTypeRouting, 'Residential Other Transfer', NULL, 20, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'prof_billing', @SegmentTypeRouting, 'Professional Billing Transfer', NULL, 21, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'prof_prof', @SegmentTypeRouting, 'Professional Transfer', NULL, 22, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'prof_home', @SegmentTypeRouting, 'Professional Home Transfer', NULL, 23, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'retention_billing', @SegmentTypeRouting, 'Retention Billing Transfer', NULL, 24, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'retention_home', @SegmentTypeRouting, 'Retention Home Transfer', NULL, 25, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'retention_sales', @SegmentTypeRouting, 'Retention Sales Transfer', NULL, 26, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'retention_other', @SegmentTypeRouting, 'Retention Other Transfer', NULL, 27, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'enterprise_transfer', @SegmentTypeRouting, 'Enterprise Transfer', NULL, 28, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'bo_recovery_lr', @SegmentTypeRouting, 'Back Office Recovery Legal Recovery', NULL, 29, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'redirect_energyline', @SegmentTypeRouting, 'Redirect to Energyline', NULL, 30, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'transfer', @SegmentTypeTransfer, 'Transfer Call', NULL, 31, NULL
        UNION ALL
        SELECT NEWID(), 'EEBL-ENERGYLINE-MAIN', 'disconnect', @SegmentTypeDisconnect, 'Disconnect Call', NULL, 32, NULL
    ) AS source (SegmentId, RoutingId, SegmentName, DicSegmentTypeId, DisplayName, ChangeSetId, SegmentOrder, Hooks)
    ON target.RoutingId = source.RoutingId AND target.SegmentName = source.SegmentName AND (target.ChangeSetId IS NULL AND source.ChangeSetId IS NULL OR target.ChangeSetId = source.ChangeSetId)
    WHEN MATCHED THEN
        UPDATE SET
            DicSegmentTypeId = source.DicSegmentTypeId,
            DisplayName = source.DisplayName,
            SegmentOrder = source.SegmentOrder,
            Hooks = source.Hooks,
            DateUpdated = CURRENT_TIMESTAMP
    WHEN NOT MATCHED THEN
        INSERT (SegmentId, RoutingId, SegmentName, DicSegmentTypeId, DisplayName, ChangeSetId, SegmentOrder, Hooks, IsActive, DateCreated, DateUpdated)
        VALUES (source.SegmentId, source.RoutingId, source.SegmentName, source.DicSegmentTypeId, source.DisplayName, source.ChangeSetId, source.SegmentOrder, source.Hooks, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    COMMIT TRAN;

    PRINT '✅ Segments seeded successfully (32 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
