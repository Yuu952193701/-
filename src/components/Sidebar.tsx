import React from 'react';
import { LayoutDashboard, Compass, Layers, Sliders, Anchor, BookOpen, ClipboardList, Building2 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '首页', icon: LayoutDashboard },
    { id: 'checklist', label: '清单', icon: ClipboardList },
    { id: 'pre', label: '前置工作 (需求)', icon: Compass },
    { id: 'post', label: '后置工作 (采购合同)', icon: Layers },
    { id: 'post-service', label: '后置工作 (服务合同)', icon: Layers },
    { id: 'bid', label: '标书', icon: Anchor },
    { id: 'suppliers', label: '供应商', icon: Building2 },
    { id: 'knowledge', label: '资料库', icon: BookOpen },
    { id: 'settings', label: '设置', icon: Sliders },
  ];

  return (
    <aside className="w-full md:w-52 bg-[#0F172A] text-slate-300 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 flex-shrink-0 animate-fade-in">
      
      {/* Brand logo card */}
      <div className="p-6 flex-shrink-0 border-b border-slate-800/50">
        <h1 className="text-white font-bold tracking-tight text-lg flex items-center space-x-2">
          <span>工作台</span>
          <span className="text-slate-400 font-normal text-xs bg-slate-800 px-1.5 py-0.5 rounded">V1.0</span>
        </h1>
      </div>

      {/* Navigation options list */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer text-left ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <IconComponent size={14} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer metadata details */}
      <div className="p-4 border-t border-slate-800 bg-[#0B0F19] text-[10px] text-slate-500 font-mono flex flex-col space-y-1">
        <p className="flex items-center space-x-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-400">单人助理 (Local DB)</span>
        </p>
        <p>数据已自动保存至本地缓存 (LocalStorage)</p>
        <p>© 2026 zyr个人使用</p>
      </div>

    </aside>
  );
};
