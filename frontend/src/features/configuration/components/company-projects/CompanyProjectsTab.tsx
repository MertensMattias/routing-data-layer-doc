import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building2, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import * as companyProjectService from '@/services/company-project';
import { getApiErrorMessage } from '@/api/client';
import type { CompanyProject } from '@/api/types';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/common';

// Zod schema for form validation
const projectFormSchema = z.object({
  customerId: z
    .string()
    .min(1, 'Customer ID is required')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Must be UPPERCASE alphanumeric'),
  projectId: z
    .string()
    .min(1, 'Project ID is required')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Must be UPPERCASE alphanumeric'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  oktaGroup: z.string().optional(),
  isActive: z.boolean().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export function CompanyProjectsTab() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<CompanyProject | null>(null);

  // Load projects using TanStack Query
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['company-projects'],
    queryFn: () => companyProjectService.listProjects(),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Create form
  const createForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      customerId: '',
      projectId: '',
      displayName: '',
      description: '',
      oktaGroup: '',
      isActive: true,
    },
  });

  // Edit form
  const editForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      customerId: '',
      projectId: '',
      displayName: '',
      description: '',
      oktaGroup: '',
      isActive: true,
    },
  });

  const handleManualRefresh = () => {
    refetch();
    toast.info('Refreshing projects...');
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ProjectFormData) =>
      companyProjectService.createProject({
        customerId: data.customerId.toUpperCase(),
        projectId: data.projectId.toUpperCase(),
        displayName: data.displayName,
        description: data.description || undefined,
        oktaGroup: data.oktaGroup || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-projects'] });
      toast.success('Project created successfully');
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      toast.error('Failed to create project: ' + getApiErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProjectFormData> }) =>
      companyProjectService.updateProject(id, {
        displayName: data.displayName,
        description: data.description || undefined,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-projects'] });
      toast.success('Project updated successfully');
      setEditingProject(null);
      editForm.reset();
    },
    onError: (error: unknown) => {
      toast.error('Failed to update project: ' + getApiErrorMessage(error));
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (project: CompanyProject) =>
      companyProjectService.updateProject(project.companyProjectId, {
        isActive: !project.isActive,
      }),
    onSuccess: (_, project) => {
      queryClient.invalidateQueries({ queryKey: ['company-projects'] });
      toast.success(`Project ${!project.isActive ? 'activated' : 'deactivated'}`);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update project: ' + getApiErrorMessage(error));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => companyProjectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-projects'] });
      toast.success('Project deactivated successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete project: ' + getApiErrorMessage(error));
    },
  });

  const handleCreate = createForm.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  const handleUpdate = editForm.handleSubmit((data) => {
    if (!editingProject) return;
    updateMutation.mutate({ id: editingProject.companyProjectId, data });
  });

  const handleToggleActive = (project: CompanyProject) => {
    toggleActiveMutation.mutate(project);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this project? This will deactivate it.')) return;
    deleteMutation.mutate(id);
  };

  const openEditDialog = (project: CompanyProject) => {
    setEditingProject(project);
    editForm.reset({
      customerId: project.customerId,
      projectId: project.projectId,
      displayName: project.displayName,
      description: project.description || '',
      oktaGroup: project.oktaGroup,
      isActive: project.isActive,
    });
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState error={error} onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Projects
          </CardTitle>
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
              aria-label="Refresh projects"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (open) {
                  createForm.reset();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Create a new company project configuration
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerId">Customer ID *</Label>
                      <Input
                        id="customerId"
                        placeholder="EEBL"
                        {...createForm.register('customerId')}
                        className={createForm.formState.errors.customerId ? 'border-red-500' : ''}
                      />
                      {createForm.formState.errors.customerId && (
                        <p className="text-sm text-red-600">
                          {createForm.formState.errors.customerId.message}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">UPPERCASE alphanumeric</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectId">Project ID *</Label>
                      <Input
                        id="projectId"
                        placeholder="ENERGYLINE"
                        {...createForm.register('projectId')}
                        className={createForm.formState.errors.projectId ? 'border-red-500' : ''}
                      />
                      {createForm.formState.errors.projectId && (
                        <p className="text-sm text-red-600">
                          {createForm.formState.errors.projectId.message}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">UPPERCASE alphanumeric</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name *</Label>
                      <Input
                        id="displayName"
                        placeholder="EEBL Energyline Project"
                        {...createForm.register('displayName')}
                        className={createForm.formState.errors.displayName ? 'border-red-500' : ''}
                      />
                      {createForm.formState.errors.displayName && (
                        <p className="text-sm text-red-600">
                          {createForm.formState.errors.displayName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Main IVR routing configuration"
                        {...createForm.register('description')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oktaGroup">Okta Group</Label>
                      <Input
                        id="oktaGroup"
                        placeholder="okta-eebl-flow"
                        {...createForm.register('oktaGroup')}
                      />
                      <p className="text-xs text-slate-500">Auto-generated if not provided</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Creating...' : 'Create Project'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <EmptyState
            title="No projects found. Create one to get started."
            action={{
              label: 'Create First Project',
              onClick: () => setIsCreateDialogOpen(true),
            }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Project ID</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Okta Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.companyProjectId}
                  onDoubleClick={() => openEditDialog(project)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono">{project.customerId}</TableCell>
                  <TableCell className="font-mono">{project.projectId}</TableCell>
                  <TableCell>{project.displayName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{project.oktaGroup}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        project.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {project.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(project)}
                        title={project.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Switch checked={project.isActive} />
                      </Button>
                      <Dialog
                        open={editingProject?.companyProjectId === project.companyProjectId}
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingProject(null);
                          } else if (!editingProject) {
                            openEditDialog(project);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(project)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <form onSubmit={handleUpdate}>
                            <DialogHeader>
                              <DialogTitle>Edit Project</DialogTitle>
                              <DialogDescription>
                                Update project configuration
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Customer ID</Label>
                                <Input value={editForm.watch('customerId')} disabled />
                              </div>
                              <div className="space-y-2">
                                <Label>Project ID</Label>
                                <Input value={editForm.watch('projectId')} disabled />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-displayName">Display Name *</Label>
                                <Input
                                  id="edit-displayName"
                                  {...editForm.register('displayName')}
                                  className={editForm.formState.errors.displayName ? 'border-red-500' : ''}
                                />
                                {editForm.formState.errors.displayName && (
                                  <p className="text-sm text-red-600">
                                    {editForm.formState.errors.displayName.message}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Input
                                  id="edit-description"
                                  {...editForm.register('description')}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="edit-isActive">Active</Label>
                                <Switch
                                  id="edit-isActive"
                                  checked={editForm.watch('isActive') ?? true}
                                  onCheckedChange={(checked) => editForm.setValue('isActive', checked)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingProject(null)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(project.companyProjectId)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

