-- =====================================================================
-- Seed: Segment Transitions
-- File: 032_seed_segment_transitions.sql
-- Purpose: Seed seg_SegmentTransition table with transitions between segments
-- Dependencies: 030_seed_segments.sql
-- Records: ~215 transitions (all transitions from EEBL-ENERGYLINE-MAIN flow)
-- Re-run safe: Yes (uses MERGE)
-- Source: Generated from docs/design/callflow_import_export_format_full.js
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables for segment IDs (looked up dynamically)
    DECLARE @SegmentGetLanguage UNIQUEIDENTIFIER;
    DECLARE @SegmentCheckScheduler UNIQUEIDENTIFIER;
    DECLARE @SegmentIdentification UNIQUEIDENTIFIER;
    DECLARE @SegmentGetIntent UNIQUEIDENTIFIER;
    DECLARE @SegmentGeneralEvent UNIQUEIDENTIFIER;
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
    DECLARE @SegmentResiBilling UNIQUEIDENTIFIER;
    DECLARE @SegmentResiMove UNIQUEIDENTIFIER;
    DECLARE @SegmentResiSales UNIQUEIDENTIFIER;
    DECLARE @SegmentResiHome UNIQUEIDENTIFIER;
    DECLARE @SegmentResiOther UNIQUEIDENTIFIER;
    DECLARE @SegmentProfBilling UNIQUEIDENTIFIER;
    DECLARE @SegmentProfProf UNIQUEIDENTIFIER;
    DECLARE @SegmentProfHome UNIQUEIDENTIFIER;
    DECLARE @SegmentRetentionBilling UNIQUEIDENTIFIER;
    DECLARE @SegmentRetentionHome UNIQUEIDENTIFIER;
    DECLARE @SegmentRetentionSales UNIQUEIDENTIFIER;
    DECLARE @SegmentRetentionOther UNIQUEIDENTIFIER;
    DECLARE @SegmentEnterpriseTransfer UNIQUEIDENTIFIER;
    DECLARE @SegmentBoRecoveryLr UNIQUEIDENTIFIER;
    DECLARE @SegmentRedirectEnergyline UNIQUEIDENTIFIER;
    DECLARE @SegmentTransfer UNIQUEIDENTIFIER;
    DECLARE @SegmentDisconnect UNIQUEIDENTIFIER;

    -- Get segment IDs dynamically
    SELECT @SegmentGetLanguage = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'get_language' AND ChangeSetId IS NULL;
    SELECT @SegmentCheckScheduler = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'check_scheduler' AND ChangeSetId IS NULL;
    SELECT @SegmentIdentification = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'identification' AND ChangeSetId IS NULL;
    SELECT @SegmentGetIntent = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'get_intent' AND ChangeSetId IS NULL;
    SELECT @SegmentGeneralEvent = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'general_event' AND ChangeSetId IS NULL;
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
    SELECT @SegmentResiBilling = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'resi_billing' AND ChangeSetId IS NULL;
    SELECT @SegmentResiMove = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'resi_move' AND ChangeSetId IS NULL;
    SELECT @SegmentResiSales = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'resi_sales' AND ChangeSetId IS NULL;
    SELECT @SegmentResiHome = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'resi_home' AND ChangeSetId IS NULL;
    SELECT @SegmentResiOther = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'resi_other' AND ChangeSetId IS NULL;
    SELECT @SegmentProfBilling = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'prof_billing' AND ChangeSetId IS NULL;
    SELECT @SegmentProfProf = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'prof_prof' AND ChangeSetId IS NULL;
    SELECT @SegmentProfHome = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'prof_home' AND ChangeSetId IS NULL;
    SELECT @SegmentRetentionBilling = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'retention_billing' AND ChangeSetId IS NULL;
    SELECT @SegmentRetentionHome = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'retention_home' AND ChangeSetId IS NULL;
    SELECT @SegmentRetentionSales = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'retention_sales' AND ChangeSetId IS NULL;
    SELECT @SegmentRetentionOther = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'retention_other' AND ChangeSetId IS NULL;
    SELECT @SegmentEnterpriseTransfer = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'enterprise_transfer' AND ChangeSetId IS NULL;
    SELECT @SegmentBoRecoveryLr = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'bo_recovery_lr' AND ChangeSetId IS NULL;
    SELECT @SegmentRedirectEnergyline = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'redirect_energyline' AND ChangeSetId IS NULL;
    SELECT @SegmentTransfer = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'transfer' AND ChangeSetId IS NULL;
    SELECT @SegmentDisconnect = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'EEBL-ENERGYLINE-MAIN' AND SegmentName = 'disconnect' AND ChangeSetId IS NULL;

    -- Validate that all segments exist
    IF @SegmentGetLanguage IS NULL OR @SegmentCheckScheduler IS NULL OR @SegmentIdentification IS NULL
    BEGIN
        RAISERROR('Required segments not found. Please run 030_seed_segments.sql first.', 16, 1);
        ROLLBACK TRAN;
        RETURN;
    END

    -- Seed segment transitions
    -- Note: Params field stores JSON strings (e.g., '{"key":"value"}')
    -- Empty params objects are stored as NULL
    -- NULL nextSegment in JSON is stored as NULL NextSegmentId
    -- Note: SourceSegmentName, NextSegmentName, and TransitionOrder are backfilled by 033_backfill_new_columns.sql
    MERGE [ivr].[seg_SegmentTransition] AS target
    USING (
        -- get_language transitions (7)
        SELECT NEWID() AS SegmentTransitionId, @SegmentGetLanguage AS SegmentId, 'EEBL-ENERGYLINE-MAIN' AS RoutingId, NULL AS ChangeSetId, NULL AS ContextKey, 'nl-BE' AS ResultName, @SegmentCheckScheduler AS NextSegmentId, NULL AS Params
        UNION ALL
        SELECT NEWID(), @SegmentGetLanguage, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentCheckScheduler, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGetLanguage, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'en-GB', @SegmentCheckScheduler, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGetLanguage, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'de-BE', @SegmentRedirectEnergyline, '{"reason":"german_support"}'
        UNION ALL
        SELECT NEWID(), @SegmentGetLanguage, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NO_MORE_TRIES', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGetLanguage, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_API', @SegmentCheckScheduler, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGetLanguage, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentCheckScheduler, NULL
        -- check_scheduler transitions (9)
        UNION ALL
        SELECT NEWID(), @SegmentCheckScheduler, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'OPEN', @SegmentIdentification, NULL
        UNION ALL
        SELECT NEWID(), @SegmentCheckScheduler, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'CLOSED', @SegmentDisconnect, '{"closedType":"regular"}'
        UNION ALL
        SELECT NEWID(), @SegmentCheckScheduler, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'CLOSEDEXCEPTION', @SegmentDisconnect, '{"closedType":"exception"}'
        UNION ALL
        SELECT NEWID(), @SegmentCheckScheduler, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'HOLIDAY', @SegmentDisconnect, '{"closedType":"holiday"}'
        UNION ALL
        SELECT NEWID(), @SegmentCheckScheduler, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'TRANSFER', @SegmentTransfer, NULL
        UNION ALL
        SELECT NEWID(), @SegmentCheckScheduler, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'EXCEPTIONAL', @SegmentIdentification, NULL
        UNION ALL
        SELECT NEWID(), @SegmentCheckScheduler, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'EMERGENCY', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentCheckScheduler, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_API', @SegmentIdentification, NULL
        UNION ALL
        SELECT NEWID(), @SegmentCheckScheduler, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentIdentification, NULL
        -- identification transitions (7)
        UNION ALL
        SELECT NEWID(), @SegmentIdentification, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'ID_ON_CLID', @SegmentGeneralEvent, '{}'
        UNION ALL
        SELECT NEWID(), @SegmentIdentification, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'ID_ON_CA', @SegmentGeneralEvent, '{}'
        UNION ALL
        SELECT NEWID(), @SegmentIdentification, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NOT_IDENTIFIED', @SegmentGetIntent, '{}'
        UNION ALL
        SELECT NEWID(), @SegmentIdentification, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_VB', @SegmentGetIntent, '{}'
        UNION ALL
        SELECT NEWID(), @SegmentIdentification, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_API', @SegmentGetIntent, '{}'
        UNION ALL
        SELECT NEWID(), @SegmentIdentification, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'OPERATOR', @SegmentOtherMatrix, '{}'
        UNION ALL
        SELECT NEWID(), @SegmentIdentification, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentGetIntent, NULL
        -- get_intent transitions (8)
        UNION ALL
        SELECT NEWID(), @SegmentGetIntent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'BILLING', @SegmentBillingMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGetIntent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'MOVE', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGetIntent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'SALES', @SegmentSalesMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGetIntent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'HOME', @SegmentHomeMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGetIntent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'OTHER', @SegmentOtherMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGetIntent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NO_INTENT', @SegmentIntentMsg001, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGetIntent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentBillingMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGetIntent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentIntentMsg001, NULL
        -- general_event transitions (12)
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NO_EVENT', @SegmentCustomerEvent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'BASIC_EMAIL', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'DIRECT_EMAIL', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'BASIC_NO_EMAIL', @SegmentCustomerEvent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'DIRECT_NO_EMAIL', @SegmentCustomerEvent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'BASIC_EMAIL_FAILURE', @SegmentCustomerEvent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'DIRECT_EMAIL_FAILURE', @SegmentCustomerEvent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'ENTERPRISE', @SegmentEnterpriseTransfer, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'SIBELGA_PROTECTED_CUSTOMER', @SegmentBoRecoveryLr, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'LRPF', @SegmentBoRecoveryLr, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentCustomerEvent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentGeneralEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentCustomerEvent, NULL
        -- customer_event transitions (7)
        UNION ALL
        SELECT NEWID(), @SegmentCustomerEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'END', @SegmentGetIntent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentCustomerEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NO_EVENT', @SegmentGetIntent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentCustomerEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentOtherMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentCustomerEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_VB', @SegmentGetIntent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentCustomerEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_API', @SegmentGetIntent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentCustomerEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'OPERATOR', @SegmentOtherMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentCustomerEvent, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentGetIntent, NULL
        -- intent_msg_001 transitions (8)
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg001, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg001, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NO_EVENT', @SegmentGetIntent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg001, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NOT_RELATED', @SegmentBillingMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg001, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'OTHER_QUESTION', @SegmentGetIntent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg001, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_VB', @SegmentBillingMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg001, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentBillingMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg001, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'OPERATOR', @SegmentBillingMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg001, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentBillingMatrix, NULL
        -- intent_msg_002 transitions (9)
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg002, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg002, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NOT_RELATED', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg002, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'MOVE_RELATED', @SegmentSsvimSelfservice, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg002, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'INVOICE_RELATED', @SegmentSsvsmiSelfservice, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg002, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'OTHER_QUESTION', @SegmentGetIntent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg002, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_VB', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg002, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg002, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'OPERATOR', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentIntentMsg002, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentMoveMatrix, NULL
        -- billing_matrix transitions (9)
        UNION ALL
        SELECT NEWID(), @SegmentBillingMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_not_identified', @SegmentResiBilling, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentBillingMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_standard', @SegmentResiBilling, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentBillingMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_retention', @SegmentRetentionBilling, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentBillingMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_legal_recovery', @SegmentBoRecoveryLr, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentBillingMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_not_identified', @SegmentProfBilling, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentBillingMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_standard', @SegmentProfBilling, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentBillingMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_retention', @SegmentRetentionBilling, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentBillingMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_legal_recovery', @SegmentBoRecoveryLr, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentBillingMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentResiBilling, NULL
        -- move_matrix transitions (9)
        UNION ALL
        SELECT NEWID(), @SegmentMoveMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_not_identified', @SegmentResiMove, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentMoveMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_standard', @SegmentResiMove, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentMoveMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_retention', @SegmentResiMove, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentMoveMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_legal_recovery', @SegmentResiMove, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentMoveMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_not_identified', @SegmentProfProf, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentMoveMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_standard', @SegmentProfProf, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentMoveMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_retention', @SegmentProfProf, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentMoveMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_legal_recovery', @SegmentProfProf, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentMoveMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentResiMove, NULL
        -- sales_matrix transitions (9)
        UNION ALL
        SELECT NEWID(), @SegmentSalesMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_not_identified', @SegmentResiSales, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentSalesMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_standard', @SegmentResiSales, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentSalesMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_retention', @SegmentRetentionSales, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentSalesMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_legal_recovery', @SegmentResiSales, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentSalesMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_not_identified', @SegmentProfProf, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentSalesMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_standard', @SegmentProfProf, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentSalesMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_retention', @SegmentRetentionSales, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentSalesMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_legal_recovery', @SegmentProfProf, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentSalesMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentResiSales, NULL
        -- home_matrix transitions (9)
        UNION ALL
        SELECT NEWID(), @SegmentHomeMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_not_identified', @SegmentResiHome, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentHomeMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_standard', @SegmentResiHome, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentHomeMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_retention', @SegmentRetentionHome, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentHomeMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_legal_recovery', @SegmentResiHome, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentHomeMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_not_identified', @SegmentProfHome, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentHomeMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_standard', @SegmentProfHome, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentHomeMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_retention', @SegmentRetentionHome, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentHomeMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_legal_recovery', @SegmentProfHome, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentHomeMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentResiHome, NULL
        -- other_matrix transitions (9)
        UNION ALL
        SELECT NEWID(), @SegmentOtherMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_not_identified', @SegmentResiOther, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentOtherMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_standard', @SegmentResiOther, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentOtherMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_retention', @SegmentRetentionOther, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentOtherMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'resi_legal_recovery', @SegmentBoRecoveryLr, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentOtherMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_not_identified', @SegmentProfProf, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentOtherMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_standard', @SegmentProfProf, '{"language":"nl-BE|fr-BE|de-BE|en-GB"}'
        UNION ALL
        SELECT NEWID(), @SegmentOtherMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_retention', @SegmentRetentionOther, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentOtherMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'prof_legal_recovery', @SegmentBoRecoveryLr, '{"language":"nl-BE|fr-BE"}'
        UNION ALL
        SELECT NEWID(), @SegmentOtherMatrix, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentResiOther, NULL
        -- ssvim_selfservice transitions (11)
        UNION ALL
        SELECT NEWID(), @SegmentSsvimSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'END', @SegmentGetIntent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvimSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'END_BACKOFFICE', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvimSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'END_OPERATOR', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvimSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvimSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_API', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvimSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_VB', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvimSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvimSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'OPERATOR', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvimSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NOT_ELIGIBLE', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvimSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NOT_RELATED', @SegmentGetIntent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvimSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentMoveMatrix, NULL
        -- ssvsmi_selfservice transitions (11)
        UNION ALL
        SELECT NEWID(), @SegmentSsvsmiSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'END', @SegmentGetIntent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvsmiSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'END_BACKOFFICE', @SegmentBillingMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvsmiSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'END_OPERATOR', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvsmiSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvsmiSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_API', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvsmiSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE_VB', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvsmiSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvsmiSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'OPERATOR', @SegmentBillingMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvsmiSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NOT_ELIGIBLE', @SegmentMoveMatrix, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvsmiSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'NOT_RELATED', @SegmentGetIntent, NULL
        UNION ALL
        SELECT NEWID(), @SegmentSsvsmiSelfservice, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentMoveMatrix, NULL
        -- resi_billing transitions (5)
        UNION ALL
        SELECT NEWID(), @SegmentResiBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554100","remoteName":"RESI_NL_BILLING","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554101","remoteName":"RESI_FR_BILLING","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554102","remoteName":"RESI_DE_BILLING","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554103","remoteName":"RESI_EN_BILLING","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentResiBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554100","remoteName":"RESI_NL_BILLING","diversionReason":""}'
        -- resi_move transitions (5)
        UNION ALL
        SELECT NEWID(), @SegmentResiMove, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554120","remoteName":"RESI_NL_MOVE","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiMove, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554121","remoteName":"RESI_FR_MOVE","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiMove, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554122","remoteName":"RESI_DE_MOVE","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiMove, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554123","remoteName":"RESI_EN_MOVE","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiMove, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentResiMove, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554120","remoteName":"RESI_NL_MOVE","diversionReason":""}'
        -- resi_sales transitions (5)
        UNION ALL
        SELECT NEWID(), @SegmentResiSales, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554140","remoteName":"RESI_NL_SALES","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiSales, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554141","remoteName":"RESI_FR_SALES","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiSales, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554142","remoteName":"RESI_DE_SALES","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiSales, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554143","remoteName":"RESI_EN_SALES","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiSales, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentResiSales, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554140","remoteName":"RESI_NL_SALES","diversionReason":""}'
        -- resi_home transitions (5)
        UNION ALL
        SELECT NEWID(), @SegmentResiHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554160","remoteName":"RESI_NL_HOME","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554161","remoteName":"RESI_FR_HOME","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554162","remoteName":"RESI_DE_HOME","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554163","remoteName":"RESI_EN_HOME","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentResiHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554160","remoteName":"RESI_NL_HOME","diversionReason":""}'
        -- resi_other transitions (5)
        UNION ALL
        SELECT NEWID(), @SegmentResiOther, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554180","remoteName":"RESI_NL_OTHER","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiOther, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554181","remoteName":"RESI_FR_OTHER","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiOther, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554182","remoteName":"RESI_DE_OTHER","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiOther, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554183","remoteName":"RESI_EN_OTHER","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentResiOther, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentResiOther, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554180","remoteName":"RESI_NL_OTHER","diversionReason":""}'
        -- prof_billing transitions (5)
        UNION ALL
        SELECT NEWID(), @SegmentProfBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554200","remoteName":"PROF_NL_BILLING","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554210","remoteName":"PROF_FR_BILLING","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554220","remoteName":"PROF_DE_BILLING","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554230","remoteName":"PROF_EN_BILLING","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentProfBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554200","remoteName":"PROF_NL_BILLING","diversionReason":""}'
        -- prof_prof transitions (5)
        UNION ALL
        SELECT NEWID(), @SegmentProfProf, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554202","remoteName":"PROF_NL_PROF","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfProf, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554212","remoteName":"PROF_FR_PROF","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfProf, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554222","remoteName":"PROF_DE_PROF","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfProf, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554232","remoteName":"PROF_EN_PROF","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfProf, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentProfProf, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554202","remoteName":"PROF_NL_PROF","diversionReason":""}'
        -- prof_home transitions (5)
        UNION ALL
        SELECT NEWID(), @SegmentProfHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554201","remoteName":"PROF_NL_HOME","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554211","remoteName":"PROF_FR_HOME","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554221","remoteName":"PROF_DE_HOME","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554231","remoteName":"PROF_EN_HOME","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentProfHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentProfHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554201","remoteName":"PROF_NL_HOME","diversionReason":""}'
        -- retention_billing transitions (3)
        UNION ALL
        SELECT NEWID(), @SegmentRetentionBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554250","remoteName":"RETENTION_NL_BILLING","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentRetentionBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554260","remoteName":"RETENTION_FR_BILLING","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentRetentionBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentRetentionBilling, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554250","remoteName":"RETENTION_NL_BILLING","diversionReason":""}'
        -- retention_home transitions (3)
        UNION ALL
        SELECT NEWID(), @SegmentRetentionHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554251","remoteName":"RETENTION_NL_HOME","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentRetentionHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554261","remoteName":"RETENTION_FR_HOME","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentRetentionHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentRetentionHome, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554251","remoteName":"RETENTION_NL_HOME","diversionReason":""}'
        -- retention_sales transitions (3)
        UNION ALL
        SELECT NEWID(), @SegmentRetentionSales, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554254","remoteName":"RETENTION_NL_SALES","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentRetentionSales, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554264","remoteName":"RETENTION_FR_SALES","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentRetentionSales, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentRetentionSales, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554254","remoteName":"RETENTION_NL_SALES","diversionReason":""}'
        -- retention_other transitions (3)
        UNION ALL
        SELECT NEWID(), @SegmentRetentionOther, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554253","remoteName":"RETENTION_NL_OTHER","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentRetentionOther, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554263","remoteName":"RETENTION_FR_OTHER","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentRetentionOther, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentRetentionOther, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554253","remoteName":"RETENTION_NL_OTHER","diversionReason":""}'
        -- enterprise_transfer transitions (3)
        UNION ALL
        SELECT NEWID(), @SegmentEnterpriseTransfer, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"+3223367920","remoteName":"ENTERPRISE_NL","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentEnterpriseTransfer, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"+3223367920","remoteName":"ENTERPRISE_FR","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentEnterpriseTransfer, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentEnterpriseTransfer, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"+3223367920","remoteName":"ENTERPRISE_NL","diversionReason":""}'
        -- bo_recovery_lr transitions (3)
        UNION ALL
        SELECT NEWID(), @SegmentBoRecoveryLr, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554300","remoteName":"BO_RECOVERY_VL_LR","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentBoRecoveryLr, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554303","remoteName":"BO_RECOVERY_WB_LR","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentBoRecoveryLr, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentBoRecoveryLr, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"554300","remoteName":"BO_RECOVERY_VL_LR","diversionReason":""}'
        -- redirect_energyline transitions (3)
        UNION ALL
        SELECT NEWID(), @SegmentRedirectEnergyline, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"+3271698011","remoteName":"ENERGYLINE_CIC_DE","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentRedirectEnergyline, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"+3281809511","remoteName":"ENERGYLINE_CIC_EN","diversionReason":""}'
        UNION ALL
        SELECT NEWID(), @SegmentRedirectEnergyline, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        UNION ALL
        SELECT NEWID(), @SegmentRedirectEnergyline, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', @SegmentTransfer, '{"remoteAddress":"+3271698011","remoteName":"ENERGYLINE_CIC_DE","diversionReason":""}'
        -- transfer transitions (3) - terminal segment
        UNION ALL
        SELECT NEWID(), @SegmentTransfer, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'SUCCESS', NULL, '{"callState":"transferred"}'
        UNION ALL
        SELECT NEWID(), @SegmentTransfer, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'FAILURE', @SegmentDisconnect, '{"callState":"localDisconnect"}'
        UNION ALL
        SELECT NEWID(), @SegmentTransfer, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', NULL, NULL
        -- disconnect transitions (2) - terminal segment
        UNION ALL
        SELECT NEWID(), @SegmentDisconnect, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'SUCCESS', NULL, '{"callState":"localDisconnect"}'
        UNION ALL
        SELECT NEWID(), @SegmentDisconnect, 'EEBL-ENERGYLINE-MAIN', NULL, NULL, 'default', NULL, NULL
    ) AS source (SegmentTransitionId, SegmentId, RoutingId, ChangeSetId, ContextKey, ResultName, NextSegmentId, Params)
    ON target.SegmentId = source.SegmentId AND target.ResultName = source.ResultName
    WHEN MATCHED THEN
        UPDATE SET
            NextSegmentId = source.NextSegmentId,
            Params = source.Params
    WHEN NOT MATCHED THEN
        INSERT (SegmentTransitionId, SegmentId, RoutingId, ChangeSetId, ContextKey, ResultName, NextSegmentId, Params)
        VALUES (source.SegmentTransitionId, source.SegmentId, source.RoutingId, source.ChangeSetId, source.ContextKey, source.ResultName, source.NextSegmentId, source.Params);

    COMMIT TRAN;

    PRINT '✅ Segment transitions seeded successfully (~215 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
