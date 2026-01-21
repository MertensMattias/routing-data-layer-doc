import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, BarChart3, Search, Volume2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Voice } from '@/api/types';
import { listVoices, deleteVoice } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';
import { VoiceDialog } from './VoiceDialog';
import { VoiceImpactDialog } from './VoiceImpactDialog';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/common';

export function VoiceTab() {
  const queryClient = useQueryClient();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [engineFilter, setEngineFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoice, setEditingVoice] = useState<Voice | null>(null);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [impactVoiceCode, setImpactVoiceCode] = useState<string | null>(null);

  // Load voices using TanStack Query
  const {
    data: voices = [],
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['voices', showInactive],
    queryFn: () => listVoices({ includeInactive: showInactive }),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Delete mutation with cache invalidation
  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteVoice(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voices'] });
      toast.success('Voice deactivated successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete voice: ' + getApiErrorMessage(error));
    },
  });

  // Apply all filters (client-side)
  const filteredVoices = useMemo(() => {
    let filtered = [...voices];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (voice) =>
          voice.code.toLowerCase().includes(term) ||
          voice.displayName.toLowerCase().includes(term) ||
          voice.language.toLowerCase().includes(term)
      );
    }

    // Engine filter
    if (engineFilter !== 'all') {
      filtered = filtered.filter((voice) => voice.engine === engineFilter);
    }

    // Language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter((voice) => voice.language === languageFilter);
    }

    // Gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter((voice) => voice.gender === genderFilter);
    }

    return filtered;
  }, [voices, searchTerm, engineFilter, languageFilter, genderFilter]);

  const handleManualRefresh = () => {
    refetch();
    toast.info('Refreshing voices...');
  };

  const handleCreate = () => {
    setEditingVoice(null);
    setDialogOpen(true);
  };

  const handleEdit = (voice: Voice) => {
    setEditingVoice(voice);
    setDialogOpen(true);
  };

  const handleDelete = async (code: string) => {
    setImpactVoiceCode(code);
    setImpactDialogOpen(true);
  };

  const handleDeleteConfirm = (code: string) => {
    deleteMutation.mutate(code);
  };

  const handleViewImpact = (code: string) => {
    setImpactVoiceCode(code);
    setImpactDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingVoice(null);
    queryClient.invalidateQueries({ queryKey: ['voices'] });
  };

  // Get unique languages for filter
  const uniqueLanguages = useMemo(
    () => Array.from(new Set(voices.map((v) => v.language))).sort(),
    [voices]
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voice Management</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState error={error} onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Voice Management</CardTitle>
              <CardDescription>
                Manage TTS voices. Voices are used in message store configurations for text-to-speech.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {dataUpdatedAt && (
                <span className="text-xs text-slate-500">
                  Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleManualRefresh}
                disabled={isLoading}
                aria-label="Refresh voices"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Toolbar */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search voices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Engine Filter */}
            <Select value={engineFilter} onValueChange={setEngineFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Engine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Engines</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="azure">Azure</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
              </SelectContent>
            </Select>

            {/* Language Filter */}
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {uniqueLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Gender Filter */}
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? 'Hide Inactive' : 'Show Inactive'}
            </Button>

            <Button onClick={handleCreate} className="ml-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Voice
            </Button>
          </div>

          {/* Voices Table */}
          {filteredVoices.length === 0 ? (
            <EmptyState
              title={
                searchTerm || engineFilter !== 'all' || languageFilter !== 'all' || genderFilter !== 'all'
                  ? 'No voices match your filters.'
                  : 'No voices configured yet.'
              }
              action={
                !searchTerm && engineFilter === 'all' && languageFilter === 'all' && genderFilter === 'all'
                  ? {
                      label: 'Add First Voice',
                      onClick: handleCreate,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voice Code</TableHead>
                    <TableHead>Engine</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVoices.map((voice) => (
                    <TableRow
                      key={voice.voiceId}
                      onDoubleClick={() => handleEdit(voice)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-mono text-sm">{voice.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {voice.engine}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{voice.language}</TableCell>
                      <TableCell className="font-medium">{voice.displayName}</TableCell>
                      <TableCell>
                        {voice.gender ? (
                          <Badge variant="secondary" className="capitalize">
                            {voice.gender}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {voice.style || '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={voice.isActive ? 'default' : 'secondary'}>
                          {voice.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {voice.sampleUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(voice.sampleUrl, '_blank')}
                              title="Play audio sample"
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewImpact(voice.code)}
                            title="View impact analysis"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(voice)}
                            title="Edit voice"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(voice.code)}
                            title="Delete voice"
                            disabled={!voice.isActive}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredVoices.length} of {voices.length} voice(s)
          </p>
        </CardContent>
      </Card>

      {/* Voice Create/Edit Dialog */}
      <VoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        voice={editingVoice}
        onSuccess={handleDialogSuccess}
      />

      {/* Impact Analysis Dialog */}
      {impactVoiceCode && (
        <VoiceImpactDialog
          open={impactDialogOpen}
          onOpenChange={setImpactDialogOpen}
          voiceCode={impactVoiceCode}
          onDeleteConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}

