-- =====================================================================
-- Seed: Routing Tables
-- File: 010_seed_routing_tables.sql
-- Purpose: Seed rt_RoutingTable table with sourceId → routingId mappings
-- Dependencies: 003_seed_dictionaries_company_projects.sql, 002_seed_dictionaries_languages.sql, 020_seed_message_stores.sql
-- Records: 3 routing table entries
-- Re-run safe: Yes (uses MERGE)
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables
    DECLARE @CompanyProjectEngieEnergyline INT;
    DECLARE @MessageStoreEngieEnergyline INT;

    -- Get company project IDs
    SELECT @CompanyProjectEngieEnergyline = CompanyProjectId FROM [ivr].[cfg_Dic_CompanyProject] WHERE CustomerId = 'ENGIE' AND ProjectId = 'ENERGYLINE';

    -- Validate that company project was found
    IF @CompanyProjectEngieEnergyline IS NULL
    BEGIN
        RAISERROR('Company project ENGIE/ENERGYLINE not found. Please run 003_seed_dictionaries_company_projects.sql first.', 16, 1);
        RETURN;
    END

    -- Get message store IDs
    SELECT @MessageStoreEngieEnergyline = MessageStoreId FROM [ivr].[msg_MessageStore] WHERE Name = 'ENGIE Energyline Messages';

    -- Validate that message store was found (optional, can be NULL)
    -- IF @MessageStoreEngieEnergyline IS NULL
    -- BEGIN
    --     RAISERROR('Message store "ENGIE Energyline Messages" not found. Please run 020_seed_message_stores.sql first.', 16, 1);
    --     RETURN;
    -- END

    -- Seed routing tables
    MERGE [ivr].[rt_RoutingTable] AS target
    USING (
        SELECT
            NEWID() AS RoutingTableId,
            '+3257351230' AS SourceId,
            'EEBL-ENERGYLINE-MAIN' AS RoutingId,
            @CompanyProjectEngieEnergyline AS DicCompanyProjectId,
            'nl-BE' AS LanguageCode,
            @MessageStoreEngieEnergyline AS MessageStoreId,
            159 AS SchedulerId,
            'get_language' AS InitSegment,
            '{"enableAsr": true}' AS FeatureFlags,
            '{"logVarActive": true, "logSegmentActive": true, "logCdbActive": true}' AS Config
    ) AS source (RoutingTableId, SourceId, RoutingId, DicCompanyProjectId, LanguageCode, MessageStoreId, SchedulerId, InitSegment, FeatureFlags, Config)
    ON target.SourceId = source.SourceId
    WHEN MATCHED THEN
        UPDATE SET
            RoutingId = source.RoutingId,
            DicCompanyProjectId = source.DicCompanyProjectId,
            LanguageCode = source.LanguageCode,
            MessageStoreId = source.MessageStoreId,
            SchedulerId = source.SchedulerId,
            InitSegment = source.InitSegment,
            FeatureFlags = source.FeatureFlags,
            Config = source.Config,
            DateUpdated = CURRENT_TIMESTAMP
    WHEN NOT MATCHED THEN
        INSERT (RoutingTableId, SourceId, RoutingId, DicCompanyProjectId, LanguageCode, MessageStoreId, SchedulerId, InitSegment, FeatureFlags, Config, IsActive, DateCreated, DateUpdated)
        VALUES (source.RoutingTableId, source.SourceId, source.RoutingId, source.DicCompanyProjectId, source.LanguageCode, source.MessageStoreId, source.SchedulerId, source.InitSegment, source.FeatureFlags, source.Config, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    COMMIT TRAN;

    PRINT '✅ Routing tables seeded successfully (1 record)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
