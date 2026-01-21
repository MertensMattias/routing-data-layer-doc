import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Workflow, Box, MessageSquare, Settings, Wrench, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { GlobalErrorHandler } from '@/components/layout';
import { CompanyProjectHeader } from '@/components/common';
import { AppRole } from '@shared/types/roles';

export function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const permissions = usePermissions({ roles: user?.roles });

  const navItems = [
    { path: '/home', icon: Home, label: 'Home', show: true },
    { path: '/routing', icon: Workflow, label: 'Routing', show: permissions.canView },
    { path: '/segments', icon: Box, label: 'Segments', show: permissions.canView },
    { path: '/messages', icon: MessageSquare, label: 'Messages', show: permissions.canView },
    { path: '/demo', icon: Workflow, label: 'Demos', show: true },
    { path: '/config', icon: Wrench, label: 'Configuration', show: permissions.hasRole(AppRole.GLOBAL_ADMIN) },
    { path: '/admin', icon: Settings, label: 'Admin', show: permissions.isAdmin },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl text-gray-900">IVR Routing Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Configuration & Management</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-600" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            {user?.roles && user.roles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
          <div className="mt-3 text-xs text-gray-500">
            <p>Environment: {import.meta.env.MODE}</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto">
        <GlobalErrorHandler />
        <CompanyProjectHeader />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
