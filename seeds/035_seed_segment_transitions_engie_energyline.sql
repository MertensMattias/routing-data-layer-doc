-- =====================================================================
-- Seed: Segment Transitions - ENGIE ENERGYLINE
-- File: 035_seed_segment_transitions_engie_energyline.sql
-- Purpose: Seed seg_SegmentTransition table with transitions from segmentDic_BASE
-- Dependencies: 034_seed_segments_engie_energyline.sql
-- Records: ~500+ transitions (all transitions from segmentDic_BASE)
-- Re-run safe: Yes (uses MERGE)
-- Source: import_segmentDic.js segmentDic_BASE Map
-- Note: Uses NextSegmentId lookups for compatibility with existing schema
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables for segment IDs (looked up dynamically)
    -- Base segments
    DECLARE @SegmentGetLanguage UNIQUEIDENTIFIER;
    DECLARE @SegmentCheckScheduler UNIQUEIDENTIFIER;
    DECLARE @SegmentIdentification UNIQUEIDENTIFIER;
    DECLARE @SegmentGetIntent UNIQUEIDENTIFIER;
    DECLARE @SegmentNewIntent UNIQUEIDENTIFIER;
    DECLARE @SegmentOtherIntent UNIQUEIDENTIFIER;
    DECLARE @SegmentGeneralEvent UNIQUEIDENTIFIER;
    DECLARE @SegmentCustomerEvent UNIQUEIDENTIFIER;
    -- Intent messages
    DECLARE @SegmentIntentMsgSsvnbd UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg001 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg002 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg003 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg004 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg005 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg006 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg007 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg008 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg009 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg010 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg011 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg012 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg013 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg014 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg015 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg016 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg017 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg018 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg019 UNIQUEIDENTIFIER;
    DECLARE @SegmentIntentMsg019Bis UNIQUEIDENTIFIER;
    -- Self-service segments
    DECLARE @SegmentSsvim UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvaa UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvaanp UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvaap UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvapa UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvsmi UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvnbd UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvmd UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvsst UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvmei UNIQUEIDENTIFIER;
    DECLARE @SegmentSsviwar UNIQUEIDENTIFIER;
    DECLARE @SegmentSsviwpd UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvdd UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvdup UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvwmd UNIQUEIDENTIFIER;
    DECLARE @SegmentSsvhm UNIQUEIDENTIFIER;
    -- Matrix segments
    DECLARE @SegmentBilling UNIQUEIDENTIFIER;
    DECLARE @SegmentMove UNIQUEIDENTIFIER;
    DECLARE @SegmentSales UNIQUEIDENTIFIER;
    DECLARE @SegmentEngieHome UNIQUEIDENTIFIER;
    DECLARE @SegmentOther UNIQUEIDENTIFIER;
    -- Routing segments
    DECLARE @SegmentResiShort1Billing UNIQUEIDENTIFIER;
    DECLARE @SegmentResiShort2Billing UNIQUEIDENTIFIER;
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
    DECLARE @SegmentRetentionMove UNIQUEIDENTIFIER;
    DECLARE @SegmentRetentionOther UNIQUEIDENTIFIER;
    DECLARE @SegmentRetentionSales UNIQUEIDENTIFIER;
    DECLARE @SegmentBoOvfDunning UNIQUEIDENTIFIER;
    DECLARE @SegmentBoRecoveryLr UNIQUEIDENTIFIER;
    DECLARE @SegmentEnterprise UNIQUEIDENTIFIER;
    DECLARE @SegmentRedirectEnergyline UNIQUEIDENTIFIER;
    DECLARE @SegmentRedirectProf UNIQUEIDENTIFIER;
    DECLARE @SegmentErrorDefaultRoute UNIQUEIDENTIFIER;
    -- Terminal segments
    DECLARE @SegmentTransfer UNIQUEIDENTIFIER;
    DECLARE @SegmentRedirect UNIQUEIDENTIFIER;
    DECLARE @SegmentDisconnect UNIQUEIDENTIFIER;
    DECLARE @SegmentInterrupted UNIQUEIDENTIFIER;

    -- Get segment IDs dynamically (all for routingId 'ENGIE-ENERGYLINE' and ChangeSetId IS NULL)
    SELECT @SegmentGetLanguage = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'GET_LANGUAGE' AND ChangeSetId IS NULL;
    SELECT @SegmentCheckScheduler = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'CHECK_SCHEDULER' AND ChangeSetId IS NULL;
    SELECT @SegmentIdentification = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'IDENTIFICATION' AND ChangeSetId IS NULL;
    SELECT @SegmentGetIntent = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'GET_INTENT' AND ChangeSetId IS NULL;
    SELECT @SegmentNewIntent = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'NEW_INTENT' AND ChangeSetId IS NULL;
    SELECT @SegmentOtherIntent = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'OTHER_INTENT' AND ChangeSetId IS NULL;
    SELECT @SegmentGeneralEvent = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'GENERAL_EVENT' AND ChangeSetId IS NULL;
    SELECT @SegmentCustomerEvent = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'CUSTOMER_EVENT' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsgSsvnbd = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_SSVNBD' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg001 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_001' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg002 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_002' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg003 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_003' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg004 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_004' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg005 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_005' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg006 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_006' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg007 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_007' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg008 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_008' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg009 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_009' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg010 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_010' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg011 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_011' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg012 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_012' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg013 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_013' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg014 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_014' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg015 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_015' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg016 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_016' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg017 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_017' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg018 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_018' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg019 = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_019' AND ChangeSetId IS NULL;
    SELECT @SegmentIntentMsg019Bis = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTENT_MSG_019_BIS' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvim = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVIM' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvaa = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVAA' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvaanp = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVAANP' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvaap = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVAAP' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvapa = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVAPA' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvsmi = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVSMI' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvnbd = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVNBD' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvmd = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVMD' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvsst = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVSST' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvmei = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVMEI' AND ChangeSetId IS NULL;
    SELECT @SegmentSsviwar = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVIWAR' AND ChangeSetId IS NULL;
    SELECT @SegmentSsviwpd = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVIWPD' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvdd = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVDD' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvdup = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVDUP' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvwmd = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVWMD' AND ChangeSetId IS NULL;
    SELECT @SegmentSsvhm = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SSVHM' AND ChangeSetId IS NULL;
    SELECT @SegmentBilling = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'BILLING' AND ChangeSetId IS NULL;
    SELECT @SegmentMove = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'MOVE' AND ChangeSetId IS NULL;
    SELECT @SegmentSales = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'SALES' AND ChangeSetId IS NULL;
    SELECT @SegmentEngieHome = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'ENGIE_HOME' AND ChangeSetId IS NULL;
    SELECT @SegmentOther = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'OTHER' AND ChangeSetId IS NULL;
    SELECT @SegmentResiShort1Billing = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RESI_SHORT_1_BILLING' AND ChangeSetId IS NULL;
    SELECT @SegmentResiShort2Billing = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RESI_SHORT_2_BILLING' AND ChangeSetId IS NULL;
    SELECT @SegmentResiBilling = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RESI_BILLING' AND ChangeSetId IS NULL;
    SELECT @SegmentResiMove = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RESI_MOVE' AND ChangeSetId IS NULL;
    SELECT @SegmentResiSales = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RESI_SALES' AND ChangeSetId IS NULL;
    SELECT @SegmentResiHome = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RESI_HOME' AND ChangeSetId IS NULL;
    SELECT @SegmentResiOther = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RESI_OTHER' AND ChangeSetId IS NULL;
    SELECT @SegmentProfBilling = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'PROF_BILLING' AND ChangeSetId IS NULL;
    SELECT @SegmentProfProf = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'PROF_PROF' AND ChangeSetId IS NULL;
    SELECT @SegmentProfHome = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'PROF_HOME' AND ChangeSetId IS NULL;
    SELECT @SegmentRetentionBilling = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RETENTION_BILLING' AND ChangeSetId IS NULL;
    SELECT @SegmentRetentionHome = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RETENTION_HOME' AND ChangeSetId IS NULL;
    SELECT @SegmentRetentionMove = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RETENTION_MOVE' AND ChangeSetId IS NULL;
    SELECT @SegmentRetentionOther = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RETENTION_OTHER' AND ChangeSetId IS NULL;
    SELECT @SegmentRetentionSales = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'RETENTION_SALES' AND ChangeSetId IS NULL;
    SELECT @SegmentBoOvfDunning = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'BO_OVF_DUNNING' AND ChangeSetId IS NULL;
    SELECT @SegmentBoRecoveryLr = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'BO_RECOVERY_LR' AND ChangeSetId IS NULL;
    SELECT @SegmentEnterprise = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'ENTERPRISE' AND ChangeSetId IS NULL;
    SELECT @SegmentRedirectEnergyline = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'REDIRECT_ENERGYLINE' AND ChangeSetId IS NULL;
    SELECT @SegmentRedirectProf = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'REDIRECT_PROF' AND ChangeSetId IS NULL;
    SELECT @SegmentErrorDefaultRoute = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'ERROR_DEFAULT_ROUTE' AND ChangeSetId IS NULL;
    SELECT @SegmentTransfer = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'TRANSFER' AND ChangeSetId IS NULL;
    SELECT @SegmentRedirect = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'REDIRECT' AND ChangeSetId IS NULL;
    SELECT @SegmentDisconnect = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'DISCONNECT' AND ChangeSetId IS NULL;
    SELECT @SegmentInterrupted = SegmentId FROM [ivr].[seg_Segment] WHERE RoutingId = 'ENGIE-ENERGYLINE' AND SegmentName = 'INTERRUPTED' AND ChangeSetId IS NULL;

    -- Validate that all segments exist
    IF @SegmentGetLanguage IS NULL OR @SegmentCheckScheduler IS NULL OR @SegmentIdentification IS NULL
    BEGIN
        RAISERROR('Required segments not found. Please run 034_seed_segments_engie_energyline.sql first.', 16, 1);
        ROLLBACK TRAN;
        RETURN;
    END

    -- Seed segment transitions
    -- Note: Language codes mapped: NL→nl-BE, FR→fr-BE, DE→de-BE, EN→en-GB
    -- Matrix segments use contextKey for customer type/status combinations
    MERGE [ivr].[seg_SegmentTransition] AS target
    USING (
        -- GET_LANGUAGE transitions (7)
        SELECT NEWID() AS SegmentTransitionId, @SegmentGetLanguage AS SegmentId, 'ENGIE-ENERGYLINE' AS RoutingId, NULL AS ChangeSetId, NULL AS ContextKey, 'nl-BE' AS ResultName, @SegmentCheckScheduler AS NextSegmentId, NULL AS Params
        UNION ALL SELECT NEWID(), @SegmentGetLanguage, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentCheckScheduler, NULL
        UNION ALL SELECT NEWID(), @SegmentGetLanguage, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentCheckScheduler, NULL
        UNION ALL SELECT NEWID(), @SegmentGetLanguage, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentCheckScheduler, NULL
        UNION ALL SELECT NEWID(), @SegmentGetLanguage, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_TRIES', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentGetLanguage, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentCheckScheduler, NULL
        UNION ALL SELECT NEWID(), @SegmentGetLanguage, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentCheckScheduler, NULL
        -- CHECK_SCHEDULER transitions (9)
        UNION ALL SELECT NEWID(), @SegmentCheckScheduler, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPEN', @SegmentIdentification, NULL
        UNION ALL SELECT NEWID(), @SegmentCheckScheduler, 'ENGIE-ENERGYLINE', NULL, NULL, 'CLOSED', @SegmentDisconnect, '{"closedType":"regular"}'
        UNION ALL SELECT NEWID(), @SegmentCheckScheduler, 'ENGIE-ENERGYLINE', NULL, NULL, 'CLOSEDEXCEPTION', @SegmentDisconnect, '{"closedType":"exception"}'
        UNION ALL SELECT NEWID(), @SegmentCheckScheduler, 'ENGIE-ENERGYLINE', NULL, NULL, 'HOLIDAY', @SegmentDisconnect, '{"closedType":"holiday"}'
        UNION ALL SELECT NEWID(), @SegmentCheckScheduler, 'ENGIE-ENERGYLINE', NULL, NULL, 'TRANSFER', @SegmentTransfer, NULL
        UNION ALL SELECT NEWID(), @SegmentCheckScheduler, 'ENGIE-ENERGYLINE', NULL, NULL, 'EXCEPTIONAL', @SegmentIdentification, NULL
        UNION ALL SELECT NEWID(), @SegmentCheckScheduler, 'ENGIE-ENERGYLINE', NULL, NULL, 'EMERGENCY', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentCheckScheduler, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentIdentification, NULL
        UNION ALL SELECT NEWID(), @SegmentCheckScheduler, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentIdentification, NULL
        -- IDENTIFICATION transitions (7)
        UNION ALL SELECT NEWID(), @SegmentIdentification, 'ENGIE-ENERGYLINE', NULL, NULL, 'ID_ON_CLID', @SegmentGeneralEvent, '{}'
        UNION ALL SELECT NEWID(), @SegmentIdentification, 'ENGIE-ENERGYLINE', NULL, NULL, 'ID_ON_CA', @SegmentGeneralEvent, '{}'
        UNION ALL SELECT NEWID(), @SegmentIdentification, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_IDENTIFIED', @SegmentGetIntent, '{}'
        UNION ALL SELECT NEWID(), @SegmentIdentification, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentGetIntent, '{}'
        UNION ALL SELECT NEWID(), @SegmentIdentification, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentGetIntent, '{}'
        UNION ALL SELECT NEWID(), @SegmentIdentification, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIdentification, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentGetIntent, NULL
        -- GET_INTENT, NEW_INTENT, OTHER_INTENT are placeholders - no transitions defined
        -- GENERAL_EVENT transitions (12)
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_EVENT', @SegmentCustomerEvent, NULL
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'BASIC_EMAIL', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'DIRECT_EMAIL', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'BASIC_NO_EMAIL', @SegmentCustomerEvent, NULL
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'DIRECT_NO_EMAIL', @SegmentCustomerEvent, NULL
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'BASIC_EMAIL_FAILURE', @SegmentCustomerEvent, NULL
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'DIRECT_EMAIL_FAILURE', @SegmentCustomerEvent, NULL
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'ENTERPRISE', @SegmentEnterprise, NULL
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'SIBELGA_PROTECTED_CUSTOMER', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'LRPF', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentCustomerEvent, NULL
        UNION ALL SELECT NEWID(), @SegmentGeneralEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentCustomerEvent, NULL
        -- CUSTOMER_EVENT transitions (7)
        UNION ALL SELECT NEWID(), @SegmentCustomerEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentGetIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentCustomerEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_EVENT', @SegmentGetIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentCustomerEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentCustomerEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentGetIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentCustomerEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentGetIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentCustomerEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentCustomerEvent, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentGetIntent, NULL
        -- INTENT_MSG_SSVNBD transitions (7)
        UNION ALL SELECT NEWID(), @SegmentIntentMsgSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'PARTIAL', @SegmentSsvnbd, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsgSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'CONSUMPTION', @SegmentSsvnbd, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsgSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_EVENT', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsgSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsgSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentGetIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsgSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsgSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentBilling, NULL
        -- INTENT_MSG_001 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg001, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg001, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_EVENT', @SegmentGetIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg001, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg001, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg001, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg001, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg001, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg001, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentBilling, NULL
        -- INTENT_MSG_002 transitions (9)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg002, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg002, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg002, 'ENGIE-ENERGYLINE', NULL, NULL, 'MOVE_RELATED', @SegmentSsvim, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg002, 'ENGIE-ENERGYLINE', NULL, NULL, 'INVOICE_RELATED', @SegmentSsvsmi, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg002, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg002, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg002, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg002, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg002, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentMove, NULL
        -- INTENT_MSG_003 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg003, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg003, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg003, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg003, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg003, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg003, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg003, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentSales, NULL
        -- INTENT_MSG_004 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg004, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg004, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg004, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg004, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg004, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg004, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg004, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentEngieHome, NULL
        -- INTENT_MSG_005 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg005, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg005, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg005, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg005, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg005, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg005, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg005, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentEngieHome, NULL
        -- INTENT_MSG_006 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg006, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg006, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg006, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg006, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg006, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg006, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg006, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentOther, NULL
        -- INTENT_MSG_007 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg007, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg007, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg007, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg007, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg007, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg007, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg007, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentBilling, NULL
        -- INTENT_MSG_008 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg008, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg008, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg008, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg008, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg008, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg008, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg008, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentBilling, NULL
        -- INTENT_MSG_009 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg009, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg009, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg009, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg009, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg009, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg009, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg009, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentBilling, NULL
        -- INTENT_MSG_010 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg010, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg010, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg010, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg010, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg010, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg010, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg010, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentSales, NULL
        -- INTENT_MSG_011 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg011, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg011, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg011, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg011, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg011, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg011, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg011, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentBilling, NULL
        -- INTENT_MSG_012 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg012, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg012, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg012, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg012, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg012, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg012, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg012, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentEngieHome, NULL
        -- INTENT_MSG_013 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg013, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg013, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg013, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg013, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg013, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg013, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg013, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentBilling, NULL
        -- INTENT_MSG_014 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg014, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg014, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg014, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg014, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg014, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg014, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg014, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentBilling, NULL
        -- INTENT_MSG_015 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg015, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg015, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg015, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg015, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg015, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg015, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg015, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentBilling, NULL
        -- INTENT_MSG_016 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg016, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg016, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg016, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg016, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg016, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg016, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg016, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentOther, NULL
        -- INTENT_MSG_017 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg017, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg017, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg017, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg017, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg017, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg017, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentOther, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg017, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentOther, NULL
        -- INTENT_MSG_018 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg018, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg018, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg018, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg018, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg018, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg018, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentSales, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg018, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentSales, NULL
        -- INTENT_MSG_019 transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentIntentMsg019Bis, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentBilling, NULL
        -- INTENT_MSG_019_BIS transitions (8)
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019Bis, 'ENGIE-ENERGYLINE', NULL, NULL, 'NO_MORE_QUESTIONS', @SegmentDisconnect, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019Bis, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019Bis, 'ENGIE-ENERGYLINE', NULL, NULL, 'OTHER_QUESTION', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019Bis, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019Bis, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019Bis, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentIntentMsg019Bis, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentBilling, NULL
        -- SSVIM transitions (11)
        UNION ALL SELECT NEWID(), @SegmentSsvim, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvim, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvim, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvim, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvim, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvim, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvim, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvim, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvim, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvim, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentOtherIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvim, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentMove, NULL
        -- SSVAA transitions (4)
        UNION ALL SELECT NEWID(), @SegmentSsvaa, 'ENGIE-ENERGYLINE', NULL, NULL, 'ADAPT_AMOUNT_PROTOCOL', @SegmentSsvaanp, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaa, 'ENGIE-ENERGYLINE', NULL, NULL, 'ADAPT_AMOUNT_NON_PROTOCOL', @SegmentSsvaanp, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaa, 'ENGIE-ENERGYLINE', NULL, NULL, 'ADAPT_PROPOSED_AMOUNT', @SegmentSsvapa, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaa, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentResiShort1Billing, NULL
        -- SSVAANP transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvaanp, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaanp, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaanp, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaanp, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaanp, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaanp, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaanp, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaanp, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaanp, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaanp, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentOtherIntent, NULL
        -- SSVAAP transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvaap, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaap, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaap, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaap, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaap, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaap, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaap, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaap, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaap, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvaap, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentOtherIntent, NULL
        -- SSVAPA transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvapa, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvapa, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvapa, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvapa, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvapa, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvapa, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvapa, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvapa, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvapa, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvapa, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentOtherIntent, NULL
        -- SSVSMI transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvsmi, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsmi, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsmi, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsmi, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsmi, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsmi, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsmi, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsmi, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsmi, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentMove, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsmi, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        -- SSVNBD transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvnbd, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        -- SSVMD transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        -- SSVSST transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvsst, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsst, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsst, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsst, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsst, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsst, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsst, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsst, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsst, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvsst, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        -- SSVMEI transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvmei, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmei, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmei, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmei, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmei, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmei, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmei, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmei, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmei, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvmei, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentResiShort1Billing, NULL
        -- SSVIWAR transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsviwar, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwar, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwar, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwar, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwar, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwar, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwar, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwar, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwar, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwar, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        -- SSVIWPD transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsviwpd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwpd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwpd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwpd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwpd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwpd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwpd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwpd, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwpd, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsviwpd, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        -- SSVDD transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvdd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdd, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentResiShort1Billing, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdd, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdd, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentResiShort1Billing, NULL
        -- SSVDUP transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvdup, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdup, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdup, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdup, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdup, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdup, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdup, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdup, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdup, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvdup, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        -- SSVWMD transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvwmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvwmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvwmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvwmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvwmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvwmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvwmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvwmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvwmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvwmd, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentBilling, NULL
        -- SSVHM transitions (10)
        UNION ALL SELECT NEWID(), @SegmentSsvhm, 'ENGIE-ENERGYLINE', NULL, NULL, 'END', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvhm, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_BACKOFFICE', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvhm, 'ENGIE-ENERGYLINE', NULL, NULL, 'END_OPERATOR', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvhm, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_BACKOFFICE', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvhm, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_API', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvhm, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE_VB', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvhm, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvhm, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_ELIGIBLE', @SegmentEngieHome, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvhm, 'ENGIE-ENERGYLINE', NULL, NULL, 'NOT_RELATED', @SegmentNewIntent, NULL
        UNION ALL SELECT NEWID(), @SegmentSsvhm, 'ENGIE-ENERGYLINE', NULL, NULL, 'OPERATOR', @SegmentEngieHome, NULL
        -- Matrix segments with contextKey (BILLING, MOVE, SALES, ENGIE_HOME, OTHER) - 32 transitions each (8 contextKeys × 4 languages)
        -- BILLING matrix transitions (32)
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'nl-BE', @SegmentResiBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'fr-BE', @SegmentResiBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'de-BE', @SegmentResiBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'en-GB', @SegmentResiBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'nl-BE', @SegmentResiBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'fr-BE', @SegmentResiBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'de-BE', @SegmentResiBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'en-GB', @SegmentResiBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'nl-BE', @SegmentRetentionBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'fr-BE', @SegmentRetentionBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'de-BE', @SegmentResiBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'en-GB', @SegmentResiBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'nl-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'fr-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'de-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'en-GB', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'nl-BE', @SegmentProfBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'fr-BE', @SegmentProfBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'de-BE', @SegmentProfBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'en-GB', @SegmentProfBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'nl-BE', @SegmentProfBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'fr-BE', @SegmentProfBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'de-BE', @SegmentProfBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'en-GB', @SegmentProfBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'nl-BE', @SegmentRetentionBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'fr-BE', @SegmentRetentionBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'de-BE', @SegmentProfBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'en-GB', @SegmentProfBilling, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'nl-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'fr-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'de-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentBilling, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'en-GB', @SegmentBoRecoveryLr, NULL
        -- MOVE matrix transitions (32)
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'nl-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'fr-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'de-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'en-GB', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'nl-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'fr-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'de-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'en-GB', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'nl-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'fr-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'de-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'en-GB', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'nl-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'fr-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'de-BE', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'en-GB', @SegmentResiMove, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'nl-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'fr-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'de-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'en-GB', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'nl-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'fr-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'de-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'en-GB', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'nl-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'fr-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'de-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'en-GB', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'nl-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'fr-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'de-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentMove, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'en-GB', @SegmentProfProf, NULL
        -- SALES matrix transitions (32)
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'nl-BE', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'fr-BE', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'de-BE', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'en-GB', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'nl-BE', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'fr-BE', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'de-BE', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'en-GB', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'nl-BE', @SegmentRetentionSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'fr-BE', @SegmentRetentionSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'de-BE', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'en-GB', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'nl-BE', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'fr-BE', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'de-BE', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'en-GB', @SegmentResiSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'nl-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'fr-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'de-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'en-GB', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'nl-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'fr-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'de-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'en-GB', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'nl-BE', @SegmentRetentionSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'fr-BE', @SegmentRetentionSales, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'de-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'en-GB', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'nl-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'fr-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'de-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentSales, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'en-GB', @SegmentProfProf, NULL
        -- ENGIE_HOME matrix transitions (32)
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'nl-BE', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'fr-BE', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'de-BE', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'en-GB', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'nl-BE', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'fr-BE', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'de-BE', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'en-GB', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'nl-BE', @SegmentRetentionHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'fr-BE', @SegmentRetentionHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'de-BE', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'en-GB', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'nl-BE', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'fr-BE', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'de-BE', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'en-GB', @SegmentResiHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'nl-BE', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'fr-BE', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'de-BE', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'en-GB', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'nl-BE', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'fr-BE', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'de-BE', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'en-GB', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'nl-BE', @SegmentRetentionHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'fr-BE', @SegmentRetentionHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'de-BE', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'en-GB', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'nl-BE', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'fr-BE', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'de-BE', @SegmentProfHome, NULL
        UNION ALL SELECT NEWID(), @SegmentEngieHome, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'en-GB', @SegmentProfHome, NULL
        -- OTHER matrix transitions (32)
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'nl-BE', @SegmentResiOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'fr-BE', @SegmentResiOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'de-BE', @SegmentResiOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_not_identified', 'en-GB', @SegmentResiOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'nl-BE', @SegmentResiOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'fr-BE', @SegmentResiOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'de-BE', @SegmentResiOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_standard', 'en-GB', @SegmentResiOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'nl-BE', @SegmentRetentionOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'fr-BE', @SegmentRetentionOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'de-BE', @SegmentResiOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_retention', 'en-GB', @SegmentResiOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'nl-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'fr-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'de-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'resi_legal_recovery', 'en-GB', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'nl-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'fr-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'de-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_not_identified', 'en-GB', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'nl-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'fr-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'de-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_standard', 'en-GB', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'nl-BE', @SegmentRetentionOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'fr-BE', @SegmentRetentionOther, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'de-BE', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_retention', 'en-GB', @SegmentProfProf, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'nl-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'fr-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'de-BE', @SegmentBoRecoveryLr, NULL
        UNION ALL SELECT NEWID(), @SegmentOther, 'ENGIE-ENERGYLINE', NULL, 'prof_legal_recovery', 'en-GB', @SegmentBoRecoveryLr, NULL
        -- Routing segments with language transitions (RESI_*, PROF_*, RETENTION_*, BO_*, ENTERPRISE, REDIRECT_*)
        -- RESI_SHORT_1_BILLING transitions (3)
        UNION ALL SELECT NEWID(), @SegmentResiShort1Billing, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554190","remoteName":"RESI_NL_SHORT_1_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiShort1Billing, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554101","remoteName":"RESI_FR_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiShort1Billing, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- RESI_SHORT_2_BILLING transitions (3)
        UNION ALL SELECT NEWID(), @SegmentResiShort2Billing, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554192","remoteName":"RESI_NL_SHORT_2_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiShort2Billing, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554193","remoteName":"RESI_FR_SHORT_2_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiShort2Billing, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- RESI_BILLING transitions (5)
        UNION ALL SELECT NEWID(), @SegmentResiBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554100","remoteName":"RESI_NL_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554101","remoteName":"RESI_FR_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554102","remoteName":"RESI_DE_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554103","remoteName":"RESI_EN_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- RESI_MOVE transitions (5)
        UNION ALL SELECT NEWID(), @SegmentResiMove, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554120","remoteName":"RESI_NL_MOVE","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiMove, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554121","remoteName":"RESI_FR_MOVE","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiMove, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554122","remoteName":"RESI_DE_MOVE","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiMove, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554123","remoteName":"RESI_EN_MOVE","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiMove, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- RESI_SALES transitions (5)
        UNION ALL SELECT NEWID(), @SegmentResiSales, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554140","remoteName":"RESI_NL_SALES","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiSales, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554141","remoteName":"RESI_FR_SALES","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiSales, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554142","remoteName":"RESI_DE_SALES","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiSales, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554143","remoteName":"RESI_EN_SALES","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiSales, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- RESI_HOME transitions (5)
        UNION ALL SELECT NEWID(), @SegmentResiHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554160","remoteName":"RESI_NL_HOME","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554161","remoteName":"RESI_FR_HOME","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554162","remoteName":"RESI_DE_HOME","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554163","remoteName":"RESI_EN_HOME","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- RESI_OTHER transitions (5)
        UNION ALL SELECT NEWID(), @SegmentResiOther, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554180","remoteName":"RESI_NL_OTHER","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiOther, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554181","remoteName":"RESI_FR_OTHER","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiOther, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554182","remoteName":"RESI_DE_OTHER","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiOther, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554183","remoteName":"RESI_EN_OTHER","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentResiOther, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- PROF_BILLING transitions (5)
        UNION ALL SELECT NEWID(), @SegmentProfBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554200","remoteName":"PROF_NL_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554210","remoteName":"PROF_FR_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554220","remoteName":"PROF_DE_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554230","remoteName":"PROF_EN_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- PROF_PROF transitions (5)
        UNION ALL SELECT NEWID(), @SegmentProfProf, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554202","remoteName":"PROF_NL_PROF","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfProf, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554212","remoteName":"PROF_FR_PROF","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfProf, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554222","remoteName":"PROF_DE_PROF","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfProf, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554232","remoteName":"PROF_EN_PROF","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfProf, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- PROF_HOME transitions (5)
        UNION ALL SELECT NEWID(), @SegmentProfHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554201","remoteName":"PROF_NL_HOME","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554211","remoteName":"PROF_FR_HOME","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"554221","remoteName":"PROF_DE_HOME","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"554231","remoteName":"PROF_EN_HOME","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentProfHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- RETENTION_BILLING transitions (3)
        UNION ALL SELECT NEWID(), @SegmentRetentionBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554250","remoteName":"RETENTION_NL_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRetentionBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554260","remoteName":"RETENTION_FR_BILLING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRetentionBilling, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- RETENTION_HOME transitions (3)
        UNION ALL SELECT NEWID(), @SegmentRetentionHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554251","remoteName":"RETENTION_NL_HOME","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRetentionHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554261","remoteName":"RETENTION_FR_HOME","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRetentionHome, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- RETENTION_MOVE transitions (3)
        UNION ALL SELECT NEWID(), @SegmentRetentionMove, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554252","remoteName":"RETENTION_NL_MOVE","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRetentionMove, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554262","remoteName":"RETENTION_FR_MOVE","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRetentionMove, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- RETENTION_OTHER transitions (3)
        UNION ALL SELECT NEWID(), @SegmentRetentionOther, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554253","remoteName":"RETENTION_NL_OTHER","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRetentionOther, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554263","remoteName":"RETENTION_FR_OTHER","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRetentionOther, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- RETENTION_SALES transitions (3)
        UNION ALL SELECT NEWID(), @SegmentRetentionSales, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554254","remoteName":"RETENTION_NL_SALES","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRetentionSales, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554264","remoteName":"RETENTION_FR_SALES","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRetentionSales, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- BO_OVF_DUNNING transitions (3)
        UNION ALL SELECT NEWID(), @SegmentBoOvfDunning, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554310","remoteName":"BO_OVF_DUNNING_NL","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentBoOvfDunning, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554311","remoteName":"BO_OVF_DUNNING_FR","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentBoOvfDunning, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- BO_RECOVERY_LR transitions (3)
        UNION ALL SELECT NEWID(), @SegmentBoRecoveryLr, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"554300","remoteName":"BO_RECOVERY_LR_NL","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentBoRecoveryLr, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"554303","remoteName":"BO_RECOVERY_LR_FR","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentBoRecoveryLr, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- ENTERPRISE transitions (3)
        UNION ALL SELECT NEWID(), @SegmentEnterprise, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentTransfer, '{"remoteAddress":"+3223367920","remoteName":"ENTERPRISE_NL","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentEnterprise, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentTransfer, '{"remoteAddress":"+3223367920","remoteName":"ENTERPRISE_FR","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentEnterprise, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- REDIRECT_ENERGYLINE transitions (3)
        UNION ALL SELECT NEWID(), @SegmentRedirectEnergyline, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"+3271698011","remoteName":"ENERGYLINE_CIC_DE","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRedirectEnergyline, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"+3281809511","remoteName":"ENERGYLINE_CIC_EN","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRedirectEnergyline, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- REDIRECT_PROF transitions (3)
        UNION ALL SELECT NEWID(), @SegmentRedirectProf, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentTransfer, '{"remoteAddress":"+3281809513","remoteName":"ENERGYLINE_CIC_DE","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRedirectProf, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentTransfer, '{"remoteAddress":"+3271698013","remoteName":"ENERGYLINE_CIC_EN","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentRedirectProf, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, NULL
        -- ERROR_DEFAULT_ROUTE transitions (5)
        UNION ALL SELECT NEWID(), @SegmentErrorDefaultRoute, 'ENGIE-ENERGYLINE', NULL, NULL, 'nl-BE', @SegmentRedirect, '{"remoteAddress":"line:engie-error-nl","remoteName":"ERROR-ROUTING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentErrorDefaultRoute, 'ENGIE-ENERGYLINE', NULL, NULL, 'fr-BE', @SegmentRedirect, '{"remoteAddress":"line:engie-error-fr","remoteName":"ERROR-ROUTING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentErrorDefaultRoute, 'ENGIE-ENERGYLINE', NULL, NULL, 'de-BE', @SegmentRedirect, '{"remoteAddress":"line:engie-error","remoteName":"ERROR-ROUTING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentErrorDefaultRoute, 'ENGIE-ENERGYLINE', NULL, NULL, 'en-GB', @SegmentRedirect, '{"remoteAddress":"line:engie-error","remoteName":"ERROR-ROUTING","diversionReason":""}'
        UNION ALL SELECT NEWID(), @SegmentErrorDefaultRoute, 'ENGIE-ENERGYLINE', NULL, NULL, 'default', @SegmentRedirect, NULL
        -- Terminal segments
        -- TRANSFER transitions (2)
        UNION ALL SELECT NEWID(), @SegmentTransfer, 'ENGIE-ENERGYLINE', NULL, NULL, 'SUCCESS', NULL, '{"callState":"transferred"}'
        UNION ALL SELECT NEWID(), @SegmentTransfer, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, '{"callState":"localDisconnect"}'
        -- REDIRECT transitions (2)
        UNION ALL SELECT NEWID(), @SegmentRedirect, 'ENGIE-ENERGYLINE', NULL, NULL, 'SUCCESS', NULL, '{"callState":"redirected"}'
        UNION ALL SELECT NEWID(), @SegmentRedirect, 'ENGIE-ENERGYLINE', NULL, NULL, 'FAILURE', @SegmentDisconnect, '{"callState":"localDisconnect"}'
        -- DISCONNECT transitions (1)
        UNION ALL SELECT NEWID(), @SegmentDisconnect, 'ENGIE-ENERGYLINE', NULL, NULL, 'SUCCESS', NULL, '{"callState":"localDisconnect"}'
        -- INTERRUPTED transitions (1)
        UNION ALL SELECT NEWID(), @SegmentInterrupted, 'ENGIE-ENERGYLINE', NULL, NULL, 'SUCCESS', NULL, '{"callState":"remoteDisconnect"}'
    ) AS source (SegmentTransitionId, SegmentId, RoutingId, ChangeSetId, ContextKey, ResultName, NextSegmentId, Params)
    ON target.SegmentId = source.SegmentId AND target.ResultName = source.ResultName AND (target.ContextKey IS NULL AND source.ContextKey IS NULL OR target.ContextKey = source.ContextKey)
    WHEN MATCHED THEN
        UPDATE SET
            NextSegmentId = source.NextSegmentId,
            Params = source.Params
    WHEN NOT MATCHED THEN
        INSERT (SegmentTransitionId, SegmentId, RoutingId, ChangeSetId, ContextKey, ResultName, NextSegmentId, Params)
        VALUES (source.SegmentTransitionId, source.SegmentId, source.RoutingId, source.ChangeSetId, source.ContextKey, source.ResultName, source.NextSegmentId, source.Params);

    COMMIT TRAN;

    PRINT '✅ ENGIE ENERGYLINE segment transitions seeded successfully (~500+ records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
