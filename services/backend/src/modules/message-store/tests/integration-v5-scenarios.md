# Message Store v5.0.0 Integration Test Scenarios

**Purpose**: Integration test scenarios for MessageKey-level atomic versioning

**Note**: These are test scenarios to be implemented as integration tests. They document the expected behavior of the v5.0.0 architecture.

---

## Scenario 1: Create Message Key with Multiple Languages

**Objective**: Verify atomic version creation with all languages

**Steps**:
1. Create a new MessageKey with 3 languages (nl-BE, fr-BE, en-GB) in version 1
2. Verify MessageKey is created with `publishedVersion = null` (draft)
3. Verify MessageKeyVersion is created with `version = 1`
4. Verify 3 MessageLanguageContent records are created (one per language)
5. Verify all languages are in the same version

**Expected Result**:
- MessageKey exists with `messageKeyId`
- One MessageKeyVersion with `version = 1`
- Three MessageLanguageContent records, all linked to the same `messageKeyVersionId`
- `MessageKey.publishedVersion` is `null` (draft state)

---

## Scenario 2: Create Version 2 Updating One Language

**Objective**: Verify atomic versioning - updating one language creates new version with all languages

**Prerequisites**: Scenario 1 completed

**Steps**:
1. Create version 2, updating only nl-BE content
2. Verify new MessageKeyVersion is created with `version = 2`
3. Verify version 2 contains all 3 languages:
   - nl-BE: Updated content
   - fr-BE: Preserved from version 1
   - en-GB: Preserved from version 1
4. Verify version 1 still exists unchanged
5. Verify `MessageKey.publishedVersion` is still `null` (draft)

**Expected Result**:
- Two MessageKeyVersion records (version 1 and 2)
- Version 2 has 3 MessageLanguageContent records
- Version 1 unchanged
- All languages in version 2 are atomic (created together)

---

## Scenario 3: Publish Version 2

**Objective**: Verify publishing sets integer version number and all languages are published

**Prerequisites**: Scenario 2 completed

**Steps**:
1. Publish version 2
2. Verify `MessageKey.publishedVersion = 2`
3. Verify runtime fetch returns version 2 content for all languages
4. Verify version 1 is still accessible but not published

**Expected Result**:
- `MessageKey.publishedVersion = 2` (integer, not UUID)
- Runtime fetch for nl-BE, fr-BE, en-GB all return version 2 content
- Version 1 still exists but is not active

---

## Scenario 4: Rollback to Version 1

**Objective**: Verify rollback changes published version and all languages rollback together

**Prerequisites**: Scenario 3 completed

**Steps**:
1. Rollback to version 1
2. Verify `MessageKey.publishedVersion = 1`
3. Verify runtime fetch returns version 1 content for all languages
4. Verify version 2 still exists but is not published

**Expected Result**:
- `MessageKey.publishedVersion = 1`
- Runtime fetch for all languages returns version 1 content
- All languages rollback atomically (not per-language)

---

## Scenario 5: Export Messages (v5.0.0 Format)

**Objective**: Verify export format matches v5.0.0 structure

**Prerequisites**: Scenario 3 completed (version 2 published)

**Steps**:
1. Export with `includeVersions = ALL`
2. Verify export structure:
   - `exportVersion = "5.0.0"`
   - `messageKeys` array contains MessageKey entries
   - Each MessageKey has `versions` array
   - Each version has `languages` object (not array)
   - All languages are grouped within each version
3. Export with `includeVersions = PUBLISHED`
4. Verify only published version (version 2) is included

**Expected Result**:
- Export format matches `MessageStoreExportV5Dto` structure
- Languages are grouped by version (atomic structure)
- Published-only export contains only version 2

---

## Scenario 6: Import Messages (v5.0.0 Format)

**Objective**: Verify import creates MessageKeys with atomic versions

**Steps**:
1. Import v5.0.0 export data with 2 MessageKeys, each with 2 versions
2. Verify preview shows correct counts (willCreate, willUpdate)
3. Execute import
4. Verify MessageKeys are created correctly
5. Verify versions are created atomically (all languages together)
6. Verify published versions are set correctly

**Expected Result**:
- Import creates MessageKeys (not per-language messages)
- Each version contains all languages atomically
- Published versions are set from export data

---

## Scenario 7: Runtime Fetch Performance

**Objective**: Verify optimized runtime query performance

**Prerequisites**: Multiple MessageKeys with published versions

**Steps**:
1. Fetch single message by `messageKey` and `language`
2. Measure query execution time
3. Fetch batch of messages (10+ messageKeys)
4. Measure batch query execution time

**Expected Result**:
- Single fetch: < 30ms
- Batch fetch (10 messages): < 100ms
- Query uses `ivr.` schema prefix
- Query joins MessageKey → MessageKeyVersion → MessageLanguageContent efficiently

---

## Scenario 8: Version Limit Enforcement

**Objective**: Verify maximum 10 versions per MessageKey

**Steps**:
1. Create versions 1-10 successfully
2. Attempt to create version 11
3. Verify error is thrown: "MessageKey has reached maximum version limit (10)"

**Expected Result**:
- Versions 1-10 created successfully
- Version 11 creation fails with appropriate error
- Error message is clear and actionable

---

## Scenario 9: Conflict Detection on Import

**Objective**: Verify import conflict detection works with MessageKey (not per-language)

**Prerequisites**: MessageKey 'WELCOME_MSG' exists with version 1

**Steps**:
1. Import export data containing 'WELCOME_MSG' with `overwrite = false`
2. Verify preview shows conflict for 'WELCOME_MSG'
3. Verify conflict is at MessageKey level (not per-language)
4. Import with `overwrite = true`
5. Verify MessageKey is updated (new version created)

**Expected Result**:
- Conflict detected at MessageKey level
- Preview shows conflict for entire MessageKey (not individual languages)
- Overwrite creates new version with all languages

---

## Scenario 10: Delete MessageKey

**Objective**: Verify cascade deletion of versions and language content

**Steps**:
1. Delete a MessageKey with multiple versions
2. Verify MessageKey is deleted
3. Verify all MessageKeyVersions are cascade deleted
4. Verify all MessageLanguageContent records are cascade deleted
5. Verify MessageKeyAudit records remain (no FK, audit retention)

**Expected Result**:
- MessageKey deleted
- All related versions deleted (cascade)
- All language content deleted (cascade)
- Audit records preserved (no FK constraint)

---

## Test Data Setup

For integration tests, use the following test data:

```typescript
const testMessageStore = {
  messageStoreId: 1,
  name: 'Test Store',
  allowedLanguages: ['nl-BE', 'fr-BE', 'en-GB'],
};

const testMessageKey = {
  messageKey: 'TEST_WELCOME',
  messageTypeId: 1, // tts
  categoryId: 1, // welcome
};
```

---

## Implementation Notes

- These scenarios should be implemented as integration tests using a test database
- Use transactions that rollback after each test
- Mock external dependencies (auth, etc.) but use real Prisma/database
- Measure performance for Scenario 7
- Verify data integrity after each scenario

---

**Status**: Test scenarios documented - ready for implementation
