-- =====================================================================
-- Seed: Segments - ENGIE ENERGYLINE
-- File: 034_seed_segments_engie_energyline.sql
-- Purpose: Seed seg_Segment table with segment definitions from segmentDic_BASE
-- Dependencies: 004_seed_dictionaries_segment_types.sql
-- Records: ~76 segments
-- Re-run safe: Yes (uses MERGE)
-- Source: import_segmentDic.js segmentDic_BASE Map
-- Note: All segments belong to routingId 'ENGIE-ENERGYLINE'
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables for segment type IDs
    DECLARE @SegmentTypeRouting INT;
    DECLARE @SegmentTypeScheduler INT;
    DECLARE @SegmentTypeIntent INT;
    DECLARE @SegmentTypeMessage INT;
    DECLARE @SegmentTypeApi INT;
    DECLARE @SegmentTypeMatrix INT;
    DECLARE @SegmentTypeTransfer INT;
    DECLARE @SegmentTypeDisconnect INT;

    -- Get segment type IDs
    SELECT @SegmentTypeRouting = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'routing';
    SELECT @SegmentTypeScheduler = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'scheduler';
    SELECT @SegmentTypeIntent = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'intent';
    SELECT @SegmentTypeMessage = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'message';
    SELECT @SegmentTypeApi = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'api';
    SELECT @SegmentTypeMatrix = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'matrix';
    SELECT @SegmentTypeTransfer = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'transfer';
    SELECT @SegmentTypeDisconnect = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'disconnect';

    -- Seed segments (NULL changeSetId = published/active segments)
    -- Segment types mapped: routing→routing, scheduler→scheduler, intent_detection→intent, kb_message→message, selfservice→api, matrix→matrix, event→api, termination→transfer/disconnect
    MERGE [ivr].[seg_Segment] AS target
    USING (
        -- Base flow segments (order 1-8)
        SELECT NEWID() AS SegmentId, 'ENGIE-ENERGYLINE' AS RoutingId, 'GET_LANGUAGE' AS SegmentName, @SegmentTypeRouting AS DicSegmentTypeId, 'Get Language' AS DisplayName, NULL AS ChangeSetId, 1 AS SegmentOrder, NULL AS Hooks
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'CHECK_SCHEDULER', @SegmentTypeScheduler, 'Check Scheduler', NULL, 2, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'IDENTIFICATION', @SegmentTypeRouting, 'Identification', NULL, 3, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'GET_INTENT', @SegmentTypeIntent, 'Get Intent', NULL, 4, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'NEW_INTENT', @SegmentTypeIntent, 'New Intent', NULL, 5, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'OTHER_INTENT', @SegmentTypeIntent, 'Other Intent', NULL, 6, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'GENERAL_EVENT', @SegmentTypeApi, 'General Event', NULL, 7, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'CUSTOMER_EVENT', @SegmentTypeMessage, 'Customer Event', NULL, 8, NULL
        -- Intent message segments (order 9-28)
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_SSVNBD', @SegmentTypeApi, 'Intent Message SSVNBD', NULL, 9, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_001', @SegmentTypeMessage, 'Intent Message 001', NULL, 10, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_002', @SegmentTypeMessage, 'Intent Message 002', NULL, 11, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_003', @SegmentTypeMessage, 'Intent Message 003', NULL, 12, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_004', @SegmentTypeMessage, 'Intent Message 004', NULL, 13, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_005', @SegmentTypeMessage, 'Intent Message 005', NULL, 14, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_006', @SegmentTypeMessage, 'Intent Message 006', NULL, 15, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_007', @SegmentTypeMessage, 'Intent Message 007', NULL, 16, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_008', @SegmentTypeMessage, 'Intent Message 008', NULL, 17, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_009', @SegmentTypeMessage, 'Intent Message 009', NULL, 18, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_010', @SegmentTypeMessage, 'Intent Message 010', NULL, 19, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_011', @SegmentTypeMessage, 'Intent Message 011', NULL, 20, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_012', @SegmentTypeMessage, 'Intent Message 012', NULL, 21, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_013', @SegmentTypeMessage, 'Intent Message 013', NULL, 22, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_014', @SegmentTypeMessage, 'Intent Message 014', NULL, 23, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_015', @SegmentTypeMessage, 'Intent Message 015', NULL, 24, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_016', @SegmentTypeMessage, 'Intent Message 016', NULL, 25, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_017', @SegmentTypeMessage, 'Intent Message 017', NULL, 26, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_018', @SegmentTypeMessage, 'Intent Message 018', NULL, 27, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_019', @SegmentTypeMessage, 'Intent Message 019', NULL, 28, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTENT_MSG_019_BIS', @SegmentTypeMessage, 'Intent Message 019 Bis', NULL, 29, NULL
        -- Self-service segments (order 30-46)
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVIM', @SegmentTypeApi, 'Self Service Invoice Move', NULL, 30, '{"cdbDicId":"8300","cdbLog":"cdbLog1","cdbData":{"cdbLog1":"8300","cdbLog2":"8301","cdbLog3":"8302","cdbLog4":"8303","cdbLog5":"8304","cdbLog6":"8305","cdbLog7":"8306","cdbLog8":"8307","cdbLog9":"8308","cdbLog10":"8309","cdbLog11":"8310","cdbLog12":"8311"},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true}}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVAA', @SegmentTypeApi, 'Self Service Adapt Amount', NULL, 31, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVAANP', @SegmentTypeApi, 'Self Service Adapt Amount Non Protocol', NULL, 32, '{"cdbDicId":"6170","cdbLog":"cdbLog1","cdbData":{"cdbLog1":"6170","cdbLog2":"6171","cdbLog3":"6172","cdbLog4":"6173","cdbLog5":"6174","cdbLog6":"6175","cdbLog7":"6176","cdbLog8":"6177","cdbLog9":"6178","cdbLog10":"6179","cdbLog11":"6180","cdbLog12":"6181","cdbLog13":"6182"},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVAAP', @SegmentTypeApi, 'Self Service Adapt Amount Protocol', NULL, 33, '{"cdbDicId":"6170","cdbLog":"cdbLog1","cdbData":{"cdbLog1":"6170","cdbLog2":"6171","cdbLog3":"6172","cdbLog4":"6173","cdbLog5":"6174","cdbLog6":"6175","cdbLog7":"6176","cdbLog8":"6177","cdbLog9":"6178","cdbLog10":"6179","cdbLog11":"6180","cdbLog12":"6181"},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVAPA', @SegmentTypeApi, 'Self Service Adapt Proposed Amount', NULL, 34, '{"cdbDicId":"6170","cdbLog":"cdbLog1","cdbData":{"cdbLog1":"6170","cdbLog2":"6171","cdbLog3":"6172","cdbLog4":"6173","cdbLog5":"6174","cdbLog6":"6175","cdbLog7":"6176","cdbLog8":"6177","cdbLog9":"6178","cdbLog10":"6179","cdbLog11":"6180","cdbLog12":"6181","cdbLog13":"6182"},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVSMI', @SegmentTypeApi, 'Self Service Invoice', NULL, 35, '{"cdbDicId":"8200","cdbLog":"cdbLog1","cdbData":{"cdbLog1":"8200","cdbLog2":"8201","cdbLog4":"8202","cdbLog5":"8203","cdbLog6":"8204"},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVNBD', @SegmentTypeApi, 'Self Service Next Billing Date', NULL, 36, '{"cdbDicId":"8408","cdbLog":"cdbLog1","cdbData":{"cdbLog1":"8408","cdbLog2":"8401","cdbLog3":"8402","cdbLog4":"8403","cdbLog5":"8404","cdbLog6":"8405","cdbLog7":"8406","cdbLog8":"8407","cdbLog9":"8400"},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVMD', @SegmentTypeApi, 'Self Service Modify Data', NULL, 37, '{"cdbDicId":"8500","cdbLog":"cdbLog1","cdbData":{"cdbLog1":"8500","cdbLog2":"8501","cdbLog3":"8502","cdbLog4":"8503","cdbLog5":"8504","cdbLog6":"8505","cdbLog7":"8506","cdbLog8":"8507"},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVSST', @SegmentTypeApi, 'Self Service Social Tariff', NULL, 38, '{"cdbDicId":"8100","cdbLog":"cdbLog1","cdbData":{"cdbLog1":"8100","cdbLog2":"8101","cdbLog3":"8102","cdbLog4":"8103","cdbLog5":"8104","cdbLog6":"8105","cdbLog7":"8106","cdbLog8":"8107","cdbLog9":"8108","cdbLog10":"8109","cdbLog11":"8110"},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVMEI', @SegmentTypeApi, 'Self Service Modify Email Invoice', NULL, 39, '{"cdbDicId":"8600","cdbLog":"cdbLog1","cdbData":{"cdbLog1":"8600","cdbLog2":"8601","cdbLog3":"8602","cdbLog4":"8603","cdbLog5":"8604","cdbLog6":"8605","cdbLog7":"8606","cdbLog8":"8607","cdbLog9":"8608","cdbLog10":"8609","cdbLog11":"8610","cdbLog12":"8611","cdbLog13":"8612","cdbLog14":"8613","cdbLog15":"8614"},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVIWAR', @SegmentTypeApi, 'Self Service Invoice With Account Refund', NULL, 40, '{"cdbDicId":"8800","cdbLog":"cdbLog1","cdbData":{"cdbLog1":"8800","cdbLog2":"8801","cdbLog3":"8802","cdbLog4":"8803","cdbLog5":"8804","cdbLog6":"8805","cdbLog7":"8806","cdbLog8":"8807","cdbLog9":"8808","cdbLog10":"8809","cdbLog11":"8810","cdbLog12":"8811","cdbLog13":"8812","cdbLog14":"8813","cdbLog15":"8814","cdbLog16":"8815","cdbLog17":"8816","cdbLog18":"8817","cdbLog19":"8818","cdbLog20":"8819","cdbLog21":"8820","cdbLog22":"8821","cdbLog23":"8822","cdbLog24":"8823","cdbLog25":"8824","cdbLog26":"8825","cdbLog27":"8826","cdbLogEX":"8827"},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVIWPD', @SegmentTypeApi, 'Self Service Invoice With Payment Details', NULL, 41, '{"cdbDicId":"","cdbLog":"cdbLog1","cdbData":{},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVDD', @SegmentTypeApi, 'Self Service Direct Debit', NULL, 42, '{"cdbDicId":"","cdbLog":"cdbLog1","cdbData":{},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVDUP', @SegmentTypeApi, 'Self Service Duplicate', NULL, 43, '{"cdbDicId":"","cdbLog":"cdbLog1","cdbData":{},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVWMD', @SegmentTypeApi, 'Self Service With Payment Reminder', NULL, 44, '{"cdbDicId":"","cdbLog":"cdbLog1","cdbData":{},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SSVHM', @SegmentTypeApi, 'Self Service Home Maintenance', NULL, 45, '{"cdbDicId":"","cdbLog":"cdbLog1","cdbData":{},"segmentConfig":{"useOnlyOnce":true,"checkEligibility":true},"cdbTimeout":15000}'
        -- Matrix segments (order 46-50)
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'BILLING', @SegmentTypeMatrix, 'Billing Matrix', NULL, 46, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'MOVE', @SegmentTypeMatrix, 'Move Matrix', NULL, 47, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'SALES', @SegmentTypeMatrix, 'Sales Matrix', NULL, 48, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'ENGIE_HOME', @SegmentTypeMatrix, 'Home Matrix', NULL, 49, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'OTHER', @SegmentTypeMatrix, 'Other Matrix', NULL, 50, NULL
        -- Routing segments - extension targets (order 51-71)
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RESI_SHORT_1_BILLING', @SegmentTypeRouting, 'Residential Short 1 Billing', NULL, 51, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RESI_SHORT_2_BILLING', @SegmentTypeRouting, 'Residential Short 2 Billing', NULL, 52, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RESI_BILLING', @SegmentTypeRouting, 'Residential Billing', NULL, 53, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RESI_MOVE', @SegmentTypeRouting, 'Residential Move', NULL, 54, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RESI_SALES', @SegmentTypeRouting, 'Residential Sales', NULL, 55, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RESI_HOME', @SegmentTypeRouting, 'Residential Home', NULL, 56, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RESI_OTHER', @SegmentTypeRouting, 'Residential Other', NULL, 57, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'PROF_BILLING', @SegmentTypeRouting, 'Professional Billing', NULL, 58, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'PROF_PROF', @SegmentTypeRouting, 'Professional', NULL, 59, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'PROF_HOME', @SegmentTypeRouting, 'Professional Home', NULL, 60, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RETENTION_BILLING', @SegmentTypeRouting, 'Retention Billing', NULL, 61, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RETENTION_HOME', @SegmentTypeRouting, 'Retention Home', NULL, 62, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RETENTION_MOVE', @SegmentTypeRouting, 'Retention Move', NULL, 63, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RETENTION_OTHER', @SegmentTypeRouting, 'Retention Other', NULL, 64, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'RETENTION_SALES', @SegmentTypeRouting, 'Retention Sales', NULL, 65, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'BO_OVF_DUNNING', @SegmentTypeRouting, 'Back Office Overflow Dunning', NULL, 66, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'BO_RECOVERY_LR', @SegmentTypeRouting, 'Back Office Recovery Legal Recovery', NULL, 67, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'ENTERPRISE', @SegmentTypeRouting, 'Enterprise', NULL, 68, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'REDIRECT_ENERGYLINE', @SegmentTypeRouting, 'Redirect Energyline', NULL, 69, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'REDIRECT_PROF', @SegmentTypeRouting, 'Redirect Professional', NULL, 70, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'ERROR_DEFAULT_ROUTE', @SegmentTypeRouting, 'Error Default Route', NULL, 71, NULL
        -- Terminal segments (order 72-75)
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'TRANSFER', @SegmentTypeTransfer, 'Transfer', NULL, 72, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'REDIRECT', @SegmentTypeTransfer, 'Redirect', NULL, 73, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'DISCONNECT', @SegmentTypeDisconnect, 'Disconnect', NULL, 74, NULL
        UNION ALL SELECT NEWID(), 'ENGIE-ENERGYLINE', 'INTERRUPTED', @SegmentTypeDisconnect, 'Interrupted', NULL, 75, NULL
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

    PRINT '✅ ENGIE ENERGYLINE segments seeded successfully (~76 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
