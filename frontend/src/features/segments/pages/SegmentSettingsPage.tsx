import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { AppRole } from '@shared/types/roles';
import { SegmentTypeTab } from '@/features/configuration/components/segment-types/SegmentTypeTab';
import { KeyTypeTab } from '@/features/configuration/components/dictionaries/KeyTypeTab';

export function SegmentSettingsPage() {
  const { user } = useAuth();
  const permissions = usePermissions({ roles: user?.roles });
  const [activeTab, setActiveTab] = useState('segment-types');

  // Check if user has global-admin role
  const isGlobalAdmin = permissions.hasRole(AppRole.GLOBAL_ADMIN);

  if (!isGlobalAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access segment settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only Global Administrators can manage segment settings. Please contact your
                administrator if you need access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link to="/segments">
          <Button variant="ghost" size="sm" className="hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Segments
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl text-slate-900 mb-2">Segment Settings</h1>
        <p className="text-sm sm:text-base text-slate-600">
          Manage segment types and configuration key types for your IVR system.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-2">
          <TabsTrigger value="segment-types">Segment Types</TabsTrigger>
          <TabsTrigger value="key-types">Key Types</TabsTrigger>
        </TabsList>

        {/* Segment Types Tab */}
        <TabsContent value="segment-types" className="space-y-4">
          <SegmentTypeTab />
        </TabsContent>

        {/* Key Types Tab */}
        <TabsContent value="key-types" className="space-y-4">
          <KeyTypeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
