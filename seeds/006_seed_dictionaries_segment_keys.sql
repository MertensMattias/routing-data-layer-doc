-- =====================================================================
-- Seed: Dictionary - Segment Keys
-- File: 006_seed_dictionaries_segment_keys.sql
-- Purpose: Seed seg_Dic_Key table with configuration keys per segment type
-- Dependencies: 004_seed_dictionaries_segment_types.sql, 005_seed_dictionaries_key_types.sql
-- Records: ~25 configuration keys across segment types
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables for segment type and key type IDs
    DECLARE @SegmentTypeLanguage INT;
    DECLARE @SegmentTypeScheduler INT;
    DECLARE @SegmentTypeIdentification INT;
    DECLARE @SegmentTypeIntent INT;
    DECLARE @SegmentTypeRouting INT;
    DECLARE @SegmentTypeMessage INT;
    DECLARE @SegmentTypeMatrix INT;
    DECLARE @SegmentTypeApi INT;
    DECLARE @SegmentTypeTransfer INT;

    DECLARE @KeyTypeString INT;
    DECLARE @KeyTypeInt INT;
    DECLARE @KeyTypeBool INT;
    DECLARE @KeyTypeJson INT;

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

    -- Get key type IDs
    SELECT @KeyTypeString = DicTypeId FROM [ivr].[seg_Dic_KeyType] WHERE TypeName = 'string';
    SELECT @KeyTypeInt = DicTypeId FROM [ivr].[seg_Dic_KeyType] WHERE TypeName = 'int';
    SELECT @KeyTypeBool = DicTypeId FROM [ivr].[seg_Dic_KeyType] WHERE TypeName = 'bool';
    SELECT @KeyTypeJson = DicTypeId FROM [ivr].[seg_Dic_KeyType] WHERE TypeName = 'json';

    -- Seed segment keys
    MERGE [ivr].[seg_Dic_Key] AS target
    USING (
        -- Language segment keys
        SELECT @SegmentTypeLanguage AS DicSegmentTypeId, 'messageKey' AS KeyName, 'Message Key' AS DisplayName, @KeyTypeString AS DicTypeId, 0 AS IsRequired, NULL AS DefaultValue
        UNION ALL
        SELECT @SegmentTypeLanguage, 'maxAttempts', 'Maximum Attempts', @KeyTypeInt, 0, '3'
        UNION ALL
        SELECT @SegmentTypeLanguage, 'timeout', 'Timeout (milliseconds)', @KeyTypeInt, 0, '5000'
        UNION ALL
        SELECT @SegmentTypeLanguage, 'options', 'Language Options (JSON array)', @KeyTypeJson, 0, NULL
        -- Scheduler segment keys
        UNION ALL
        SELECT @SegmentTypeScheduler, 'schedulerId', 'Scheduler ID', @KeyTypeInt, 0, NULL
        -- Intent segment keys
        UNION ALL
        SELECT @SegmentTypeIntent, 'messageKey', 'Message Key', @KeyTypeString, 0, NULL
        -- Message segment keys
        UNION ALL
        SELECT @SegmentTypeMessage, 'messageKey', 'Message Key', @KeyTypeString, 0, NULL
        -- Matrix segment keys
        UNION ALL
        SELECT @SegmentTypeMatrix, 'customerType', 'Customer Type', @KeyTypeString, 0, NULL
        UNION ALL
        SELECT @SegmentTypeMatrix, 'status', 'Status', @KeyTypeString, 0, NULL
        -- API segment keys
        UNION ALL
        SELECT @SegmentTypeApi, 'serviceId', 'Service ID', @KeyTypeString, 0, NULL
        UNION ALL
        SELECT @SegmentTypeApi, 'useOnlyOnce', 'Use Only Once', @KeyTypeBool, 0, 'false'
        UNION ALL
        SELECT @SegmentTypeApi, 'checkEligibility', 'Check Eligibility', @KeyTypeBool, 0, 'true'
    ) AS source (DicSegmentTypeId, KeyName, DisplayName, DicTypeId, IsRequired, DefaultValue)
    ON target.DicSegmentTypeId = source.DicSegmentTypeId AND target.KeyName = source.KeyName
    WHEN MATCHED THEN
        UPDATE SET
            DisplayName = source.DisplayName,
            DicTypeId = source.DicTypeId,
            IsRequired = source.IsRequired,
            DefaultValue = source.DefaultValue
    WHEN NOT MATCHED THEN
        INSERT (DicSegmentTypeId, KeyName, DisplayName, DicTypeId, IsRequired, DefaultValue, IsDisplayed, IsEditable, IsActive)
        VALUES (source.DicSegmentTypeId, source.KeyName, source.DisplayName, source.DicTypeId, source.IsRequired, source.DefaultValue, 1, 1, 1);

    COMMIT TRAN;

    PRINT '✅ Segment keys seeded successfully (12 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
