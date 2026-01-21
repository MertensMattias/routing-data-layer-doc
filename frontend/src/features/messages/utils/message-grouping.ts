/**
 * Message Grouping Utilities
 * Converts MessageKeyListItemDto to MessageKeyGroup for UI display
 */

import type { MessageKeyListItemDto } from '@/services/messages/message-keys.service';

/**
 * Represents a language within a message key group
 */
export interface MessageLanguageInfo {
  language: string;
  messageId: number;
  messageVersionId?: string;
  isPublished: boolean;
}

/**
 * Represents a group of messages with the same messageKey
 */
export interface MessageKeyGroup {
  messageKey: string;
  typeCode?: string;
  categoryCode?: string;
  languages: MessageLanguageInfo[];
  totalLanguages: number;
  publishedCount: number;
  draftCount: number;
  hasAllPublished: boolean;
  hasAnyPublished: boolean;
}

/**
 * Converts MessageKeyListItemDto array to MessageKeyGroup array
 * @param messageKeys - Array of messageKey list items (already grouped)
 * @returns Array of message key groups
 */
export function convertMessageKeysToGroups(messageKeys: MessageKeyListItemDto[]): MessageKeyGroup[] {
  return messageKeys.map((key) => {
    // All languages share the same published version
    const isPublished = key.publishedVersion !== undefined && key.publishedVersion !== null;
    const publishedCount = isPublished ? key.languages.length : 0;
    const draftCount = isPublished ? 0 : key.languages.length;

    return {
      messageKey: key.messageKey,
      typeCode: key.typeCode,
      categoryCode: key.categoryCode,
      languages: key.languages.map((lang) => ({
        language: lang,
        messageId: key.messageKeyId, // Use messageKeyId as identifier
        messageVersionId: undefined, // Not needed in new model
        isPublished,
      })),
      totalLanguages: key.languages.length,
      publishedCount,
      draftCount,
      hasAllPublished: isPublished,
      hasAnyPublished: isPublished,
    };
  });
}

/**
 * Filters message key groups by search query
 * @param groups - Array of message key groups
 * @param query - Search query string
 * @returns Filtered array of groups
 */
export function filterMessageKeyGroups(
  groups: MessageKeyGroup[],
  query: string
): MessageKeyGroup[] {
  if (!query.trim()) {
    return groups;
  }

  const lowerQuery = query.toLowerCase();
  return groups.filter((group) =>
    group.messageKey.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Gets the status label for a message key group
 */
export function getGroupStatusLabel(group: MessageKeyGroup): string {
  if (group.hasAllPublished) {
    return `${group.publishedCount}/${group.totalLanguages} Published`;
  }
  if (group.hasAnyPublished) {
    return `${group.publishedCount}/${group.totalLanguages} Published`;
  }
  return `${group.totalLanguages} Draft${group.totalLanguages > 1 ? 's' : ''}`;
}

/**
 * Gets the status variant for badge styling
 */
export function getGroupStatusVariant(
  group: MessageKeyGroup
): 'default' | 'secondary' | 'outline' {
  if (group.hasAllPublished) {
    return 'default'; // Green
  }
  if (group.hasAnyPublished) {
    return 'outline'; // Mixed
  }
  return 'secondary'; // All drafts
}
