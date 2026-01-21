import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RuntimeMessageFetchDto, RuntimeStoreFetchDto } from '../dto/message-key.dto';

/**
 * MessageKeyRuntimeService - High-performance service for IVR runtime access
 *
 * Performance targets:
 * - Single message fetch: <30ms p95
 * - Bulk store fetch: <100ms p95
 *
 * Optimization strategies:
 * - Filtered indexes on published messages
 * - Composite indexes for common queries
 * - Redis caching (5-minute TTL)
 */
@Injectable()
export class MessageKeyRuntimeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetch published message content for specific language
   * Used by IVR platform for on-demand message retrieval
   *
   * Performance: Uses filtered index IX_MK_Runtime_Fetch
   */
  async fetchMessage(
    messageStoreId: number,
    messageKey: string,
    language: string,
  ): Promise<RuntimeMessageFetchDto> {
    // Query uses filtered index on published messages
    const result = await this.prisma.$queryRaw<
      Array<{
        MessageKey: string;
        Language: string;
        Content: string;
        TypeSettings: string | null;
        Version: number;
        CategoryCode: string;
      }>
    >`
      SELECT
        mk.MessageKey,
        mlc.Language,
        mlc.Content,
        mlc.TypeSettings,
        mkv.Version,
        cat.Code AS CategoryCode
      FROM ivr.msg_MessageKey mk
      INNER JOIN ivr.msg_MessageKeyVersion mkv
        ON mk.MessageKeyId = mkv.MessageKeyId
        AND mkv.Version = mk.PublishedVersion
      INNER JOIN ivr.msg_MessageLanguageContent mlc
        ON mkv.MessageKeyVersionId = mlc.MessageKeyVersionId
      INNER JOIN ivr.msg_Dic_MessageCategory cat
        ON mk.DicMessageCategoryId = cat.CategoryId
      WHERE mk.MessageStoreId = ${messageStoreId}
        AND mk.MessageKey = ${Prisma.raw(`'${messageKey.replace(/'/g, "''")}'`)}
        AND mlc.Language = ${Prisma.raw(`'${language.replace(/'/g, "''")}'`)}
        AND mk.PublishedVersion IS NOT NULL;
    `;

    if (result.length === 0) {
      throw new NotFoundException(
        `Published message '${messageKey}' not found for language '${language}' in store ${messageStoreId}`,
      );
    }

    const row = result[0];

    return {
      messageKey: row.MessageKey,
      language: row.Language,
      content: row.Content,
      typeSettings: row.TypeSettings ? JSON.parse(row.TypeSettings) : undefined,
      version: row.Version,
      categoryCode: row.CategoryCode,
    };
  }

  /**
   * Fetch all published messages from a store for specific language
   * Used by IVR platform for bulk prefetch/caching
   *
   * Performance: Single query with efficient joins
   */
  async fetchStoreMessages(
    messageStoreId: number,
    language: string,
  ): Promise<RuntimeStoreFetchDto> {
    const results = await this.prisma.$queryRaw<
      Array<{
        MessageKey: string;
        Content: string;
        TypeSettings: string | null;
        Version: number;
        CategoryCode: string;
      }>
    >`
      SELECT
        mk.MessageKey,
        mlc.Content,
        mlc.TypeSettings,
        mkv.Version,
        cat.Code AS CategoryCode
      FROM ivr.msg_MessageKey mk
      INNER JOIN ivr.msg_MessageKeyVersion mkv
        ON mk.MessageKeyId = mkv.MessageKeyId
        AND mkv.Version = mk.PublishedVersion
      INNER JOIN ivr.msg_MessageLanguageContent mlc
        ON mkv.MessageKeyVersionId = mlc.MessageKeyVersionId
      INNER JOIN ivr.msg_Dic_MessageCategory cat
        ON mk.DicMessageCategoryId = cat.CategoryId
      WHERE mk.MessageStoreId = ${messageStoreId}
        AND mlc.Language = ${Prisma.raw(`'${language.replace(/'/g, "''")}'`)}
        AND mk.PublishedVersion IS NOT NULL
      ORDER BY mk.MessageKey;
    `;

    // Convert to map format
    const storeMap: RuntimeStoreFetchDto = {};
    for (const row of results) {
      storeMap[row.MessageKey] = {
        content: row.Content,
        typeSettings: row.TypeSettings ? JSON.parse(row.TypeSettings) : undefined,
        version: row.Version,
        categoryCode: row.CategoryCode,
      };
    }

    return storeMap;
  }

  /**
   * Invalidate cache for a messageKey (called after publish/rollback)
   * TODO: Implement Redis cache invalidation when Redis is available
   */
  async invalidateCache(
    messageStoreId: number,
    messageKey: string,
    version?: number,
  ): Promise<void> {
    // Get all languages for this version (or published version)
    const key = await this.prisma.messageKey.findUnique({
      where: {
        uq_mk_store_key: {
          messageStoreId,
          messageKey,
        },
      },
      include: {
        versions: {
          where: version ? { version } : undefined,
          include: {
            languages: {
              select: {
                language: true,
              },
            },
          },
        },
      },
    });

    if (!key) {
      return;
    }

    // TODO: Implement Redis cache invalidation
    // const redis = this.redisService.getClient();
    // for (const versionRecord of key.versions) {
    //   for (const lang of versionRecord.languages) {
    //     const cacheKey = `msg:${messageStoreId}:${messageKey}:${lang.language}`;
    //     await redis.del(cacheKey);
    //   }
    // }
  }
}
