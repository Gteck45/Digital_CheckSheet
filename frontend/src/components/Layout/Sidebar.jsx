import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Settings,
  X,
  Globe,
  ExternalLink,
  ChevronDown,
  ListChecks,
  ChevronUp,
  FolderOpen,
  LucideChartNoAxesGantt,
  TrainIcon,
  BrainIcon,
  PartyPopper,
  Timer,
  AlignVerticalDistributeCenter,
  FileTextIcon,
  NewspaperIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../utils/api';

const menuItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['Super Admin', 'Admin', 'Manager', 'User']
  },
  {
    name: 'Users',
    path: '/users',
    icon: Users,
    roles: ['Super Admin', 'Admin']
  },
  {
    name: 'Roles',
    path: '/roles',
    icon: Shield,
    roles: ['Super Admin', 'Admin']
  },
  {
    name: 'Pages',
    path: '/pages',
    icon: FileText,
    roles: ['Super Admin', 'Admin']
  },
  {
    name: 'Lines',
    path: '/lines',
    icon: LucideChartNoAxesGantt,
    roles: ['Super Admin', 'Admin']
  },
  {
    name: 'Station',
    path: '/stations',
    icon: TrainIcon,
    roles: ['Super Admin', 'Admin']
  },
  {
    name: 'Brand',
    path: '/brands',
    icon: BrainIcon,
    roles: ['Super Admin', 'Admin']
  },
  {
    name: 'Model',
    path: '/models',
    icon: PartyPopper,
    roles: ['Super Admin', 'Admin']
  },
  {
    name:'Inspection Slot',
    path:'/inspection-slots',
    icon:Timer,
    roles:['Super Admin', 'Admin']
  },
   {
  name: 'Templates',
  path: '/templates',
  icon: ListChecks,
  roles: ['Super Admin', 'Admin']
},
 {
  name: 'Addons',
  path: '/addons',
  icon: AlignVerticalDistributeCenter,
  roles: ['Super Admin', 'Admin']
},
{
  name: 'Manage Report',
  path: '/manage_report',
  icon: FileTextIcon,
  roles: ['Super Admin', 'Admin']
},
{
  name: 'New Audit',
  path: '/audit-list',
  icon: NewspaperIcon,
  roles: ['Super Admin', 'Admin']
}

];

const roleMapping = {
  'super_admin': 'Super Admin',
  'admin': 'Admin',
  'manager': 'Manager',
  'user': 'User'
};

const formatUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? url : `/${url}`;
};

const getPageIcon = (page) => {
  const path = formatUrl(page.url).toLowerCase();
  const name = page.name?.toLowerCase() || '';
  if (path.includes('dashboard') || name.includes('dashboard')) return LayoutDashboard;
  if (path.includes('users') || (path.includes('user') && !path.includes('pages'))) return Users;
  if (path.includes('roles') || path.includes('role')) return Shield;
  if (path.includes('pages') || name.includes('pages')) return FileText;
  if (path.includes('settings') || name.includes('setting')) return Settings;
  return Globe;
};

