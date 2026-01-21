import { Controller, Get, Query, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessageKeyRuntimeService } from './services/message-key-runtime.service';
import { RuntimeMessageFetchDto, RuntimeStoreFetchDto } from './dto/message-key.dto';

/**
 * MessageKey Runtime Controller - High-performance endpoints for IVR platform
 *
 * Performance targets:
 * - Single message fetch: <30ms p95
 * - Bulk store fetch: <100ms p95
 *
 * Authentication:
 * - Uses API key authentication (separate from JWT)
 * - TODO: Implement API key guard when available
 *
 * Routes:
 * - GET /messages/runtime/fetch?messageStoreId={id}&messageKey={key}&language={lang}
 * - GET /messages/runtime/store/{storeId}?language={lang}
 */
@ApiTags('message-runtime')
@Controller('messages/runtime')
@ApiBearerAuth()
// TODO: Add API key guard when available
// @UseGuards(ApiKeyGuard)
export class MessageKeyRuntimeController {
  constructor(private readonly runtimeService: MessageKeyRuntimeService) {}

  /**
   * Fetch published message content for specific language
   * Used by IVR platform for on-demand message retrieval
   *
   * Performance: <30ms p95 target
   * Uses filtered index on published messages
   */
  @Get('fetch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch published message (IVR)',
    description:
      'High-performance endpoint for IVR to fetch published message content. Returns 404 if message not published.',
  })
  @ApiQuery({
    name: 'messageStoreId',
    description: 'Message store ID',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'messageKey',
    description: 'Message key',
    example: 'WELCOME_PROMPT',
    required: true,
  })
  @ApiQuery({
    name: 'language',
    description: 'Language code (BCP47)',
    example: 'nl-BE',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Published message content',
    type: RuntimeMessageFetchDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found or not published',
  })
  async fetchMessage(
    @Query('messageStoreId', ParseIntPipe) messageStoreId: number,
    @Query('messageKey') messageKey: string,
    @Query('language') language: string,
  ): Promise<RuntimeMessageFetchDto> {
    return this.runtimeService.fetchMessage(messageStoreId, messageKey, language);
  }

  /**
   * Fetch all published messages from a store for specific language
   * Used by IVR platform for bulk prefetch/caching
   *
   * Performance: <100ms p95 target
   * Returns map of messageKey -> content
   */
  @Get('store/:storeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch all published messages from store (IVR)',
    description:
      'High-performance endpoint for IVR to fetch all published messages for a language. Returns map of messageKey to content.',
  })
  @ApiParam({
    name: 'storeId',
    description: 'Message store ID',
    type: Number,
  })
  @ApiQuery({
    name: 'language',
    description: 'Language code (BCP47)',
    example: 'nl-BE',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Map of messageKey to content',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          typeSettings: { type: 'object' },
          version: { type: 'number' },
          categoryCode: { type: 'string' },
        },
      },
    },
  })
  async fetchStoreMessages(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query('language') language: string,
  ): Promise<RuntimeStoreFetchDto> {
    return this.runtimeService.fetchStoreMessages(storeId, language);
  }
}
