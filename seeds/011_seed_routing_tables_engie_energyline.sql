-- =====================================================================
-- Seed: Routing Tables - ENGIE ENERGYLINE
-- File: 011_seed_routing_tables_engie_energyline.sql
-- Purpose: Seed rt_RoutingTable table with sourceId → routingId mappings from import_globalLines
-- Dependencies: 003_seed_dictionaries_company_projects.sql, 002_seed_dictionaries_languages.sql
-- Records: ~40 routing table entries (all environments combined, but environment isolation is deployment-based)
-- Re-run safe: Yes (uses MERGE)
-- Source: import_globalLines LINE_DEFINITIONS
-- =====================================================================

BEGIN TRY
    BEGIN TRAN;

    -- Declare variables
    DECLARE @CompanyProjectEngieEnergyline INT;
    DECLARE @CompanyProjectEngieProf INT;

    -- Get company project IDs
    SELECT @CompanyProjectEngieEnergyline = CompanyProjectId FROM [ivr].[cfg_Dic_CompanyProject] WHERE CustomerId = 'ENGIE' AND ProjectId = 'ENERGYLINE';
    SELECT @CompanyProjectEngieProf = CompanyProjectId FROM [ivr].[cfg_Dic_CompanyProject] WHERE CustomerId = 'ENGIE' AND ProjectId = 'PROF';

    -- Base config from BASE_TEMPLATE and CUSTOMER_TEMPLATES
    DECLARE @BaseConfig NVARCHAR(4000) = '{"routing":{"enableLanguageFallback":true,"fallbackLanguage":"NL","supportedLanguages":["NL","FR","DE","EN"],"customerTypes":["RESI","PROF"],"customerStatuses":["NOT_IDENTIFIED","STANDARD","RETENTION","LEGAL_RECOVERY","FROZEN_KALUZA","MIGRATED_KALUZA"],"fallbackSegment":"RESI_OTHER","errorSegment":"ERROR_DEFAULT_ROUTE","segmentResetCodes":["GET_INTENT","NEW_INTENT","OTHER_INTENT"]},"intents":{"enableLLMMode":false,"useDynamicIntents":true,"enableIntentFallback":true,"cacheFile":"intentStore.json","skipBaselineIfTarget":true,"forceReloadCsvInput":false,"baselineCustomerType":"RESI","baselineCustomerStatus":"NOT_IDENTIFIED","combinations":["RESI_STANDARD","RESI_RETENTION","RESI_LEGAL_RECOVERY","RESI_FROZEN_KALUZA","RESI_MIGRATED_KALUZA","PROF_NOT_IDENTIFIED","PROF_STANDARD","PROF_RETENTION","PROF_LEGAL_RECOVERY","PROF_FROZEN_KALUZA","PROF_MIGRATED_KALUZA"],"applicationOrder":["STANDARD","RETENTION","LEGAL_RECOVERY","FROZEN_KALUZA","MIGRATED_KALUZA"],"segments":["GET_INTENT","NEW_INTENT","OTHER_INTENT"],"metaKeys":["segmentType","segmentConfig","cdb"]},"session":{"persistentKeys":["customer","language","environment","interactionStartTime","extension","selfService","remoteAddress","remoteName","diversionReason"]},"debug":{"devNumbers":["+32478306999"]},"logVarActive":true,"logSegmentActive":true,"logCdbActive":true,"speechHistoryActive":true,"speechLoggingActive":true}';

    DECLARE @ProfConfig NVARCHAR(4000) = '{"routing":{"enableLanguageFallback":true,"fallbackLanguage":"NL","supportedLanguages":["NL","FR","DE","EN"],"customerTypes":["RESI","PROF"],"customerStatuses":["NOT_IDENTIFIED","STANDARD","RETENTION","LEGAL_RECOVERY","FROZEN_KALUZA","MIGRATED_KALUZA"],"fallbackSegment":"PROF_OTHER","errorSegment":"ERROR_DEFAULT_ROUTE","segmentResetCodes":["GET_INTENT","NEW_INTENT","OTHER_INTENT"]},"intents":{"enableLLMMode":false,"useDynamicIntents":true,"enableIntentFallback":true,"cacheFile":"intentStore.json","skipBaselineIfTarget":true,"forceReloadCsvInput":false,"baselineCustomerType":"RESI","baselineCustomerStatus":"NOT_IDENTIFIED","combinations":["RESI_STANDARD","RESI_RETENTION","RESI_LEGAL_RECOVERY","RESI_FROZEN_KALUZA","RESI_MIGRATED_KALUZA","PROF_NOT_IDENTIFIED","PROF_STANDARD","PROF_RETENTION","PROF_LEGAL_RECOVERY","PROF_FROZEN_KALUZA","PROF_MIGRATED_KALUZA"],"applicationOrder":["STANDARD","RETENTION","LEGAL_RECOVERY","FROZEN_KALUZA","MIGRATED_KALUZA"],"segments":["GET_INTENT","NEW_INTENT","OTHER_INTENT"],"metaKeys":["segmentType","segmentConfig","cdb"]},"session":{"persistentKeys":["customer","language","environment","interactionStartTime","extension","selfService","remoteAddress","remoteName","diversionReason"]},"debug":{"devNumbers":["+32478306999"]},"logVarActive":true,"logSegmentActive":true,"logCdbActive":true,"speechHistoryActive":true,"speechLoggingActive":true}';

    -- Seed routing tables from LINE_DEFINITIONS
    -- Note: Environment isolation is deployment-based (separate databases), so all entries work for all environments
    MERGE [ivr].[rt_RoutingTable] AS target
    USING (
        -- ENERGYLINE entries (prd, acc, dvp combined - environment handled by deployment)
        SELECT NEWID() AS RoutingTableId, '+3225939730' AS SourceId, 'ENGIE-ENERGYLINE' AS RoutingId, @CompanyProjectEngieEnergyline AS DicCompanyProjectId, 'nl-BE' AS LanguageCode, NULL AS MessageStoreId, 159 AS SchedulerId, 'GET_LANGUAGE' AS InitSegment, '{}' AS FeatureFlags, @BaseConfig AS Config
        UNION ALL SELECT NEWID(), '+3225939731', 'ENGIE-ENERGYLINE-NL', @CompanyProjectEngieEnergyline, 'nl-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '+3225939732', 'ENGIE-ENERGYLINE-FR', @CompanyProjectEngieEnergyline, 'fr-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '+3225939733', 'ENGIE-ENERGYLINE-DE', @CompanyProjectEngieEnergyline, 'de-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '+3225939734', 'ENGIE-ENERGYLINE-EN', @CompanyProjectEngieEnergyline, 'en-GB', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '560030', 'ENGIE-ENERGYLINE', @CompanyProjectEngieEnergyline, 'nl-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '560031', 'ENGIE-ENERGYLINE-NL', @CompanyProjectEngieEnergyline, 'nl-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '560032', 'ENGIE-ENERGYLINE-FR', @CompanyProjectEngieEnergyline, 'fr-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '560033', 'ENGIE-ENERGYLINE-DE', @CompanyProjectEngieEnergyline, 'de-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '560034', 'ENGIE-ENERGYLINE-EN', @CompanyProjectEngieEnergyline, 'en-GB', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), 'engie-energyline-nl', 'ENGIE-ENERGYLINE-NL', @CompanyProjectEngieEnergyline, 'nl-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), 'engie-energyline-fr', 'ENGIE-ENERGYLINE-FR', @CompanyProjectEngieEnergyline, 'fr-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), 'engie-energyline-de', 'ENGIE-ENERGYLINE-DE', @CompanyProjectEngieEnergyline, 'de-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), 'engie-energyline-en', 'ENGIE-ENERGYLINE-EN', @CompanyProjectEngieEnergyline, 'en-GB', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), 'engie-error', 'ENGIE-ERROR', @CompanyProjectEngieEnergyline, 'nl-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), 'engie-error-nl', 'ENGIE-ERROR-NL', @CompanyProjectEngieEnergyline, 'nl-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), 'engie-error-fr', 'ENGIE-ERROR-FR', @CompanyProjectEngieEnergyline, 'fr-BE', NULL, 159, 'GET_LANGUAGE', '{}', @BaseConfig
        -- ACC environment entries (schedulerId 4077)
        UNION ALL SELECT NEWID(), '+3257351050', 'ENGIE-ENERGYLINE', @CompanyProjectEngieEnergyline, 'nl-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '+3257351051', 'ENGIE-ENERGYLINE-NL', @CompanyProjectEngieEnergyline, 'nl-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '+3257351052', 'ENGIE-ENERGYLINE-FR', @CompanyProjectEngieEnergyline, 'fr-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '+3257351053', 'ENGIE-ENERGYLINE-DE', @CompanyProjectEngieEnergyline, 'de-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '+3257351054', 'ENGIE-ENERGYLINE-EN', @CompanyProjectEngieEnergyline, 'en-GB', NULL, 4077, 'GET_LANGUAGE', '{}', @BaseConfig
        -- DVP environment entries (schedulerId 4077)
        UNION ALL SELECT NEWID(), '+3224581030', 'ENGIE-ENERGYLINE', @CompanyProjectEngieEnergyline, 'nl-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '+3224581031', 'ENGIE-ENERGYLINE-NL', @CompanyProjectEngieEnergyline, 'nl-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '+3224581032', 'ENGIE-ENERGYLINE-FR', @CompanyProjectEngieEnergyline, 'fr-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '+3224581033', 'ENGIE-ENERGYLINE-DE', @CompanyProjectEngieEnergyline, 'de-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @BaseConfig
        UNION ALL SELECT NEWID(), '+3224581034', 'ENGIE-ENERGYLINE-EN', @CompanyProjectEngieEnergyline, 'en-GB', NULL, 4077, 'GET_LANGUAGE', '{}', @BaseConfig
        -- PROF entries (prd)
        UNION ALL SELECT NEWID(), '+3225939735', 'ENGIE-PROF', @CompanyProjectEngieProf, 'nl-BE', NULL, 159, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3225939736', 'ENGIE-PROF-NL', @CompanyProjectEngieProf, 'nl-BE', NULL, 159, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3225939737', 'ENGIE-PROF-FR', @CompanyProjectEngieProf, 'fr-BE', NULL, 159, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3225939738', 'ENGIE-PROF-DE', @CompanyProjectEngieProf, 'de-BE', NULL, 159, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3225939739', 'ENGIE-PROF-EN', @CompanyProjectEngieProf, 'en-GB', NULL, 159, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), 'engie-prof-nl', 'ENGIE-PROF-NL', @CompanyProjectEngieProf, 'nl-BE', NULL, 159, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), 'engie-prof-fr', 'ENGIE-PROF-FR', @CompanyProjectEngieProf, 'fr-BE', NULL, 159, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), 'engie-prof-de', 'ENGIE-PROF-DE', @CompanyProjectEngieProf, 'de-BE', NULL, 159, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), 'engie-prof-en', 'ENGIE-PROF-EN', @CompanyProjectEngieProf, 'en-GB', NULL, 159, 'GET_LANGUAGE', '{}', @ProfConfig
        -- PROF entries (acc)
        UNION ALL SELECT NEWID(), '+3257351055', 'ENGIE-PROF', @CompanyProjectEngieProf, 'nl-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3257351056', 'ENGIE-PROF-NL', @CompanyProjectEngieProf, 'nl-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3257351057', 'ENGIE-PROF-FR', @CompanyProjectEngieProf, 'fr-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3257351058', 'ENGIE-PROF-DE', @CompanyProjectEngieProf, 'de-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3257351059', 'ENGIE-PROF-EN', @CompanyProjectEngieProf, 'en-GB', NULL, 4077, 'GET_LANGUAGE', '{}', @ProfConfig
        -- PROF entries (dvp)
        UNION ALL SELECT NEWID(), '+3224581035', 'ENGIE-PROF', @CompanyProjectEngieProf, 'nl-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3224581036', 'ENGIE-PROF-NL', @CompanyProjectEngieProf, 'nl-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3224581037', 'ENGIE-PROF-FR', @CompanyProjectEngieProf, 'fr-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3224581038', 'ENGIE-PROF-DE', @CompanyProjectEngieProf, 'de-BE', NULL, 4077, 'GET_LANGUAGE', '{}', @ProfConfig
        UNION ALL SELECT NEWID(), '+3224581039', 'ENGIE-PROF-EN', @CompanyProjectEngieProf, 'en-GB', NULL, 4077, 'GET_LANGUAGE', '{}', @ProfConfig
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

    PRINT '✅ ENGIE ENERGYLINE routing tables seeded successfully (~40 records)';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
