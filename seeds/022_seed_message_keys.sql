-- =====================================================================
-- Seed: Message Keys (v5.0.0 - MessageKey-level versioning)
-- File: 022_seed_message_keys.sql
-- Purpose: Seed msg_MessageKey, msg_MessageKeyVersion, and msg_MessageLanguageContent tables
--          with sample messages using the new atomic versioning model
-- Dependencies: 020_seed_message_stores.sql, 007_seed_dictionaries_message_types.sql, 
--               008_seed_dictionaries_message_categories.sql, 002_seed_dictionaries_languages.sql
-- Records: ~5 messageKeys with version 1 containing multiple languages
-- Re-run safe: Yes (uses MERGE and checks)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables
    DECLARE @MessageStoreEngieEnergyline INT;
    DECLARE @MessageStoreEngieProf INT;
    DECLARE @MessageStoreDigipolis INT;

    DECLARE @MessageTypeTts INT;
    DECLARE @MessageTypeLlmPrompt INT;

    DECLARE @CategoryWelcome INT;
    DECLARE @CategoryMenu INT;
    DECLARE @CategoryError INT;
    DECLARE @CategoryLlmSystem INT;

    -- Get message store IDs
    SELECT @MessageStoreEngieEnergyline = MessageStoreId FROM [ivr].[msg_MessageStore] WHERE Name = 'ENGIE Energyline Messages';
    SELECT @MessageStoreEngieProf = MessageStoreId FROM [ivr].[msg_MessageStore] WHERE Name = 'ENGIE Professional Messages';
    SELECT @MessageStoreDigipolis = MessageStoreId FROM [ivr].[msg_MessageStore] WHERE Name = 'Digipolis Default Messages';

    -- Validate that required message stores exist
    IF @MessageStoreEngieEnergyline IS NULL
    BEGIN
        RAISERROR('Message store "ENGIE Energyline Messages" not found. Please run 020_seed_message_stores.sql first.', 16, 1);
        ROLLBACK TRAN;
        RETURN;
    END

    -- Get message type IDs
    SELECT @MessageTypeTts = MessageTypeId FROM [ivr].[msg_Dic_MessageType] WHERE Code = 'tts';
    SELECT @MessageTypeLlmPrompt = MessageTypeId FROM [ivr].[msg_Dic_MessageType] WHERE Code = 'llm_prompt';

    -- Get category IDs
    SELECT @CategoryWelcome = CategoryId FROM [ivr].[msg_Dic_MessageCategory] WHERE Code = 'welcome';
    SELECT @CategoryMenu = CategoryId FROM [ivr].[msg_Dic_MessageCategory] WHERE Code = 'menu';
    SELECT @CategoryError = CategoryId FROM [ivr].[msg_Dic_MessageCategory] WHERE Code = 'error';
    SELECT @CategoryLlmSystem = CategoryId FROM [ivr].[msg_Dic_MessageCategory] WHERE Code = 'llm_system';

    -- Declare variables for message keys and versions (must be at batch level in SQL Server)
    DECLARE @MessageKeyId1 INT, @MessageKeyId2 INT, @MessageKeyId3 INT, @MessageKeyId4 INT, @MessageKeyId5 INT;
    DECLARE @VersionId1 UNIQUEIDENTIFIER, @VersionId2 UNIQUEIDENTIFIER, @VersionId3 UNIQUEIDENTIFIER, @VersionId4 UNIQUEIDENTIFIER, @VersionId5 UNIQUEIDENTIFIER;

    -- =====================================================================
    -- ENGIE Energyline Messages
    -- =====================================================================

    -- WELCOME messageKey (with nl-BE and fr-BE)
    IF NOT EXISTS (SELECT 1 FROM [ivr].[msg_MessageKey] WHERE MessageStoreId = @MessageStoreEngieEnergyline AND MessageKey = 'WELCOME')
    BEGIN
        SET @VersionId1 = NEWID();

        -- Create MessageKey
        INSERT INTO [ivr].[msg_MessageKey] (
            MessageStoreId, MessageKey, DicMessageTypeId, DicMessageCategoryId, 
            PublishedVersion, DisplayName, Description, DateCreated, DateUpdated
        )
        VALUES (
            @MessageStoreEngieEnergyline, 'WELCOME', @MessageTypeTts, @CategoryWelcome,
            1, 'Welcome Message', 'Welcome message for ENGIE Energyline', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        SET @MessageKeyId1 = SCOPE_IDENTITY();

        -- Create MessageKeyVersion (version 1)
        INSERT INTO [ivr].[msg_MessageKeyVersion] (
            MessageKeyVersionId, MessageKeyId, Version, VersionName, IsActive, DateCreated
        )
        VALUES (
            @VersionId1, @MessageKeyId1, 1, 'Initial Version', 1, CURRENT_TIMESTAMP
        );

        -- Create MessageLanguageContent for nl-BE
        INSERT INTO [ivr].[msg_MessageLanguageContent] (
            MessageKeyVersionId, Language, Content, TypeSettings, DateCreated, DateUpdated
        )
        VALUES (
            @VersionId1, 'nl-BE', 
            'Welkom bij ENGIE Energyline. Hoe kan ik u helpen?',
            '{"voiceId": "nl-BE-Wavenet-A", "speed": 1.0}',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );

        -- Create MessageLanguageContent for fr-BE
        INSERT INTO [ivr].[msg_MessageLanguageContent] (
            MessageKeyVersionId, Language, Content, TypeSettings, DateCreated, DateUpdated
        )
        VALUES (
            @VersionId1, 'fr-BE',
            'Bienvenue chez ENGIE Energyline. Comment puis-je vous aider?',
            '{"voiceId": "fr-BE-Wavenet-A", "speed": 1.0}',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END

    -- MENU_MAIN messageKey (with nl-BE and fr-BE)
    IF NOT EXISTS (SELECT 1 FROM [ivr].[msg_MessageKey] WHERE MessageStoreId = @MessageStoreEngieEnergyline AND MessageKey = 'MENU_MAIN')
    BEGIN
        SET @VersionId2 = NEWID();

        -- Create MessageKey
        INSERT INTO [ivr].[msg_MessageKey] (
            MessageStoreId, MessageKey, DicMessageTypeId, DicMessageCategoryId,
            PublishedVersion, DisplayName, Description, DateCreated, DateUpdated
        )
        VALUES (
            @MessageStoreEngieEnergyline, 'MENU_MAIN', @MessageTypeTts, @CategoryMenu,
            1, 'Main Menu', 'Main menu prompt', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        SET @MessageKeyId2 = SCOPE_IDENTITY();

        -- Create MessageKeyVersion (version 1)
        INSERT INTO [ivr].[msg_MessageKeyVersion] (
            MessageKeyVersionId, MessageKeyId, Version, VersionName, IsActive, DateCreated
        )
        VALUES (
            @VersionId2, @MessageKeyId2, 1, 'Initial Version', 1, CURRENT_TIMESTAMP
        );

        -- Create MessageLanguageContent for nl-BE
        INSERT INTO [ivr].[msg_MessageLanguageContent] (
            MessageKeyVersionId, Language, Content, TypeSettings, DateCreated, DateUpdated
        )
        VALUES (
            @VersionId2, 'nl-BE',
            'Druk op 1 voor facturen, druk op 2 voor storingen, druk op 3 voor algemene vragen.',
            '{"voiceId": "nl-BE-Wavenet-A", "speed": 1.0}',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );

        -- Create MessageLanguageContent for fr-BE
        INSERT INTO [ivr].[msg_MessageLanguageContent] (
            MessageKeyVersionId, Language, Content, TypeSettings, DateCreated, DateUpdated
        )
        VALUES (
            @VersionId2, 'fr-BE',
            'Appuyez sur 1 pour les factures, appuyez sur 2 pour les pannes, appuyez sur 3 pour les questions générales.',
            '{"voiceId": "fr-BE-Wavenet-A", "speed": 1.0}',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END

    -- ERROR_GENERIC messageKey (with nl-BE and fr-BE)
    IF NOT EXISTS (SELECT 1 FROM [ivr].[msg_MessageKey] WHERE MessageStoreId = @MessageStoreEngieEnergyline AND MessageKey = 'ERROR_GENERIC')
    BEGIN
        SET @VersionId3 = NEWID();

        -- Create MessageKey
        INSERT INTO [ivr].[msg_MessageKey] (
            MessageStoreId, MessageKey, DicMessageTypeId, DicMessageCategoryId,
            PublishedVersion, DisplayName, Description, DateCreated, DateUpdated
        )
        VALUES (
            @MessageStoreEngieEnergyline, 'ERROR_GENERIC', @MessageTypeTts, @CategoryError,
            1, 'Generic Error', 'Generic error message', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        SET @MessageKeyId3 = SCOPE_IDENTITY();

        -- Create MessageKeyVersion (version 1)
        INSERT INTO [ivr].[msg_MessageKeyVersion] (
            MessageKeyVersionId, MessageKeyId, Version, VersionName, IsActive, DateCreated
        )
        VALUES (
            @VersionId3, @MessageKeyId3, 1, 'Initial Version', 1, CURRENT_TIMESTAMP
        );

        -- Create MessageLanguageContent for nl-BE
        INSERT INTO [ivr].[msg_MessageLanguageContent] (
            MessageKeyVersionId, Language, Content, TypeSettings, DateCreated, DateUpdated
        )
        VALUES (
            @VersionId3, 'nl-BE',
            'Er is een fout opgetreden. Probeer het later opnieuw.',
            '{"voiceId": "nl-BE-Wavenet-A", "speed": 1.0}',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );

        -- Create MessageLanguageContent for fr-BE
        INSERT INTO [ivr].[msg_MessageLanguageContent] (
            MessageKeyVersionId, Language, Content, TypeSettings, DateCreated, DateUpdated
        )
        VALUES (
            @VersionId3, 'fr-BE',
            'Une erreur s''est produite. Veuillez réessayer plus tard.',
            '{"voiceId": "fr-BE-Wavenet-A", "speed": 1.0}',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END

    -- LLM_SYSTEM_PROMPT messageKey (with nl-BE and fr-BE)
    IF NOT EXISTS (SELECT 1 FROM [ivr].[msg_MessageKey] WHERE MessageStoreId = @MessageStoreEngieEnergyline AND MessageKey = 'LLM_SYSTEM_PROMPT')
    BEGIN
        SET @VersionId4 = NEWID();

        -- Create MessageKey
        INSERT INTO [ivr].[msg_MessageKey] (
            MessageStoreId, MessageKey, DicMessageTypeId, DicMessageCategoryId,
            PublishedVersion, DisplayName, Description, DateCreated, DateUpdated
        )
        VALUES (
            @MessageStoreEngieEnergyline, 'LLM_SYSTEM_PROMPT', @MessageTypeLlmPrompt, @CategoryLlmSystem,
            1, 'LLM System Prompt', 'System prompt for LLM assistant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        SET @MessageKeyId4 = SCOPE_IDENTITY();

        -- Create MessageKeyVersion (version 1)
        INSERT INTO [ivr].[msg_MessageKeyVersion] (
            MessageKeyVersionId, MessageKeyId, Version, VersionName, IsActive, DateCreated
        )
        VALUES (
            @VersionId4, @MessageKeyId4, 1, 'Initial Version', 1, CURRENT_TIMESTAMP
        );

        -- Create MessageLanguageContent for nl-BE
        INSERT INTO [ivr].[msg_MessageLanguageContent] (
            MessageKeyVersionId, Language, Content, TypeSettings, DateCreated, DateUpdated
        )
        VALUES (
            @VersionId4, 'nl-BE',
            'Je bent een behulpzame assistent voor ENGIE Energyline. Je helpt klanten met vragen over energie, facturen en storingen. Wees vriendelijk en professioneel.',
            '{"role": "system", "temperature": 0.7}',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );

        -- Create MessageLanguageContent for fr-BE
        INSERT INTO [ivr].[msg_MessageLanguageContent] (
            MessageKeyVersionId, Language, Content, TypeSettings, DateCreated, DateUpdated
        )
        VALUES (
            @VersionId4, 'fr-BE',
            'Vous êtes un assistant utile pour ENGIE Energyline. Vous aidez les clients avec des questions sur l''énergie, les factures et les pannes. Soyez amical et professionnel.',
            '{"role": "system", "temperature": 0.7}',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END

    -- =====================================================================
    -- ENGIE Professional Messages (if store exists)
    -- =====================================================================

    IF @MessageStoreEngieProf IS NOT NULL
    BEGIN
        -- WELCOME messageKey for ENGIE Professional
        IF NOT EXISTS (SELECT 1 FROM [ivr].[msg_MessageKey] WHERE MessageStoreId = @MessageStoreEngieProf AND MessageKey = 'WELCOME')
        BEGIN
            SET @VersionId5 = NEWID();

            -- Create MessageKey
            INSERT INTO [ivr].[msg_MessageKey] (
                MessageStoreId, MessageKey, DicMessageTypeId, DicMessageCategoryId,
                PublishedVersion, DisplayName, Description, DateCreated, DateUpdated
            )
            VALUES (
                @MessageStoreEngieProf, 'WELCOME', @MessageTypeTts, @CategoryWelcome,
                1, 'Welcome Message', 'Welcome message for ENGIE Professional', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
            SET @MessageKeyId5 = SCOPE_IDENTITY();

            -- Create MessageKeyVersion (version 1)
            INSERT INTO [ivr].[msg_MessageKeyVersion] (
                MessageKeyVersionId, MessageKeyId, Version, VersionName, IsActive, DateCreated
            )
            VALUES (
                @VersionId5, @MessageKeyId5, 1, 'Initial Version', 1, CURRENT_TIMESTAMP
            );

            -- Create MessageLanguageContent for nl-BE
            INSERT INTO [ivr].[msg_MessageLanguageContent] (
                MessageKeyVersionId, Language, Content, TypeSettings, DateCreated, DateUpdated
            )
            VALUES (
                @VersionId5, 'nl-BE',
                'Welkom bij ENGIE Professional. U wordt doorverbonden met een medewerker.',
                '{"voiceId": "nl-BE-Wavenet-A", "speed": 1.0}',
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );

            -- Create MessageLanguageContent for fr-BE
            INSERT INTO [ivr].[msg_MessageLanguageContent] (
                MessageKeyVersionId, Language, Content, TypeSettings, DateCreated, DateUpdated
            )
            VALUES (
                @VersionId5, 'fr-BE',
                'Bienvenue chez ENGIE Professional. Vous allez être mis en relation avec un agent.',
                '{"voiceId": "fr-BE-Wavenet-A", "speed": 1.0}',
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
        END
    END

    COMMIT TRAN;

    PRINT '✅ Message keys seeded successfully (~5 messageKeys with version 1 containing multiple languages)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
