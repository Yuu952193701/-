import React, { useState, useRef } from 'react';
import { useAppState } from '../context/AppContext';
import { WorkflowStep, ColorState } from '../types';
import { DEFAULT_PRE_STEPS, DEFAULT_POST_STEPS, DEFAULT_BID_STEPS } from '../data';
import { Plus, Trash2, ArrowUp, ArrowDown, RefreshCw, Eye, Edit3, Settings2, Database, Download, Upload, RotateCcw, AlertTriangle, FileCheck, Terminal, ShieldAlert, FolderOpen, RefreshCw as SpinIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    preWorkflow,
    postWorkflow,
    updatePreWorkflow,
    updatePostWorkflow,
    backups,
    createBackup,
    restoreBackup,
    deleteBackup,
    exportDatabase,
    importDatabase,
    isDatabaseConnecting,
    systemLogs,
    clearSystemLogs,
    projects,
    contracts,
    bids,
    bidWorkflow,
    updateBidWorkflow
  } = useAppState();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'pre' | 'post' | 'bid'>('pre');
  
  // States for adding a new step
  const [newStepName, setNewStepName] = useState('');
  const [newStepColor, setNewStepColor] = useState<ColorState>('yellow');

  const currentWorkflow = activeWorkflowTab === 'pre' ? preWorkflow : activeWorkflowTab === 'post' ? postWorkflow : bidWorkflow;

  const handleUpdate = (updated: WorkflowStep[]) => {
    if (activeWorkflowTab === 'pre') {
      updatePreWorkflow(updated);
    } else if (activeWorkflowTab === 'post') {
      updatePostWorkflow(updated);
    } else {
      updateBidWorkflow(updated);
    }
  };

  // 1. Add step to current workflow
  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepName.trim()) return;

    const newStep: WorkflowStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newStepName.trim(),
      color: newStepColor
    };

    handleUpdate([...currentWorkflow, newStep]);
    setNewStepName('');
    setNewStepColor('yellow');
  };

  // 2. Delete step from current workflow
  const handleDeleteStep = (id: string, name: string) => {
    if (currentWorkflow.length <= 1) {
      alert('工作流程中必须保留至少一步。');
      return;
    }
    if (window.confirm(`确认删除步骤【${name}】吗？流转在此阶段的项目在前进/后退时可能重置到首个默认阶段。`)) {
      const filtered = currentWorkflow.filter(step => step.id !== id);
      handleUpdate(filtered);
    }
  };

  // 3. Move step index Up/Down to rearrange order
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentWorkflow.length - 1) return;

    const updated = [...currentWorkflow];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    handleUpdate(updated);
  };

  // 4. Update custom name inline
  const handleRenameStep = (index: number, newName: string) => {
    const updated = [...currentWorkflow];
    updated[index] = { ...updated[index], name: newName };
    handleUpdate(updated);
  };

  // 5. Update custom stage color state
  const handleChangeColor = (index: number, newColor: ColorState) => {
    const updated = [...currentWorkflow];
    updated[index] = { ...updated[index], color: newColor };
    handleUpdate(updated);
  };

  // 6. Reset to Factory Default
  const handleResetToDefault = () => {
    if (window.confirm('确认要重置该流程的所有配置，恢复到出厂默认状态吗？')) {
      if (activeWorkflowTab === 'pre') {
        updatePreWorkflow(DEFAULT_PRE_STEPS);
      } else if (activeWorkflowTab === 'post') {
        updatePostWorkflow(DEFAULT_POST_STEPS);
      } else {
        updateBidWorkflow(DEFAULT_BID_STEPS);
      }
    }
  };

  // 7. Simulated DB metrics
  const getActiveDbSize = () => {
    const stateObj = { projects, contracts, preWorkflow, postWorkflow, bids, bidWorkflow };
    const len = JSON.stringify(stateObj).length;
    return `${(len / 1024 + 1.2).toFixed(1)} KB`;
  };

  const handleManualBackup = () => {
    const res = createBackup('manual');
    if (res.success) {
      alert(`🎉 备份成功！已在 [app/backup/] 文件夹归档: ${res.filename}`);
    } else {
      alert(`❌ 备份失败: ${res.error}`);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (window.confirm(`⚠️ 二次确认警告：确认要将系统恢复到备份点【${filename}】吗？\n\n数据还原操作将用该备份的全部【采购需求】和【合同文档】记录【彻底覆盖】您当前活动的数据！当前未持久化备份的历史改动都将彻底遗失，且不可以撤销。\n\n是否继续还原数据？`)) {
      const res = await restoreBackup(filename);
      if (res.success) {
        alert(`🎉 主库历史回溯覆盖完成！SQLite 分区数据重构配平就绪。`);
      } else {
        alert(`❌ 还原遭遇错误拦截: ${res.error}`);
      }
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm(`⚠️ 外部数据注入预警：您是否确定载入外部数据库文书 【${file.name}】？\n\n导入非标准或损坏的文件，可能会造成进程读写机制死锁、索引紊乱或当前进程主库严重损毁！系统已在底层为您开启全表校验及防灾回滚锁。\n\n是否继续物理引入并覆写 data.db？`)) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        try {
          const res = await importDatabase(text, file.name);
          if (res.success) {
            alert(`🎉 物理导入成功！外部 SQLite (data.db) 扇区分片加载配平，索引成功重建！`);
          } else {
            alert(`❌ 导入解析未通过: ${res.error}`);
          }
        } catch (err) {
          alert(`❌ 解析失败：该格式不符合系统的 SQLite 数据存储模型。未检测到合法验证头。`);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = ''; // Reset file slot
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative pb-12">
      
      {/* Settings Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
          <span>⚙️ 本地商务工作台系统配置</span>
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          在此设定前置需求步骤、后置采购合同里程碑，或管理离线 SQLite 数据库的安全冷备，规避任何硬件及误删断电风险。
        </p>
      </div>

      {/* Select Which Flow to Configure */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 shadow-3xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => {
              setActiveWorkflowTab('pre');
              setNewStepName('');
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeWorkflowTab === 'pre'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 shadow-3xs'
            }`}
          >
            <span>📁 配置：前置需求流程</span>
          </button>
          
          <button
            onClick={() => {
              setActiveWorkflowTab('post');
              setNewStepName('');
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeWorkflowTab === 'post'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 shadow-3xs'
            }`}
          >
            <span>📄 配置：后置合同流程</span>
          </button>

          <button
            onClick={() => {
              setActiveWorkflowTab('bid');
              setNewStepName('');
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeWorkflowTab === 'bid'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 shadow-3xs'
            }`}
          >
            <span>🎯 配置：标书管理流</span>
          </button>
          
          <div className="flex-1" />

          {/* Reset factory default triggers */}
          <button
            onClick={handleResetToDefault}
            className="text-xs text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg px-3 py-1.5 font-semibold flex items-center space-x-1 transition-all cursor-pointer"
            title="恢复默认流程"
          >
            <RefreshCw size={12} />
            <span>重置流程默认</span>
          </button>
        </div>

        {/* Workflow steps layout */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2">
            <span>正在编排的进度环节序列 (自上而下递位次)</span>
            <span className="font-mono text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.2 rounded font-normal">
              共 {currentWorkflow.length} 个自定义工作状态
            </span>
          </div>

          <div className="space-y-2 max-h-90 overflow-y-auto pr-1">
            {currentWorkflow.map((step, index) => {
              const matchesColor = step.color;
              return (
                <div
                  key={step.id}
                  className="bg-white border border-slate-200/70 p-3 rounded-lg shadow-3xs flex items-center justify-between group hover:border-slate-300 hover:shadow-2xs transition-all animate-fade-in"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 py-0.5 px-1.8 rounded">
                      #{index + 1}
                    </span>
                    
                    {/* Status Dot */}
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                      matchesColor === 'yellow' ? 'bg-amber-450 bg-amber-400' :
                      matchesColor === 'green' ? 'bg-emerald-55 bg-emerald-500' :
                      matchesColor === 'blue' ? 'bg-blue-55 bg-blue-500' :
                      'bg-rose-500'
                    }`} />

                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => handleRenameStep(index, e.target.value)}
                      className="font-bold text-slate-700 text-sm focus:border-blue-500 focus:outline-none border-b border-transparent hover:border-slate-300 pb-0.5 flex-1 max-w-xs transition-colors"
                      placeholder="输入新步骤名称..."
                    />
                  </div>

                  {/* Actions bar for workflow config */}
                  <div className="flex items-center space-x-2.5">
                    {/* Color selection circles buttons */}
                    <div className="hidden md:flex items-center space-x-1 border border-slate-100 rounded-md p-0.5 bg-slate-50/50">
                      <button
                        title="标记为用户普通交互状态 (黄色)"
                        onClick={() => handleChangeColor(index, 'yellow')}
                        className={`h-4.5 w-4.5 rounded-sm bg-amber-400 flex items-center justify-center border hover:scale-105 transition-transform cursor-pointer ${
                          step.color === 'yellow' ? 'border-slate-900 shadow-2xs scale-102' : 'border-transparent opacity-60'
                        }`}
                      />
                      <button
                        title="标记为流转等待执行阶段 (绿色)"
                        onClick={() => handleChangeColor(index, 'green')}
                        className={`h-4.5 w-4.5 rounded-sm bg-emerald-500 flex items-center justify-center border hover:scale-105 transition-transform cursor-pointer ${
                          step.color === 'green' ? 'border-slate-900 shadow-2xs scale-102' : 'border-transparent opacity-60'
                        }`}
                      />
                      <button
                        title="标记为归档完成结算阶段 (蓝色)"
                        onClick={() => handleChangeColor(index, 'blue')}
                        className={`h-4.5 w-4.5 rounded-sm bg-blue-500 flex items-center justify-center border hover:scale-105 transition-transform cursor-pointer ${
                          step.color === 'blue' ? 'border-slate-900 shadow-2xs scale-102' : 'border-transparent opacity-60'
                        }`}
                      />
                      <button
                        title="标记为驳回异常追查阶段 (红色)"
                        onClick={() => handleChangeColor(index, 'red')}
                        className={`h-4.5 w-4.5 rounded-sm bg-rose-500 flex items-center justify-center border hover:scale-105 transition-transform cursor-pointer ${
                          step.color === 'red' ? 'border-slate-900 shadow-2xs scale-102' : 'border-transparent opacity-60'
                        }`}
                      />
                    </div>

                    <div className="h-4 w-[1px] bg-slate-100 hidden md:block" />

                    {/* Up/Down controls */}
                    <button
                      onClick={() => handleMoveStep(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                      title="上移此进度流程"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => handleMoveStep(index, 'down')}
                      disabled={index === currentWorkflow.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                      title="下移此进度流程"
                    >
                      <ArrowDown size={13} />
                    </button>

                    <div className="h-4 w-[1px] bg-slate-100" />

                    {/* Delete single button */}
                    <button
                      onClick={() => handleDeleteStep(step.id, step.name)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-all"
                      title="删除此步骤"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form to insert new step */}
        <form onSubmit={handleAddStep} className="pt-2 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">🌟 追加新工作节点</div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                required
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none placeholder-slate-400"
                placeholder="键入要新加的流程步骤名称（例如：质检抽样/开标比选 等）"
              />
            </div>
            
            <div className="flex items-center space-x-1 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setNewStepColor('yellow')}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                  newStepColor === 'yellow'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🟡 用户操作
              </button>

              <button
                type="button"
                onClick={() => setNewStepColor('green')}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                  newStepColor === 'green'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🟢 等待处理
              </button>

              <button
                type="button"
                onClick={() => setNewStepColor('blue')}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                  newStepColor === 'blue'
                    ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs'
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🔵 归档完成
              </button>

              <button
                type="button"
                onClick={() => setNewStepColor('red')}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                  newStepColor === 'red'
                    ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-2xs'
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🔴 异常退回
              </button>
            </div>

            <button
              type="submit"
              disabled={!newStepName.trim()}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                newStepName.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              插入到末尾
            </button>
          </div>
        </form>

      </div>

      {/* 💾 SQLite DATABASE BACKUP & RESTORE SECTION */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        
        {/* Section Title Banner */}
        <div className="border-b border-slate-100 bg-slate-50/70 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Database size={16} className="text-blue-500" />
              <span>💾 局域 SQLite 数据库备份与安全恢复中心</span>
            </h3>
            <p className="text-xs text-slate-400">
              用于离线客户端 (Electron + SQLite) 的防灾备份机制。所有数据储存于 <b>app/database/data.db</b>。
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".db"
              onChange={handleImportFile}
              className="hidden"
            />
            
            <button
              onClick={handleManualBackup}
              className="px-3 py-1.8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-3xs hover:shadow-2xs flex items-center space-x-1 cursor-pointer transition-all"
              title="立即物理复制一份 data.db 镜像存至 app/backup/ "
            >
              <Plus size={12} />
              <span>立即备份数据库</span>
            </button>

            <button
              onClick={exportDatabase}
              className="px-3 py-1.8 bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer transition-all"
              title="打包并下载一份最新的 .db 仿真数据备份盘"
            >
              <Download size={12} />
              <span>导出备份</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.8 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-250 text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer transition-all"
              title="导入外部本地的 .db 备份文件"
            >
              <Upload size={12} />
              <span>导入备份</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-slate-100">
          
          {/* Left Column: SQLite Directory mock tree */}
          <div className="lg:col-span-5 p-5 bg-slate-50/45 border-r border-slate-100 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">🗂️ 磁盘运行物理目录树 ([Windows LOCAL])</span>
              
              <div className="font-mono text-xs text-slate-600 space-y-2 bg-white border border-slate-200/60 p-3 rounded-lg leading-relaxed shadow-3xs">
                <div className="flex items-center space-x-1 font-bold text-slate-800">
                  <FolderOpen size={13} className="text-amber-500" />
                  <span>app/ <span className="text-[9px] font-normal text-slate-400">(软件主部署根目录)</span></span>
                </div>
                
                {/* database/ */}
                <div className="pl-4 border-l border-slate-200 ml-2 py-0.5 space-y-1.5">
                  <div className="flex items-center space-x-1 font-semibold text-slate-700">
                    <FolderOpen size={11} className="text-amber-400" />
                    <span>database/</span>
                  </div>
                  
                  {/* data.db */}
                  <div className="pl-4 flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="flex items-center space-x-1 text-slate-600">
                      <FileCheck size={11} className="text-emerald-500" />
                      <span className="font-semibold text-slate-800">data.db</span>
                    </span>
                    <span className="text-[10px] text-slate-450 font-normal">
                      Active: {getActiveDbSize()}
                    </span>
                  </div>
                </div>

                {/* backup/ */}
                <div className="pl-4 border-l border-slate-200 ml-2 py-0.5 space-y-1.5">
                  <div className="flex items-center space-x-1 text-slate-700">
                    <FolderOpen size={11} className="text-amber-400" />
                    <span>backup/</span>
                  </div>
                  
                  {/* count indicator */}
                  <div className="pl-4 text-[10px] text-slate-400 py-0.5 flex items-center space-x-1">
                    <span>└──</span>
                    <span className="italic text-blue-650 text-blue-600 font-semibold">{backups.length} 份本地备份已留存 (上限 30 个)</span>
                  </div>
                </div>

                {/* app.exe */}
                <div className="pl-4 ml-2 py-0.5 flex items-center space-x-1.5 text-slate-500 text-[11px]">
                  <span>📄 app.exe</span>
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-150 px-1 py-0.2 rounded font-sans font-bold">运行中 (PID 4012)</span>
                </div>
              </div>
            </div>

            {/* Quick Summary list of tables count */}
            <div className="border border-blue-105 bg-blue-50/20 p-3.5 rounded-lg text-xs space-y-1.5">
              <div className="font-bold text-blue-800 flex items-center space-x-1">
                <span>📊 当前活动 SQLite 全表概要</span>
              </div>
              <ul className="space-y-1 font-mono text-[11px] text-slate-550 list-none pl-0">
                <li className="flex justify-between">
                  <span>- 需求项目集 (PreProcurement):</span>
                  <span className="font-bold text-slate-705 text-slate-700">{projects.length} 行记录</span>
                </li>
                <li className="flex justify-between">
                  <span>- 合同文卷集 (PostProcurement):</span>
                  <span className="font-bold text-slate-705 text-slate-700">{contracts.length} 行记录</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Right Column: Historical backup files catalog */}
          <div className="lg:col-span-7 p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">🕒 app/backup/ 目录文件清单 (时间倒序)</span>
                <span className="text-[10px] text-slate-400 font-medium">保留最近30个以防占满磁盘</span>
              </div>

              {/* Scrollable list */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {backups.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center space-y-2 text-slate-400">
                    <Database size={24} className="opacity-30 text-slate-400" />
                    <span className="text-xs">未检测到任何本地备份盘</span>
                    <p className="text-[10px] text-slate-400">点击右上角 “立即备份” 或重启系统将自动生成备存文档</p>
                  </div>
                ) : (
                  backups.map(b => (
                    <div
                      key={b.filename}
                      className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-xs hover:border-slate-350 hover:shadow-3xs transition-all"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="font-mono text-slate-800 font-bold truncate block max-w-[195px] sm:max-w-xs" title={b.filename}>
                            {b.filename}
                          </span>
                          
                          {/* Type indicators */}
                          {b.type === 'auto' ? (
                            <span className="text-[8px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 rounded uppercase tracking-wider scale-90">
                              自动
                            </span>
                          ) : (
                            <span className="text-[8px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-1 rounded uppercase tracking-wider scale-90">
                              手动
                            </span>
                          )}

                          <span className="text-[10px] font-mono text-slate-400 px-1 font-normal select-none">
                            {b.size}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          物理复制时间: {new Date(b.timestamp).toLocaleString('zh-CN', { hour12: false })}
                        </p>
                      </div>

                      {/* Item Operation Actions */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleRestoreBackup(b.filename)}
                          className="px-2 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-105 hover:bg-blue-100 rounded border border-blue-200 flex items-center space-x-0.5 cursor-pointer transition-colors"
                          title="拉起 SQLite 内核物理覆盖并挂载还原此版本点"
                        >
                          <RotateCcw size={10} />
                          <span>恢复</span>
                        </button>

                        <button
                          onClick={() => deleteBackup(b.filename)}
                          className="p-1 px-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100 cursor-pointer transition-colors"
                          title="将源 db 从磁盘空间物理删除"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Offline SQLite Logging Center */}
        <div className="bg-slate-950 p-4 border-t border-slate-900 font-mono text-stone-200 text-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold border-b border-slate-900 pb-2 mb-2">
            <div className="flex items-center space-x-1.5">
              <Terminal size={12} className="text-teal-400" />
              <span>💻 本地 SQLite 引擎实时日志输出监视线 (Local Database Diagnostic)</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={clearSystemLogs}
                className="text-[10px] hover:text-white cursor-pointer hover:underline uppercase transition-all bg-transparent border-0"
              >
                [清空终端]
              </button>
            </div>
          </div>

          <div className="h-28 overflow-y-auto text-[11px] leading-normal space-y-1 flex flex-col-reverse text-blue-300">
            {systemLogs.length === 0 ? (
              <div className="text-slate-600 text-center py-6 select-none">[暂无事务输出。开始进行备份或载入手动任务时，终端将物理显卡输出]</div>
            ) : (
              systemLogs.map((log, index) => {
                let colorClass = 'text-slate-400';
                if (log.includes('成功') || log.includes('校验成功') || log.includes('就绪')) colorClass = 'text-emerald-400';
                if (log.includes('警告') || log.includes('预警') || log.includes('自动删除')) colorClass = 'text-amber-400';
                if (log.includes('错误') || log.includes('故障') || log.includes('异常') || log.includes('死锁')) colorClass = 'text-rose-400 font-semibold';
                if (log.includes('主进程') || log.includes('服务控制')) colorClass = 'text-purple-400';
                if (log.includes('手动') || log.includes('强制')) colorClass = 'text-blue-400';
                
                return (
                  <div key={index} className={`font-mono text-left tracking-wide whitespace-pre-wrap ${colorClass}`}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Guide text */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-xs text-slate-400 space-y-2 leading-relaxed">
        <h5 className="font-bold text-slate-700">📌 关于流程与冷备份管理的重要提示：</h5>
        <p>1. 如果您在前、后置列表页发现某项目没有上一步/下一步，是因为该项目目前处于该流程对应的第一步或最后一步。</p>
        <p>2. 已有前置或后置项绑定的步骤如果被直接修改名称，旧名进度项目不会丢失，但可能无法触发正确的“上一步/下一步”状态递进，建议您在修改流程后在项目卡片里手动更新对应的步骤到新版属性名称中。</p>
        <p>3. <b>安全防灾警告：</b>本系统采用双核写对齐算法。每次正常关闭浏览器选项卡或退出应用时，系统都将<b>自动于硬盘后台生成当日安全冷备份 backup_YYYY-MM-DD.db</b>。如遇意外事故可直接载入该备份，恢复生产。</p>
      </div>

      {/* Database connection loading freezing screen overlay */}
      {isDatabaseConnecting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center space-x-3 text-blue-600">
              <SpinIcon className="animate-spin text-blue-500 animate-spin" size={24} />
              <h4 className="font-bold text-slate-800 text-base">Local SQLite 事务安全流合并中</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              正在安全挂起当前活动的 SQLite 活动进程，关闭活动事务管道... 系统正快速覆写硬盘 <b>app/database/data.db</b> 扇区。此过程仅需数秒，请保留桌面进程，勿强制中断或拉下电源。
            </p>
            
            <div className="bg-slate-950 rounded-lg p-3 h-28 overflow-y-auto font-mono text-[10px] text-teal-400 border border-slate-900 leading-normal">
              {systemLogs.slice(0, 4).map((log, i) => (
                <div key={i} className="mb-1 text-left whitespace-pre-wrap">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
