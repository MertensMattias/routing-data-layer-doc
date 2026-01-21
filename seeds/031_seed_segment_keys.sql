-- =====================================================================
-- Seed: Segment Keys (Configurations)
-- File: 031_seed_segment_keys.sql
-- Purpose: Seed seg_Key table with configuration values for segments
-- Dependencies: 030_seed_segments.sql, 006_seed_dictionaries_segment_keys.sql
-- Records: ~20 segment key configurations
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables for segment type IDs
    DECLARE @SegmentTypeLanguage INT;
    DECLARE @SegmentTypeScheduler INT;
    DECLARE @SegmentTypeIntent INT;
    DECLARE @SegmentTypeMessage INT;
    DECLARE @SegmentTypeMatrix INT;
    DECLARE @SegmentTypeApi INT;

    -- Get segment type IDs
    SELECT @SegmentTypeLanguage = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'language';
    SELECT @SegmentTypeScheduler = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'scheduler';
    SELECT @SegmentTypeIntent = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'intent';
    SELECT @SegmentTypeMessage = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'message';
    SELECT @SegmentTypeMatrix = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'matrix';
    SELECT @SegmentTypeApi = DicSegmentTypeId FROM [ivr].[seg_Dic_SegmentType] WHERE SegmentTypeName = 'api';

    -- Declare variables for dic key IDs
    DECLARE @KeyLanguageMessageKey INT;
    DECLARE @KeyLanguageMaxAttempts INT;
    DECLARE @KeyLanguageTimeout INT;
    DECLARE @KeyLanguageOptions INT;
    DECLARE @KeySchedulerSchedulerId INT;
    DECLARE @KeyIntentMessageKey INT;
    DECLARE @KeyMessageMessageKey INT;
    DECLARE @KeyMatrixCustomerType INT;
    DECLARE @KeyMatrixStatus INT;
    DECLARE @KeyApiServiceId INT;
    DECLARE @KeyApiUseOnlyOnce INT;
    DECLARE @KeyApiCheckEligibility INT;

    -- Get dic key IDs
    SELECT @KeyLanguageMessageKey = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeLanguage AND KeyName = 'messageKey';
    SELECT @KeyLanguageMaxAttempts = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeLanguage AND KeyName = 'maxAttempts';
    SELECT @KeyLanguageTimeout = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeLanguage AND KeyName = 'timeout';
    SELECT @KeyLanguageOptions = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeLanguage AND KeyName = 'options';
    SELECT @KeySchedulerSchedulerId = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeScheduler AND KeyName = 'schedulerId';
    SELECT @KeyIntentMessageKey = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeIntent AND KeyName = 'messageKey';
    SELECT @KeyMessageMessageKey = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeMessage AND KeyName = 'messageKey';
    SELECT @KeyMatrixCustomerType = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeMatrix AND KeyName = 'customerType';
    SELECT @KeyMatrixStatus = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeMatrix AND KeyName = 'status';
    SELECT @KeyApiServiceId = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeApi AND KeyName = 'serviceId';
    SELECT @KeyApiUseOnlyOnce = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeApi AND KeyName = 'useOnlyOnce';
    SELECT @KeyApiCheckEligibility = DicKeyId FROM [ivr].[seg_Dic_Key] WHERE DicSegmentTypeId = @SegmentTypeApi AND KeyName = 'checkEligibility';

    -- Declare variables for segment IDs
    DECLARE @SegmentGetLanguage UNIQUEIDENTIFIER;
    DECLARE @SegmentCheckScheduler UNIQUEIDENTIFIER;
    DECLARE @SegmentGetIntent UNIQUEIDENTIFIER;
    DECLARE @SegmentCustomerEvent UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg001 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg002 UNIQUEIDENTIFIER;
    DECLARE @SegmentBillingMatrix UNIQUEIDENTIFIER;
    DECLARE @SegmentMoveMatrix UNIQUEIDENTIFIER;
    DECLARE @SegmentSalesMatrix UNIQUEIDENTIFIER;
    DECLARE @SegmentHomeMatrix UNIQUEIDENTIFIER;
    DECLARE @SegmentOtherMatrix UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvimSelfservice UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvsmiSelfservice UNIQUEIDENTIFIER;

    -- Get segment IDs
    SELECT @SegmentGetLanguage = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'get_language' AND ChangeSetId IS NULL;
    SELECT @SegmentCheckScheduler = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'check_scheduler' AND ChangeSetId IS NULL;
    SELECT @SegmentGetIntent = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'get_intent' AND ChangeSetId IS NULL;
    SELECT @SegmentCustomerEvent = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'customer_event' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg001 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'intent_msg_001' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg002 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'intent_msg_002' AND ChangeSetId IS NULL;
    SELECT @SegmentBillingMatrix = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'billing_matrix' AND ChangeSetId IS NULL;
    SELECT @SegmentMoveMatrix = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'move_matrix' AND ChangeSetId IS NULL;
    SELECT @SegmentSalesMatrix = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'sales_matrix' AND ChangeSetId IS NULL;
    SELECT @SegmentHomeMatrix = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'home_matrix' AND ChangeSetId IS NULL;
    SELECT @SegmentOtherMatrix = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'other_matrix' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvimSelfservice = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'ssvim_selfservice' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvsmiSelfservice = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'ssvsmi_selfservice' AND ChangeSetId IS NULL;

    -- Seed segment keys (composite PK: DicSegmentTypeId, DicKeyId, SegmentId)
    MERGE [ivr].[seg_Key] AS target
    USING (
        -- get_language (language type)
        SELECT @SegmentTypeLanguage AS DicSegmentTypeId, @KeyLanguageMessageKey AS DicKeyId, @SegmentGetLanguage AS SegmentId, 'LANG_PROMPT' AS Value, 1 AS IsDisplayed, 1 AS IsEditable
        UNION ALL
        SELECT @SegmentTypeLanguage, @KeyLanguageMaxAttempts, @SegmentGetLanguage, '3', 1, 1
        UNION ALL
        SELECT @SegmentTypeLanguage, @KeyLanguageTimeout, @SegmentGetLanguage, '5000', 1, 1
        UNION ALL
        SELECT @SegmentTypeLanguage, @KeyLanguageOptions, @SegmentGetLanguage, '["nl-BE","fr-BE","en-GB","de-BE"]', 1, 1
        -- check_scheduler (scheduler type)
        UNION ALL
        SELECT @SegmentTypeScheduler, @KeySchedulerSchedulerId, @SegmentCheckScheduler, '4077', 1, 1
        -- get_intent (intent type)
        UNION ALL
        SELECT @SegmentTypeIntent, @KeyIntentMessageKey, @SegmentGetIntent, 'INTENT_PROMPT', 1, 1
        -- customer_event (message type)
        UNION ALL
        SELECT @SegmentTypeMessage, @KeyMessageMessageKey, @SegmentCustomerEvent, 'CUSTOMER_EVENT_MSG', 1, 1
        -- intent_msg_001 (message type)
        UNION ALL
        SELECT @SegmentTypeMessage, @KeyMessageMessageKey, @SegmentIntentMsg001, 'INTENT_MSG_001', 1, 1
        -- intent_msg_002 (message type)
        UNION ALL
        SELECT @SegmentTypeMessage, @KeyMessageMessageKey, @SegmentIntentMsg002, 'INTENT_MSG_002', 1, 1
        -- billing_matrix (matrix type)
        UNION ALL
        SELECT @SegmentTypeMatrix, @KeyMatrixCustomerType, @SegmentBillingMatrix, 'resi|prof', 1, 1
        UNION ALL
        SELECT @SegmentTypeMatrix, @KeyMatrixStatus, @SegmentBillingMatrix, 'not_identified|standard|retention|legal_recovery', 1, 1
        -- move_matrix (matrix type)
        UNION ALL
        SELECT @SegmentTypeMatrix, @KeyMatrixCustomerType, @SegmentMoveMatrix, 'resi|prof', 1, 1
        UNION ALL
        SELECT @SegmentTypeMatrix, @KeyMatrixStatus, @SegmentMoveMatrix, 'not_identified|standard|retention|legal_recovery', 1, 1
        -- sales_matrix (matrix type)
        UNION ALL
        SELECT @SegmentTypeMatrix, @KeyMatrixCustomerType, @SegmentSalesMatrix, 'resi|prof', 1, 1
        UNION ALL
        SELECT @SegmentTypeMatrix, @KeyMatrixStatus, @SegmentSalesMatrix, 'not_identified|standard|retention|legal_recovery', 1, 1
        -- home_matrix (matrix type)
        UNION ALL
        SELECT @SegmentTypeMatrix, @KeyMatrixCustomerType, @SegmentHomeMatrix, 'resi|prof', 1, 1
        UNION ALL
        SELECT @SegmentTypeMatrix, @KeyMatrixStatus, @SegmentHomeMatrix, 'not_identified|standard|retention|legal_recovery', 1, 1
        -- other_matrix (matrix type)
        UNION ALL
        SELECT @SegmentTypeMatrix, @KeyMatrixCustomerType, @SegmentOtherMatrix, 'resi|prof', 1, 1
        UNION ALL
        SELECT @SegmentTypeMatrix, @KeyMatrixStatus, @SegmentOtherMatrix, 'not_identified|standard|retention|legal_recovery', 1, 1
        -- ssvim_selfservice (api type)
        UNION ALL
        SELECT @SegmentTypeApi, @KeyApiServiceId, @SegmentSsvimSelfservice, 'SSVIM', 1, 1
        UNION ALL
        SELECT @SegmentTypeApi, @KeyApiUseOnlyOnce, @SegmentSsvimSelfservice, 'true', 1, 1
        UNION ALL
        SELECT @SegmentTypeApi, @KeyApiCheckEligibility, @SegmentSsvimSelfservice, 'true', 1, 1
        -- ssvsmi_selfservice (api type)
        UNION ALL
        SELECT @SegmentTypeApi, @KeyApiServiceId, @SegmentSsvsmiSelfservice, 'SSVSMI', 1, 1
        UNION ALL
        SELECT @SegmentTypeApi, @KeyApiUseOnlyOnce, @SegmentSsvsmiSelfservice, 'true', 1, 1
        UNION ALL
        SELECT @SegmentTypeApi, @KeyApiCheckEligibility, @SegmentSsvsmiSelfservice, 'true', 1, 1
    ) AS source (DicSegmentTypeId, DicKeyId, SegmentId, Value, IsDisplayed, IsEditable)
    ON target.DicSegmentTypeId = source.DicSegmentTypeId AND target.DicKeyId = source.DicKeyId AND target.SegmentId = source.SegmentId
    WHEN MATCHED THEN
        UPDATE SET
            Value = source.Value,
            IsDisplayed = source.IsDisplayed,
            IsEditable = source.IsEditable
    WHEN NOT MATCHED THEN
        INSERT (DicSegmentTypeId, DicKeyId, SegmentId, Value, IsDisplayed, IsEditable)
        VALUES (source.DicSegmentTypeId, source.DicKeyId, source.SegmentId, source.Value, source.IsDisplayed, source.IsEditable);

    COMMIT TRAN;

    PRINT '✅ Segment keys seeded successfully (25 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
