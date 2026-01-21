/**
 * Configuration API Types
 * Types for dictionary management (languages, voices, message types, etc.)
 */

// ============================================================================
// LANGUAGE TYPES
// ============================================================================

export interface Language {
  languageCode: string;
  displayName: string;
  nativeName?: string;
  sortOrder: number;
  isActive: boolean;
  dateCreated: Date;
  dateUpdated: Date;
}

export interface CreateLanguageDto {
  languageCode: string;
  displayName: string;
  nativeName?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateLanguageDto {
  displayName?: string;
  nativeName?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface LanguageImpact {
  languageCode: string;
  displayName: string;
  voiceCount: number;
  messageStoreCount: number;
  routingTableCount: number;
  totalUsage: number;
  hasBlockingIssues: boolean;
  blockingReasons: string[];
  recommendation?: string;
}

// ============================================================================
// VOICE TYPES
// ============================================================================

export type VoiceEngine = 'google' | 'azure' | 'amazon' | 'elevenlabs';
export type VoiceGender = 'female' | 'male' | 'neutral';

export interface Voice {
  voiceId: number;
  code: string;
  engine: VoiceEngine;
  language: string;
  displayName: string;
  gender?: VoiceGender;
  style?: string;
  sampleUrl?: string;
  sortOrder: number;
  isActive: boolean;
  dateCreated: Date;
}

export interface CreateVoiceDto {
  code: string;
  engine: VoiceEngine;
  language: string;
  displayName: string;
  gender?: VoiceGender;
  style?: string;
  sampleUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateVoiceDto {
  engine?: VoiceEngine;
  language?: string;
  displayName?: string;
  gender?: VoiceGender;
  style?: string;
  sampleUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface VoiceImpact {
  code: string;
  displayName: string;
  messageStoreVoiceConfigCount: number;
  totalUsage: number;
  hasBlockingIssues: boolean;
  blockingReasons: string[];
  recommendation?: string;
}

export interface VoiceFilters {
  engine?: VoiceEngine;
  language?: string;
  gender?: VoiceGender;
  includeInactive?: boolean;
}

// ============================================================================
// MESSAGE CATEGORY TYPES
// ============================================================================

export interface MessageCategory {
  categoryId: number;
  code: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  dateCreated: Date;
}

export interface CreateMessageCategoryDto {
  code: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateMessageCategoryDto {
  displayName?: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface MessageCategoryImpact {
  code: string;
  displayName: string;
  messageCount: number;
  totalUsage: number;
  hasBlockingIssues: boolean;
  blockingReasons: string[];
  recommendation?: string;
}

// ============================================================================
// MESSAGE TYPE TYPES
// ============================================================================

export interface MessageType {
  messageTypeId: number;
  code: string;
  displayName: string;
  description?: string;
  settingsSchema?: string;
  defaultSettings?: string;
  sortOrder: number;
  isActive: boolean;
  dateCreated: Date;
}

export interface CreateMessageTypeDto {
  code: string;
  displayName: string;
  description?: string;
  settingsSchema?: string;
  defaultSettings?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateMessageTypeDto {
  displayName?: string;
  description?: string;
  settingsSchema?: string;
  defaultSettings?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface MessageTypeImpact {
  code: string;
  displayName: string;
  messageCount: number;
  totalUsage: number;
  hasBlockingIssues: boolean;
  blockingReasons: string[];
  recommendation?: string;
}

// ============================================================================
// KEY TYPE TYPES
// ============================================================================

export interface KeyType {
  dicTypeId: number;
  typeName: string;
  displayName?: string;
  description?: string;
}

export interface CreateKeyTypeDto {
  typeName: string;
  displayName?: string;
  description?: string;
}

export interface UpdateKeyTypeDto {
  displayName?: string;
  description?: string;
}

export interface KeyTypeUsage {
  typeName: string;
  displayName?: string;
  usageCount: number;
}

export interface KeyTypeImpact {
  typeName: string;
  displayName?: string;
  segmentTypeName?: string;
  usageCount: number;
  isRequired?: boolean;
  hasBlockingIssues: boolean;
  blockingReasons: string[];
  recommendation?: string;
}

// ============================================================================
// SEGMENT TYPE TYPES
// ============================================================================

export enum SegmentCategory {
  SYSTEM = 'system',
  INTERACTIVE = 'interactive',
  API = 'api',
  TERMINAL = 'terminal',
  NAVIGATION = 'navigation',
}

export interface KeyConfig {
  keyName: string;
  displayName?: string;
  dicTypeId: number;
  isRequired?: boolean;
  defaultValue?: string;
  isDisplayed?: boolean;
  isEditable?: boolean;
  isActive?: boolean;
}

export interface KeyResponse {
  dicKeyId: number;
  dicSegmentTypeId: number;
  keyName: string;
  displayName?: string;
  dicTypeId: number;
  typeName: string;
  typeDisplayName?: string;
  isRequired: boolean;
  defaultValue?: string;
  isDisplayed: boolean;
  isEditable: boolean;
  isActive: boolean;
}

export interface ConfigKey {
  dicKeyId: number;
  dicSegmentTypeId: number;
  keyName: string;
  displayName?: string;
  typeName: string; // 'string', 'number', 'boolean', 'json', 'messageKey'
  typeDisplayName?: string;  // Display name of the type
  dicTypeId: number;  // Foreign key to type table (required - backend always provides this)
  description?: string;
  isRequired: boolean;
  defaultValue?: string;
  isDisplayed: boolean;
  isEditable: boolean;
  sortOrder: number;
  isActive: boolean;
  dateCreated: Date;
}

export interface SegmentType {
  dicSegmentTypeId: number;
  segmentTypeName: string;
  displayName?: string;
  description?: string;
  category: SegmentCategory;
  icon?: string;
  color?: string;
  isSystem: boolean;
  isTerminal?: boolean;
  isActive: boolean;
  sortOrder: number;
  dateCreated: Date;
  keys?: ConfigKey[];
  hooks?: string; // Default hooks JSON from dictionary
  hooksSchema?: string; // JSON Schema for hooks validation
}

export interface CreateSegmentTypeDto {
  segmentTypeName: string;
  displayName?: string;
  description?: string;
  category: SegmentCategory;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isTerminal?: boolean;
  isActive?: boolean;
  keys?: KeyConfig[];
}

export interface UpdateSegmentTypeDto {
  displayName?: string;
  description?: string;
  category?: SegmentCategory;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  isTerminal?: boolean;
}

export interface SegmentTypeImpact {
  segmentTypeName: string;
  displayName?: string;
  segmentCount: number;
  totalUsage: number;
  hasBlockingIssues: boolean;
  blockingReasons: string[];
  recommendation?: string;
}

export interface SegmentTypeUsage {
  dicSegmentTypeId: number;
  segmentTypeName: string;
  displayName?: string;
  usageCount: number;
  segmentCount?: number;
  activeSegmentCount?: number;
  keyCount?: number;
  routingIds?: string[];
  hasBlockingIssues?: boolean;
  blockingReasons?: string[];
  recommendation?: string;
}
