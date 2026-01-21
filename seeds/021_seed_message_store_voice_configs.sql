-- =====================================================================
-- Seed: Message Store Voice Configs
-- File: 021_seed_message_store_voice_configs.sql
-- Purpose: Seed msg_MessageStoreVoiceConfig table with voice configurations per store
-- Dependencies: 020_seed_message_stores.sql, 009_seed_dictionaries_voices.sql, 002_seed_dictionaries_languages.sql
-- Records: ~9 voice configs (3 stores × 3 languages)
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables for message store and voice IDs
    DECLARE @MessageStoreEngieEnergyline INT;
    DECLARE @MessageStoreEngieProf INT;
    DECLARE @MessageStoreDigipolis INT;

    DECLARE @VoiceNlBeWavenetA INT;
    DECLARE @VoiceNlBeWavenetB INT;
    DECLARE @VoiceFrBeWavenetA INT;
    DECLARE @VoiceNlBeNeural INT;
    DECLARE @VoiceFrBeNeural INT;

    -- Get message store IDs
    SELECT @MessageStoreEngieEnergyline = MessageStoreId FROM [ivr].[msg_MessageStore] WHERE Name = 'ENGIE Energyline Messages';
    SELECT @MessageStoreEngieProf = MessageStoreId FROM [ivr].[msg_MessageStore] WHERE Name = 'ENGIE Professional Messages';
    SELECT @MessageStoreDigipolis = MessageStoreId FROM [ivr].[msg_MessageStore] WHERE Name = 'Digipolis Default Messages';

    -- Validate that required message store exists
    IF @MessageStoreEngieEnergyline IS NULL
    BEGIN
        RAISERROR('Message store "ENGIE Energyline Messages" not found. Please run 020_seed_message_stores.sql first.', 16, 1);
        ROLLBACK TRAN;
        RETURN;
    END

    -- Get voice IDs
    SELECT @VoiceNlBeWavenetA = VoiceId FROM [ivr].[cfg_Dic_Voice] WHERE Code = 'nl-BE-Wavenet-A';
    SELECT @VoiceNlBeWavenetB = VoiceId FROM [ivr].[cfg_Dic_Voice] WHERE Code = 'nl-BE-Wavenet-B';
    SELECT @VoiceFrBeWavenetA = VoiceId FROM [ivr].[cfg_Dic_Voice] WHERE Code = 'fr-BE-Wavenet-A';
    SELECT @VoiceNlBeNeural = VoiceId FROM [ivr].[cfg_Dic_Voice] WHERE Code = 'nl-BE-Neural';
    SELECT @VoiceFrBeNeural = VoiceId FROM [ivr].[cfg_Dic_Voice] WHERE Code = 'fr-BE-Neural';

    -- Seed voice configs (only for stores that exist)
    -- Build source data conditionally to avoid NULL message store IDs
    DECLARE @VoiceConfigData TABLE (
        MessageStoreId INT NOT NULL,
        Language VARCHAR(10) NOT NULL,
        DicVoiceId INT NOT NULL,
        IsDefault BIT NOT NULL,
        SortOrder INT NOT NULL
    );

    -- ENGIE Energyline: nl-BE default, fr-BE
    IF @MessageStoreEngieEnergyline IS NOT NULL
    BEGIN
        INSERT INTO @VoiceConfigData (MessageStoreId, Language, DicVoiceId, IsDefault, SortOrder)
        VALUES
            (@MessageStoreEngieEnergyline, 'nl-BE', @VoiceNlBeWavenetA, 1, 1),
            (@MessageStoreEngieEnergyline, 'fr-BE', @VoiceFrBeWavenetA, 1, 2);
    END

    -- ENGIE Professional: nl-BE default, fr-BE (only if store exists)
    IF @MessageStoreEngieProf IS NOT NULL
    BEGIN
        INSERT INTO @VoiceConfigData (MessageStoreId, Language, DicVoiceId, IsDefault, SortOrder)
        VALUES
            (@MessageStoreEngieProf, 'nl-BE', @VoiceNlBeWavenetA, 1, 1),
            (@MessageStoreEngieProf, 'fr-BE', @VoiceFrBeWavenetA, 1, 2);
    END

    -- Digipolis: nl-BE default, fr-BE (only if store exists, using Azure voices)
    IF @MessageStoreDigipolis IS NOT NULL
    BEGIN
        INSERT INTO @VoiceConfigData (MessageStoreId, Language, DicVoiceId, IsDefault, SortOrder)
        VALUES
            (@MessageStoreDigipolis, 'nl-BE', @VoiceNlBeNeural, 1, 1),
            (@MessageStoreDigipolis, 'fr-BE', @VoiceFrBeNeural, 1, 2);
    END

    -- Merge voice configs
    MERGE [ivr].[msg_MessageStoreVoiceConfig] AS target
    USING @VoiceConfigData AS source
    ON target.MessageStoreId = source.MessageStoreId AND target.Language = source.Language AND target.DicVoiceId = source.DicVoiceId
    WHEN MATCHED THEN
        UPDATE SET
            IsDefault = source.IsDefault,
            SortOrder = source.SortOrder
    WHEN NOT MATCHED THEN
        INSERT (MessageStoreId, Language, DicVoiceId, IsDefault, SortOrder)
        VALUES (source.MessageStoreId, source.Language, source.DicVoiceId, source.IsDefault, source.SortOrder);

    COMMIT TRAN;

    PRINT '✅ Message store voice configs seeded successfully (~6 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
