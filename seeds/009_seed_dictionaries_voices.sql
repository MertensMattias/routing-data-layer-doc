-- =====================================================================
-- Seed: Dictionary - Voices
-- File: 009_seed_dictionaries_voices.sql
-- Purpose: Seed cfg_Dic_Voice table with TTS voice definitions
-- Dependencies: 002_seed_dictionaries_languages.sql
-- Records: 5 voices (Google and Azure engines)
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Seed voices
    MERGE [ivr].[cfg_Dic_Voice] AS target
    USING (
        SELECT 'nl-BE-Wavenet-A' AS Code, 'google' AS Engine, 'nl-BE' AS Language, 'Dutch (Belgium) Wavenet A' AS DisplayName, 'female' AS Gender, 'wavenet' AS Style, NULL AS SampleUrl, 1 AS SortOrder
        UNION ALL
        SELECT 'nl-BE-Wavenet-B', 'google', 'nl-BE', 'Dutch (Belgium) Wavenet B', 'male', 'wavenet', NULL, 2
        UNION ALL
        SELECT 'fr-BE-Wavenet-A', 'google', 'fr-BE', 'French (Belgium) Wavenet A', 'female', 'wavenet', NULL, 3
        UNION ALL
        SELECT 'nl-BE-Neural', 'azure', 'nl-BE', 'Dutch (Belgium) Neural', 'female', 'neural', NULL, 4
        UNION ALL
        SELECT 'fr-BE-Neural', 'azure', 'fr-BE', 'French (Belgium) Neural', 'female', 'neural', NULL, 5
    ) AS source (Code, Engine, Language, DisplayName, Gender, Style, SampleUrl, SortOrder)
    ON target.Code = source.Code
    WHEN MATCHED THEN
        UPDATE SET
            Engine = source.Engine,
            Language = source.Language,
            DisplayName = source.DisplayName,
            Gender = source.Gender,
            Style = source.Style,
            SampleUrl = source.SampleUrl,
            SortOrder = source.SortOrder
    WHEN NOT MATCHED THEN
        INSERT (Code, Engine, Language, DisplayName, Gender, Style, SampleUrl, SortOrder, IsActive, DateCreated)
        VALUES (source.Code, source.Engine, source.Language, source.DisplayName, source.Gender, source.Style, source.SampleUrl, source.SortOrder, 1, CURRENT_TIMESTAMP);

    COMMIT TRAN;

    PRINT '✅ Voices seeded successfully (5 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
