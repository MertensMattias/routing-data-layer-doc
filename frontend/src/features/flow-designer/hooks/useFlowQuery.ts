import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getFlow } from '@/services/flows/flows.service';
import { saveFlowDraft, publishDraft } from '@/services/flows/flows-draft.service';
import { validateFlow } from '@/services/flows/flows-validation.service';
import { exportFlow as exportFlowService, importFlow as importFlowService } from '@/services/flows/flows-export.service';
import { CompleteFlow, FlowValidation } from '@/features/flow-designer/types/flow.types';

// Param types for backwards compatibility
interface GetFlowParams {
  flowId: string;
  version?: string;
}

interface SaveFlowParams {
  flowId: string;
  flow: CompleteFlow;
}

interface PublishFlowParams {
  flowId: string;
  version: string;
}

interface ValidateFlowParams {
  flowId: string;
  flow: CompleteFlow;
}

interface ExportFlowParams {
  flowId: string;
  version?: string;
}

interface ImportFlowParams {
  flowId: string;
  flowData: CompleteFlow;
}

// Query keys for cache management
export const flowQueryKeys = {
  all: ['flows'] as const,
  flow: (flowId: string, version?: string) =>
    [...flowQueryKeys.all, flowId, version] as const,
  validation: (flowId: string) =>
    [...flowQueryKeys.all, 'validation', flowId] as const,
};

/**
 * Hook to fetch a flow by ID and optional version.
 */
export function useFlowQuery(
  params: GetFlowParams,
  enabled: boolean = true
): UseQueryResult<CompleteFlow, Error> {
  return useQuery({
    queryKey: flowQueryKeys.flow(params.flowId, params.version),
    queryFn: async () => getFlow(params.flowId, params.version) as unknown as Promise<CompleteFlow>,
    enabled: enabled && !!params.flowId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  }) as UseQueryResult<CompleteFlow, Error>;
}

/**
 * Hook to save a flow (create or update draft).
 */
export function useFlowSaveMutation(): UseMutationResult<
  CompleteFlow,
  Error,
  SaveFlowParams,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveFlowParams) => saveFlowDraft(params.flowId, params.flow as any) as unknown as Promise<CompleteFlow>,
    onSuccess: (_data, variables) => {
      // Invalidate and refetch the flow query
      queryClient.invalidateQueries({
        queryKey: flowQueryKeys.flow(variables.flowId),
      });
    },
  }) as UseMutationResult<CompleteFlow, Error, SaveFlowParams, unknown>;
}

/**
 * Hook to publish a flow version.
 */
export function useFlowPublishMutation(): UseMutationResult<
  void,
  Error,
  PublishFlowParams,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: PublishFlowParams) => publishDraft(params.flowId, params.version),
    onSuccess: (_, variables) => {
      // Invalidate all flow queries for this flowId
      queryClient.invalidateQueries({
        queryKey: flowQueryKeys.flow(variables.flowId),
      });
    },
  });
}

/**
 * Hook to validate a flow.
 */
export function useFlowValidateMutation(): UseMutationResult<
  FlowValidation,
  Error,
  ValidateFlowParams,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ValidateFlowParams) => validateFlow(params.flowId, params.flow as any) as Promise<FlowValidation>,
    onSuccess: (data, variables) => {
      // Update validation cache
      queryClient.setQueryData(
        flowQueryKeys.validation(variables.flowId),
        data
      );
    },
  }) as UseMutationResult<FlowValidation, Error, ValidateFlowParams, unknown>;
}

/**
 * Hook to export a flow.
 */
export function useFlowExportMutation(): UseMutationResult<
  CompleteFlow,
  Error,
  ExportFlowParams,
  unknown
> {
  return useMutation({
    mutationFn: (params: ExportFlowParams) => exportFlowService(params.flowId, { changeSetId: params.version }) as unknown as Promise<CompleteFlow>,
  }) as UseMutationResult<CompleteFlow, Error, ExportFlowParams, unknown>;
}

/**
 * Hook to import a flow.
 */
export function useFlowImportMutation(): UseMutationResult<
  CompleteFlow,
  Error,
  ImportFlowParams,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ImportFlowParams) => importFlowService(params.flowId, params.flowData as any, {}).then(result => result as any as CompleteFlow),
    onSuccess: (_data, variables) => {
      // Invalidate and refetch the flow query
      queryClient.invalidateQueries({
        queryKey: flowQueryKeys.flow(variables.flowId),
      });
    },
  }) as UseMutationResult<CompleteFlow, Error, ImportFlowParams, unknown>;
}

/**
 * Combined hook for all flow operations with a single flow context.
 */
export function useFlowOperations(flowId: string) {
  const queryClient = useQueryClient();

  const flowQuery = useFlowQuery({ flowId });
  const saveMutation = useFlowSaveMutation();
  const publishMutation = useFlowPublishMutation();
  const validateMutation = useFlowValidateMutation();
  const exportMutation = useFlowExportMutation();
  const importMutation = useFlowImportMutation();

  const save = (flow: CompleteFlow) => {
    return saveMutation.mutateAsync({ flowId, flow });
  };

  const publish = (version: string) => {
    return publishMutation.mutateAsync({ flowId, version });
  };

  const validate = (flow: CompleteFlow) => {
    return validateMutation.mutateAsync({ flowId, flow });
  };

  const exportFlow = (version?: string) => {
    return exportMutation.mutateAsync({ flowId, version });
  };

  const importFlow = (flowData: CompleteFlow) => {
    return importMutation.mutateAsync({ flowId, flowData });
  };

  const refetch = () => {
    return queryClient.invalidateQueries({
      queryKey: flowQueryKeys.flow(flowId),
    });
  };

  return {
    // Query state
    flow: flowQuery.data,
    isLoading: flowQuery.isLoading,
    isError: flowQuery.isError,
    error: flowQuery.error,

    // Mutation states
    isSaving: saveMutation.isPending,
    isPublishing: publishMutation.isPending,
    isValidating: validateMutation.isPending,
    isExporting: exportMutation.isPending,
    isImporting: importMutation.isPending,

    // Validation result
    validation: validateMutation.data,

    // Operations
    save,
    publish,
    validate,
    exportFlow,
    importFlow,
    refetch,
  };
}
