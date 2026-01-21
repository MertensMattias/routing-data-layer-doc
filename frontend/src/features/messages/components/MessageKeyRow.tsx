import { useState, memo, useMemo } from 'react';
import { ChevronDown, ChevronRight, Edit, Languages, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useDomainPermissions } from '@/hooks/useDomainPermissions';
import { Domain } from '@shared/types/roles';
import type { MessageKeyGroup, MessageLanguageInfo } from '../utils/message-grouping';
import { getGroupStatusLabel } from '../utils/message-grouping';

interface MessageKeyRowProps {
  group: MessageKeyGroup;
  storeId: number;
  defaultLanguage?: string;
  onEditAllLanguages: (messageKey: string) => void;
  onEditSingleLanguage: (messageKey: string, language: string) => void;
  onDelete?: (messageKey: string, language: string) => void;
  onNavigateToDetail: (messageKey: string, language: string) => void;
}

export const MessageKeyRow = memo(function MessageKeyRow({
  group,
  storeId: _storeId,
  defaultLanguage,
  onEditAllLanguages,
  onEditSingleLanguage,
  onDelete,
  onNavigateToDetail,
}: MessageKeyRowProps) {
  const { user } = useAuth();
  const permissions = useDomainPermissions({
    roles: user?.roles,
    domain: Domain.MESSAGE_STORE,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort languages: default language first, then alphabetically (memoized)
  const sortedLanguages = useMemo(() => {
    return [...group.languages].sort((a, b) => {
      if (defaultLanguage === a.language) return -1;
      if (defaultLanguage === b.language) return 1;
      return a.language.localeCompare(b.language);
    });
  }, [group.languages, defaultLanguage]);

  const getStatusBadge = () => {
    const label = getGroupStatusLabel(group);

    if (group.hasAllPublished) {
      return (
        <Badge className="bg-emerald-50/50 text-emerald-700 border border-emerald-200">
          {label}
        </Badge>
      );
    }

    if (group.hasAnyPublished) {
      return (
        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50/50">
          {label}
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-slate-100 text-slate-600">
        {label}
      </Badge>
    );
  };

  return (
    <>
      {/* Main Row */}
      <TableRow className="hover:bg-slate-50/50 transition-colors">
        <TableCell className="w-8">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-slate-100 transition-colors"
            aria-label={isExpanded ? `Collapse ${group.messageKey} details` : `Expand ${group.messageKey} details`}
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-mono text-sm font-medium">
          <span className="sr-only">Message key: </span>
          {group.messageKey}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {group.typeCode ? (
            <Badge variant="outline" className="text-xs">
              {group.typeCode}
            </Badge>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </TableCell>
        <TableCell>{getStatusBadge()}</TableCell>
        <TableCell>
          <div className="flex gap-1" role="group" aria-label={`Actions for ${group.messageKey}`}>
            {permissions.canEdit && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-slate-100 transition-colors"
                  title="Edit All Languages"
                  aria-label={`Edit all languages for ${group.messageKey}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditAllLanguages(group.messageKey);
                  }}
                >
                  <Languages className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Edit all languages</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-slate-100 transition-colors"
                  title="Edit Default Language"
                  aria-label={`Edit ${group.messageKey} in default language`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const defaultLang = sortedLanguages[0]?.language;
                    if (defaultLang) {
                      onEditSingleLanguage(group.messageKey, defaultLang);
                    }
                  }}
                >
                  <Edit className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Edit default language</span>
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Content - Language Details */}
      {isExpanded && sortedLanguages.map((lang) => (
        <LanguageDetailRow
          key={lang.language}
          language={lang}
          messageKey={group.messageKey}
          isDefault={lang.language === defaultLanguage}
          onEdit={() => onEditSingleLanguage(group.messageKey, lang.language)}
          onDelete={onDelete ? () => onDelete(group.messageKey, lang.language) : undefined}
          onNavigate={() => onNavigateToDetail(group.messageKey, lang.language)}
        />
      ))}
    </>
  );
});

interface LanguageDetailRowProps {
  language: MessageLanguageInfo;
  messageKey: string;
  isDefault: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  onNavigate: () => void;
}

const LanguageDetailRow = memo(function LanguageDetailRow({
  language,
  messageKey,
  isDefault,
  onEdit,
  onDelete,
  onNavigate,
}: LanguageDetailRowProps) {
  return (
    <TableRow
      className="bg-slate-50/30 hover:bg-slate-100/50 cursor-pointer transition-colors"
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate();
        }
      }}
      aria-label={`View details for ${messageKey} in ${language.language}`}
    >
      <TableCell className="w-8" /> {/* Empty for alignment */}
      <TableCell className="pl-8 text-sm text-slate-600">
        <span className="flex items-center gap-2">
          <span className="w-4" /> {/* Indent */}
          {language.language}
          {isDefault && (
            <Badge variant="outline" className="text-xs">
              default
            </Badge>
          )}
        </span>
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm text-slate-500">
        {/* Empty for alignment with Type column */}
      </TableCell>
      <TableCell>
        <Badge
          variant={language.isPublished ? 'default' : 'secondary'}
          className={
            language.isPublished
              ? 'bg-emerald-50/50 text-emerald-700 border border-emerald-200'
              : 'bg-indigo-50/70 text-indigo-700 border border-indigo-200'
          }
        >
          {language.isPublished ? 'Published' : 'Draft'}
        </Badge>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 transition-colors hover:bg-slate-100"
            title="Edit"
            aria-label={`Edit ${messageKey} in ${language.language}`}
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Edit</span>
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 transition-colors hover:bg-red-50 hover:text-red-700"
              title="Delete"
              aria-label={`Delete ${messageKey} in ${language.language}`}
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});
