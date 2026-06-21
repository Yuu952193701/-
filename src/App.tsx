import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PreProcurement } from './components/PreProcurement';
import { PostProcurement } from './components/PostProcurement';
import { Bidding } from './components/Bidding';
import { KnowledgeLibrary } from './components/KnowledgeLibrary';
import { Settings } from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pre':
        return <PreProcurement />;
      case 'post':
        return <PostProcurement />;
      case 'bid':
        return <Bidding />;
      case 'knowledge':
        return <KnowledgeLibrary />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const getSystemPath = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'C:\\采购管理系统\\仪表盘\\概览.exe';
      case 'pre':
        return 'D:\\采购\\前置工作\\需求池管理\\A001_机油采购';
      case 'post':
        return 'D:\\采购\\后置工作\\合同文件管理\\HH01-2026-015';
      case 'bid':
        return 'D:\\采购\\标书\\BiddingVault.db';
      case 'knowledge':
        return 'D:\\采购\\资料库\\KnowledgeBase.db';
      case 'settings':
        return 'C:\\采购管理系统\\配置中心\\流程节点配置.ini';
      default:
        return 'C:\\采购管理系统\\工作台';
    }
  };

  return (
    <AppProvider>
      <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC] text-slate-900 antialiased font-sans select-none">
        
        {/* Left Side: Brand & Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Right Side: Header + Workspace + Bottom Rail */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          
          {/* Top Header / Search */}
          <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 shadow-2xs z-10">
            <div className="flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <input 
                  type="text" 
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-md py-1.5 pl-8 pr-4 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400" 
                  placeholder="搜索项目、合同、标签或备注... (本地检索模式开启)" 
                />
                <div className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs text-slate-500 font-medium bg-slate-100 hover:bg-slate-200/60 px-2 py-1 rounded transition-colors">本地高效模式 (LocalStorage DB)</span>
              <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-100 px-2 py-0.8 rounded">
                <span className="text-[10px] font-bold text-emerald-600">系统就绪</span>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
          </header>

          {/* Primary scrolling workspace content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto animate-fade-in">
              {/* Pass down globalSearch context or use as visual theme integration */}
              {renderContent()}
            </div>
          </main>

          {/* Bottom Activity Rail (High Density Style) */}
          <footer className="h-8 bg-slate-50 border-t border-slate-200 px-4 flex items-center justify-between flex-shrink-0 font-mono text-[10px] text-slate-400">
            <div className="flex items-center space-x-4">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">SYSTEM ACTIVE</span>
              <span className="text-slate-300">|</span>
              <span className="text-[10px] text-slate-400">
                文件归档目录: <span className="text-slate-600 font-semibold">{getSystemPath()}</span>
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span>状态正常</span>
              <span className="text-slate-400 bg-slate-200 px-1.5 py-0.2 rounded text-[9px]">UTC +8</span>
            </div>
          </footer>

        </div>

      </div>
    </AppProvider>
  );
}
