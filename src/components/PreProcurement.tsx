import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { DemandProject, SHIPS } from '../types';
import { ItemDetailsModal } from './ItemDetailsModal';
import { isOverdue, formatChineseDate } from '../data';
import { Search, Plus, ArrowLeft, ArrowRight, Trash2, Edit2, FolderOpen, Tag, Calendar, AlertTriangle, CheckSquare, Layers, HelpCircle, X } from 'lucide-react';

export const PreProcurement: React.FC = () => {
  const {
    projects,
    contracts,
    preWorkflow,
    addProject,
    updateProject,
    deleteProject,
    moveProjectStep
  } = useAppState();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShip, setSelectedShip] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [filterUrgent, setFilterUrgent] = useState<boolean | 'all'>('all');

  // Detail Modal States
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectCode, setNewProjectCode] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectShip, setNewProjectShip] = useState('鸿鹄01');

  // Helper to resolve color of a project status
  const getProjectStatusColor = (statusName: string) => {
    const step = preWorkflow.find(s => s.name === statusName);
    return step ? step.color : 'green';
  };

  // Helper to check next and prev step existence
  const canMove = (project: DemandProject) => {
    const currentIndex = preWorkflow.findIndex(s => s.name === project.status);
    return {
      hasPrev: currentIndex > 0,
      hasNext: currentIndex < preWorkflow.length - 1,
    };
  };

  // Handle core project creation
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectCode.trim() || !newProjectName.trim()) {
      alert('请填写项目编号和项目名称');
      return;
    }

    addProject({
      code: newProjectCode.trim(),
      name: newProjectName.trim(),
      ship: newProjectShip,
    });

    // Reset Form
    setNewProjectCode('');
    setNewProjectName('');
    setNewProjectShip('鸿鹄01');
    setShowCreateModal(false);
  };

  // Filter logic
  const filteredProjects = projects.filter(project => {
    // 1. Search term match
    const searchLower = searchTerm.toLowerCase().trim();
    const associatedContract = project.contractId ? contracts.find(c => c.id === project.contractId) : null;
    const contractLabel = associatedContract ? associatedContract.name.toLowerCase() : '';
    
    const matchesSearch = !searchLower || 
      project.code.toLowerCase().includes(searchLower) ||
      project.name.toLowerCase().includes(searchLower) ||
      project.remark.toLowerCase().includes(searchLower) ||
      contractLabel.includes(searchLower) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchLower));

    // 2. Ship match
    const matchesShip = selectedShip === 'all' || project.ship === selectedShip;

    // 3. Status match
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;

    // 4. Color status match
    const color = getProjectStatusColor(project.status);
    const matchesColor = selectedColor === 'all' || color === selectedColor;

    // 5. Urgency match
    const matchesUrgent = filterUrgent === 'all' || project.isUrgent === filterUrgent;

    return matchesSearch && matchesShip && matchesStatus && matchesColor && matchesUrgent;
  });

  // Sort by latest updated/created time first
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`确认删除需求项目【${name}】吗？\n\n此操作仅在系统内删除该项目进度流转记录，不会删除您电脑本地的任何实际对应文件或工作文件夹。`)) {
      deleteProject(id);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <span>前置工作</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            管理、流转并归口所有的采购物料需求。支持按所属船舶、各流转流程进行精细过滤。
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-3xs cursor-pointer self-start md:self-center"
        >
          <Plus size={14} />
          <span>新建前置需求</span>
        </button>
      </div>

      {/* Advanced Filter Control Box */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
        
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none placeholder-slate-400 text-slate-800"
              placeholder="搜索项目编号, 项目名称, 关联合同, 备注, 标签内容或物料属性..."
            />
          </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1.5">
          
          {/* Ship filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">所属船舶</label>
            <select
              value={selectedShip}
              onChange={(e) => setSelectedShip(e.target.value)}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium"
            >
              <option value="all">🚢 所有船舶</option>
              {SHIPS.map(ship => (
                <option key={ship} value={ship}>{ship}</option>
              ))}
            </select>
          </div>

          {/* Workflow Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">业务进度环节</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium"
            >
              <option value="all">📁 所有节点</option>
              {preWorkflow.map(step => {
                const colorEmoji = step.color === 'yellow' ? '🟡' : step.color === 'green' ? '🟢' : step.color === 'blue' ? '🔵' : step.color === 'red' ? '🔴' : '⚪';
                const hasEmoji = /^[^\w\s\u4e00-\u9fa5]{1,2}\s/.test(step.name);
                const displayName = hasEmoji ? step.name : `${colorEmoji} ${step.name}`;
                return (
                  <option key={step.id} value={step.name}>{displayName}</option>
                );
              })}
            </select>
          </div>

          {/* Color status filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">行动紧急色组（状态色）</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium"
            >
              <option value="all">🎨 所有色组状态</option>
              <option value="yellow">🟡 黄色 - 需要我操作</option>
              <option value="green">🟢 绿色 - 等待他人处理</option>
              <option value="blue">🔵 蓝色 - 流程已完成</option>
              <option value="red">🔴 红色 - 异常/作废/退回</option>
            </select>
          </div>

          {/* Urgent state filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">红牌标记 (紧急程度)</label>
            <div className="flex items-center space-x-2 h-[30px] px-2.5 border border-slate-200 rounded-md bg-slate-50/50">
              <input
                type="checkbox"
                id="urgent-filter"
                checked={filterUrgent === true}
                onChange={(e) => setFilterUrgent(e.target.checked ? true : 'all')}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
              />
              <label htmlFor="urgent-filter" className="text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                仅查看 🔴 紧急需求
              </label>
            </div>
          </div>

        </div>

      </div>

      {/* Main projects lists */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>符合上述过滤条件的前置需求数: <span className="font-bold text-slate-700 font-mono">{sortedProjects.length}</span> 项</span>
          <span>(点击任意项目行可一键进行信息维护与合同绑定)</span>
        </div>

        {sortedProjects.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-xl p-12 text-center text-slate-400 text-sm">
            没有找到能对应过滤规则的需求项目。可以尝试更换关键词或在右上角点击“新建需求”。
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {sortedProjects.map(project => {
              const statusColor = getProjectStatusColor(project.status);
              const overdue = project.dueDate && isOverdue(project.dueDate);
              const { hasPrev, hasNext } = canMove(project);
              
              // Find linked contract
              const assocContract = project.contractId ? contracts.find(c => c.id === project.contractId) : null;

              return (
                <div
                  key={project.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-5 py-4 shadow-3xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  
                  {/* Left Column: Interactive Metadata and Tags Line */}
                  <div 
                    onClick={() => setSelectedItemId(project.id)}
                    className="flex-1 space-y-3 cursor-pointer group"
                  >
                    {/* Identification labels */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md">
                        {project.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </h3>
                      {assocContract && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-100 font-mono">
                          🔗 关联【{assocContract.name}】
                        </span>
                      )}
                    </div>

                    {/* PRD Prescribed Horizontal tags display layout:
                        [鸿鹄01] [🟡制作比价表] [🔴紧急] [上海XX公司] [￥38600] [⏰6/25]
                     */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      
                      {/* 1. Ship tag */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                        🚢 {project.ship}
                      </span>

                      {/* 2. Status with localized color bulb */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold leading-normal border ${
                        statusColor === 'yellow' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        statusColor === 'green' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        statusColor === 'blue' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        <span className="mr-1">
                          {statusColor === 'yellow' ? '🟡' :
                           statusColor === 'green' ? '🟢' :
                           statusColor === 'blue' ? '🔵' : '🔴'}
                        </span>
                        {project.status}
                      </span>

                      {/* 3. Urgency alert tag */}
                      {project.isUrgent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          🔴 紧急
                        </span>
                      )}

                      {/* 4. Due Date Alert tag /⏰ tag */}
                      {overdue ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          ⚠ 已超期 ({project.dueDate})
                        </span>
                      ) : project.dueDate ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                          {formatChineseDate(project.dueDate)}
                        </span>
                      ) : null}

                      {/* 5. Custom tags */}
                      {Array.from(new Set(project.tags)).map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50/50 text-blue-600 border border-blue-100">
                          {tag}
                        </span>
                      ))}

                    </div>

                    {/* Brief Note preview if any */}
                    {project.remark && (
                      <p className="text-xs text-slate-400 line-clamp-1 italic max-w-2xl pl-1">
                        备注: {project.remark}
                      </p>
                    )}

                  </div>

                  {/* Right Column: Directional Progression controls and Discard */}
                  <div className="flex flex-row items-center space-x-3 self-end md:self-auto flex-shrink-0">
                    
                    {/* Previous step arrow */}
                    <button
                      type="button"
                      disabled={!hasPrev}
                      onClick={() => moveProjectStep(project.id, 'prev')}
                      title="流转到上一步"
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                        hasPrev
                          ? 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:shadow-2xs active:bg-slate-100'
                          : 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                      }`}
                    >
                      <ArrowLeft size={13} />
                      <span className="hidden sm:inline">上一步</span>
                    </button>

                    {/* Next step arrow */}
                    <button
                      type="button"
                      disabled={!hasNext}
                      onClick={() => moveProjectStep(project.id, 'next')}
                      title="递进到下一步"
                      className={`p-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                        hasNext
                          ? 'border-blue-200 text-blue-750 bg-blue-50/70 hover:bg-blue-50 hover:shadow-2xs active:bg-blue-100'
                          : 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                      }`}
                    >
                      <span className="hidden sm:inline">下一步</span>
                      <ArrowRight size={13} />
                    </button>

                    <span className="h-6 w-[1px] bg-slate-200 hidden sm:inline" />

                    {/* Edit pen */}
                    <button
                      type="button"
                      onClick={() => setSelectedItemId(project.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="项目详情与编辑"
                    >
                      <Edit2 size={13} />
                    </button>

                    {/* Trashcan */}
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id, project.name)}
                      className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                      title="删除需求"
                    >
                      <Trash2 size={13} />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-100 animate-slide-in text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <span>➕ 新建前置需求项目</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  项目编号 (必填)
                </label>
                <input
                  type="text"
                  required
                  value={newProjectCode}
                  onChange={(e) => setNewProjectCode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                  placeholder="项目编号 (例如: A004)"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  项目名称 (必填)
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                  placeholder="项目名称 (例如: 备用发电机耗材采购)"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  所属船舶 (仅限单选)
                </label>
                <select
                  value={newProjectShip}
                  onChange={(e) => setNewProjectShip(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white font-medium text-slate-700"
                >
                  {SHIPS.map(ship => (
                    <option key={ship} value={ship}>{ship}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-md text-[11px] text-slate-400 leading-relaxed font-sans mt-2">
                <strong>💡 智能默认配置：</strong>
                <p className="mt-1">
                  该前置项目创建后，自动处于<b>【{preWorkflow[0]?.name || '需求单'}】</b>阶段。
                  同时为你本地建立了文件夹路径：<span className="font-mono">D:\采购\前置工作\{newProjectCode || '编号'}{newProjectName || '名称'}</span>，其余属性后续皆可自由更改。
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-3xs transition-all"
                >
                  立即加入工作台
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Item Details slide-over dialog callback */}
      {selectedItemId && (
        <ItemDetailsModal
          itemId={selectedItemId}
          type="project"
          onClose={() => setSelectedItemId(null)}
        />
      )}

    </div>
  );
};
