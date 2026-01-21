-- =====================================================================
-- Seed: Dictionary - Message Types
-- File: 007_seed_dictionaries_message_types.sql
-- Purpose: Seed msg_Dic_MessageType table with message type definitions
-- Dependencies: None
-- Records: 5 message types (tts, audio_url, llm_message, llm_prompt, llm_dialog)
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Seed message types
    MERGE [ivr].[msg_Dic_MessageType] AS target
    USING (
        SELECT
            'tts' AS Code,
            'Text-to-Speech' AS DisplayName,
            'Text-to-speech message using TTS engine' AS Description,
            '{"type": "object", "properties": {"voiceId": {"type": "string"}, "speed": {"type": "number", "default": 1.0}, "pitch": {"type": "number", "default": 0}}}' AS SettingsSchema,
            '{"voiceId": "", "speed": 1.0, "pitch": 0}' AS DefaultSettings,
            1 AS SortOrder
        UNION ALL
        SELECT
            'audio_url',
            'Audio URL',
            'Pre-recorded audio message from URL',
            '{"type": "object", "properties": {"url": {"type": "string"}, "format": {"type": "string", "enum": ["mp3", "wav", "ogg"]}}}',
            '{"url": "", "format": "mp3"}',
            2
        UNION ALL
        SELECT
            'llm_message',
            'LLM Message',
            'LLM-generated message content',
            '{"type": "object", "properties": {"model": {"type": "string"}, "temperature": {"type": "number", "default": 0.7}, "maxTokens": {"type": "number", "default": 500}}}',
            '{"model": "gpt-4", "temperature": 0.7, "maxTokens": 500}',
            3
        UNION ALL
        SELECT
            'llm_prompt',
            'LLM Prompt',
            'LLM system or user prompt',
            '{"type": "object", "properties": {"role": {"type": "string", "enum": ["system", "user", "assistant"]}, "temperature": {"type": "number", "default": 0.7}}}',
            '{"role": "system", "temperature": 0.7}',
            4
        UNION ALL
        SELECT
            'llm_dialog',
            'LLM Dialog',
            'LLM dialog flow configuration',
            '{"type": "object", "properties": {"conversationId": {"type": "string"}, "context": {"type": "object"}}}',
            '{"conversationId": "", "context": {}}',
            5
    ) AS source (Code, DisplayName, Description, SettingsSchema, DefaultSettings, SortOrder)
    ON target.Code = source.Code
    WHEN MATCHED THEN
        UPDATE SET
            DisplayName = source.DisplayName,
            Description = source.Description,
            SettingsSchema = source.SettingsSchema,
            DefaultSettings = source.DefaultSettings,
            SortOrder = source.SortOrder
    WHEN NOT MATCHED THEN
        INSERT (Code, DisplayName, Description, SettingsSchema, DefaultSettings, SortOrder, IsActive, DateCreated)
        VALUES (source.Code, source.DisplayName, source.Description, source.SettingsSchema, source.DefaultSettings, source.SortOrder, 1, CURRENT_TIMESTAMP);

    COMMIT TRAN;

    PRINT '✅ Message types seeded successfully (5 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