const EXCLUDED_PAGES = ['Activity Logs', 'Company Website', 'Documentation', 'Help Center'];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [myPages, setMyPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  const filteredMenuItems = menuItems.filter(item => {
    if (!user?.roles) return false;
    return user.roles.some(role => {
      const roleName = typeof role === 'string' ? role : role.name;
      const displayRole = roleMapping[roleName] || roleName;
      return item.roles.includes(displayRole);
    });
  });

  const isActive = (path) => location.pathname === path;

  const toggleMenu = (pageKey) => {
    setExpandedMenus(prev => ({ ...prev, [pageKey]: !prev[pageKey] }));
  };

  const fetchMyPages = useCallback(async () => {
    try {
      if (!user?.id) { setMyPages([]); return; }
      setLoadingPages(true);
      const res = await apiService.get('/pages/my-pages-hierarchy', { params: { _t: Date.now() } });
      const pages = res.data?.data?.pages || [];
      setMyPages(Array.isArray(pages) ? pages : []);
    } catch (err) {
      console.error('Failed to load pages:', err);
      setMyPages([]);
    } finally {
      setLoadingPages(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchMyPages(); }, [fetchMyPages]);

  useEffect(() => {
    const handler = () => fetchMyPages();
    window.addEventListener('permissions-updated', handler);
    return () => window.removeEventListener('permissions-updated', handler);
  }, [fetchMyPages]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200
        dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center w-full">
            <div className=" rounded-lg flex items-center justify-center">
              <img
                src="https://www.easyofficesoftware.com/public/assets_front/imgs/logo_audit_new.png"
                alt="Digital Logo"
                className="object-contain"
              />
            </div>
            {/* <span className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              Digital Checksheet
            </span> */}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation — scrollable middle section */}
        <nav className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                      transition-all duration-200
                      ${active
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md scale-[1.02]'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:translate-x-1'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-white' : ''}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Assigned Pages */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Assigned Pages
            </div>

            {loadingPages ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                Loading...
              </div>
            ) : myPages.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
                No pages assigned
              </div>
            ) : (
              <ul className={`space-y-1 ${myPages.length > 10 ? 'max-h-[400px] overflow-y-auto' : ''}`}>
                {myPages
                  .filter(p => !EXCLUDED_PAGES.includes(p.name))
                  .map((p, index) => {
                    const isExternal = !!p.is_external || (typeof p.url === 'string' && (p.url.startsWith('http://') || p.url.startsWith('https://')));
                    const href = formatUrl(p.url);
                    const pageActive = isActive(href);
                    const isCategory = !!p.is_category;
                    const hasChildren = p.children && p.children.length > 0;
                    const pageKey = p.id ?? `page-${p.name || 'untitled'}-${p.url || ''}-${index}`;
                    const isExpanded = !!expandedMenus[pageKey];
                    const PageIcon = isCategory ? FolderOpen : (isExternal ? ExternalLink : getPageIcon(p));

                    return (
                      <li key={pageKey}>
                        {(hasChildren || isCategory) ? (
                          /* ── Collapsible section header for categories and parent pages ── */
                          <button
                            onClick={() => toggleMenu(pageKey)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors mb-0.5 ${
                              isCategory
                                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60'
                                : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <PageIcon className="h-3.5 w-3.5" />
                              <span className="truncate">{p.name}</span>
                            </div>
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4 shrink-0" />
                              : <ChevronDown className="h-4 w-4 shrink-0" />
                            }
                          </button>
                        ) : (
                          /* ── Leaf page: regular link ── */
                          isExternal ? (
                            <Link
                              to={`/external?url=${encodeURIComponent(href)}&title=${encodeURIComponent(p.name)}`}
                              onClick={onClose}
                              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-200 hover:translate-x-1 group"
                            >
                              <PageIcon className="h-4 w-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                              <span className="truncate">{p.name}</span>
                            </Link>
                          ) : (
                            <Link
                              to={href}
                              onClick={onClose}
                              className={`flex items-center gap-3 flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                pageActive
                                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border-l-4 border-primary-600'
                                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:translate-x-1'
                              }`}
                            >
                              <PageIcon className={`h-4 w-4 ${pageActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                              <span className="truncate">{p.name}</span>
                            </Link>
                          )
                        )}

                        {hasChildren && isExpanded && (
                          <ul className="ml-3 mb-2 space-y-1">
                            {p.children.map((child, childIndex) => {
                              const childExternal = !!child.is_external || (typeof child.url === 'string' && (child.url.startsWith('http://') || child.url.startsWith('https://')));
                              const childHref = formatUrl(child.url);
                              const childActive = isActive(childHref);
                              const ChildIcon = childExternal ? ExternalLink : getPageIcon(child);
                              const childKey = child.id ?? `${pageKey}-child-${child.name || ''}-${child.url || ''}-${childIndex}`;

                              return (
                                <li key={childKey}>
                                  {childExternal ? (
                                    <Link
                                      to={`/external?url=${encodeURIComponent(childHref)}&title=${encodeURIComponent(child.name)}`}
                                      onClick={onClose}
                                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-all duration-200 hover:translate-x-1 group"
                                    >
                                      <ChildIcon className="h-3 w-3 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                                      <span className="truncate">{child.name}</span>
                                    </Link>
                                  ) : (
                                    <Link
                                      to={childHref}
                                      onClick={onClose}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                        childActive
                                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 hover:translate-x-1'
                                      }`}
                                    >
                                      <ChildIcon className={`h-3 w-3 ${childActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                                      <span className="truncate">{child.name}</span>
                                    </Link>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </nav>

        {/* User section — pinned at bottom */}
      </div>
    </>
  );
};

export default Sidebar;
