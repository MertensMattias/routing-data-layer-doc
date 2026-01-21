-- =====================================================================
-- Seed: Dictionary - Message Categories
-- File: 008_seed_dictionaries_message_categories.sql
-- Purpose: Seed msg_Dic_MessageCategory table with message category definitions
-- Dependencies: None
-- Records: 9 message categories
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Seed message categories
    MERGE [ivr].[msg_Dic_MessageCategory] AS target
    USING (
        SELECT 'welcome' AS Code, 'Welcome' AS DisplayName, 'Welcome and greeting messages' AS Description, 'hand-wave' AS Icon, '#4CAF50' AS Color, 1 AS SortOrder
        UNION ALL
        SELECT 'menu', 'Menu', 'Menu option prompts', 'menu', '#2196F3', 2
        UNION ALL
        SELECT 'identification', 'Identification', 'Customer identification prompts', 'fingerprint', '#FF9800', 3
        UNION ALL
        SELECT 'queue', 'Queue', 'Queue and wait messages', 'clock', '#9C27B0', 4
        UNION ALL
        SELECT 'transfer', 'Transfer', 'Call transfer messages', 'phone-forward', '#F44336', 5
        UNION ALL
        SELECT 'error', 'Error', 'Error and exception messages', 'alert-circle', '#E91E63', 6
        UNION ALL
        SELECT 'llm_system', 'LLM System', 'LLM system prompts', 'brain', '#00BCD4', 7
        UNION ALL
        SELECT 'llm_user', 'LLM User', 'LLM user prompts', 'user', '#009688', 8
        UNION ALL
        SELECT 'general', 'General', 'General purpose messages', 'message-square', '#607D8B', 9
    ) AS source (Code, DisplayName, Description, Icon, Color, SortOrder)
    ON target.Code = source.Code
    WHEN MATCHED THEN
        UPDATE SET
            DisplayName = source.DisplayName,
            Description = source.Description,
            Icon = source.Icon,
            Color = source.Color,
            SortOrder = source.SortOrder
    WHEN NOT MATCHED THEN
        INSERT (Code, DisplayName, Description, Icon, Color, SortOrder, IsActive, DateCreated)
        VALUES (source.Code, source.DisplayName, source.Description, source.Icon, source.Color, source.SortOrder, 1, CURRENT_TIMESTAMP);

    COMMIT TRAN;

    PRINT '✅ Message categories seeded successfully (9 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
