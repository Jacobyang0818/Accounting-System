import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, FilePlus, Database, BarChart2, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Layout() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const navigation = [
    { name: '總帳', href: '/', icon: LayoutDashboard },
    { name: '報表', href: '/report', icon: BarChart2 },
    { name: '快速輸入', href: '/entry', icon: FilePlus },
    { name: '基礎資料', href: '/master-data', icon: Database },
    { name: '設定', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-200">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-colors">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-brand-600 dark:text-brand-500">Ledger UI</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const current = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        current
                          ? 'border-brand-500 text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                    >
                      <item.icon className={`mr-2 h-4 w-4 ${current ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                title="切換深淺色模式"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 text-sm font-medium transition-colors"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full py-6 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300 text-slate-900 dark:text-slate-100">
        <Outlet />
      </main>
    </div>
  );
}
