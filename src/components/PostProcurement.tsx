import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { Contract, SHIPS } from '../types';
import { ItemDetailsModal } from './ItemDetailsModal';
import { isOverdue, formatChineseDate } from '../data';
import { Search, Plus, ArrowLeft, ArrowRight, Trash2, Edit2, FileText, CheckCircle, Clock, Link, AlertTriangle, Layers, X, FolderMinus, Tag } from 'lucide-react';

export const PostProcurement: React.FC = () => {
  const {
    projects,
    contracts,
    postWorkflow,
    addContract,
    updateContract,
    deleteContract,
    moveContractStep,
    batchAssociateProjects,
    recommendedTags,
    deleteRecommendedTag,
    addGlobalTag
  } = useAppState();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeShipTab, setActiveShipTab] = useState<string>('all'); // 'all', 'multi', or specific ship
  const [multiShipSettlementFilter, setMultiShipSettlementFilter] = useState<string>('all'); // 'all' or specific ship
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [filterUrgent, setFilterUrgent] = useState<boolean | 'all'>('all');

  // Detail Modal States
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Contract Creation Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContractName, setNewContractName] = useState('');
  const [newContractShip, setNewContractShip] = useState('鸿鹄01');
  const [newContractCode, setNewContractCode] = useState('');
  const [newContractDueDate, setNewContractDueDate] = useState('');
  const [newContractStatus, setNewContractStatus] = useState('');
  const [newContractTags, setNewContractTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [newContractBriefRemark, setNewContractBriefRemark] = useState('');
  const [selectedProjectIdsToLink, setSelectedProjectIdsToLink] = useState<string[]>([]);

  // Resolver for status color
  const getContractStatusColor = (statusName: string) => {
    const step = postWorkflow.find(s => s.name === statusName);
    return step ? step.color : 'green';
  };

  // Check step transitions boundaries
  const canMove = (contract: Contract) => {
    const currentIndex = postWorkflow.findIndex(s => s.name === contract.status);
    return {
      hasPrev: currentIndex > 0,
      hasNext: currentIndex < postWorkflow.length - 1
    };
  };

  // Find candidate demand projects of target ships that are NOT yet linked to any contract
  const getUnassignedProjectsOfShip = (shipNameString: string) => {
    const list = shipNameString.split(',').map(s => s.trim()).filter(Boolean);
    return projects.filter(p => list.includes(p.ship) && !p.contractId);
  };

  const handleShipToggleInForm = (s: string) => {
    const list = newContractShip.split(',').map(item => item.trim()).filter(Boolean);
    let newList: string[];
    if (list.includes(s)) {
      newList = list.filter(item => item !== s);
    } else {
      newList = [...list, s];
    }
    const sortedList = SHIPS.filter(item => newList.includes(item));
    const finalString = sortedList.join(', ') || SHIPS[0];
    setNewContractShip(finalString);
    setSelectedProjectIdsToLink([]); // reset checked associations
  };

  const handleAddContractTag = (tagText: string) => {
    const trimmed = tagText.trim();
    if (trimmed && !newContractTags.includes(trimmed)) {
      setNewContractTags(prev => [...prev, trimmed]);
      addGlobalTag(trimmed);
    }
    setNewTagInput('');
    setShowTagOptions(false);
  };

  const handleRemoveContractTag = (tagToRemove: string) => {
    setNewContractTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractName.trim()) {
      alert('请输入合同名称');
      return;
    }

    const isDuplicate = contracts.some(c => c.name.trim().toLowerCase() === newContractName.trim().toLowerCase());
    if (isDuplicate) {
      const proceed = window.confirm(`⚠️ 该合同名称【${newContractName.trim()}】已存在！\n是否确认继续新建重复名称的合同？`);
      if (!proceed) {
        return;
      }
    }

    const cleanCode = newContractCode.trim() || newContractName.trim();

    addContract({
      name: newContractName.trim(),
      code: cleanCode,
      ship: newContractShip,
      dueDate: newContractDueDate || undefined,
      status: newContractStatus || undefined,
      tags: newContractTags,
      remark: newContractBriefRemark.trim(),
    });

    // Since addContract writes asynchronously, let's wait next tick or simply bind projects to newly created contract.
    // To associate linked projects, we can match the newly created contract by its code/name,
    // or batch associate with code.
    // Let's do a smart delay/batch lookup
    setTimeout(() => {
      const savedContracts = JSON.parse(localStorage.getItem('p_workbench_contracts') || '[]');
      const newestContract = savedContracts.find((c: any) => c.name === newContractName.trim() && c.ship === newContractShip);
      if (newestContract && selectedProjectIdsToLink.length > 0) {
        batchAssociateProjects(newestContract.id, selectedProjectIdsToLink);
      }
    }, 100);

    // Reset Form
    setNewContractName('');
    setNewContractCode('');
    setNewContractDueDate('');
    setNewContractStatus('');
    setNewContractTags([]);
    setNewTagInput('');
    setShowTagOptions(false);
    setNewContractBriefRemark('');
    setSelectedProjectIdsToLink([]);
    setShowCreateModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`确认删除后置合同【${name}】吗？\n\n此操作会自动断开与该合同绑定的需求项目的关联关系。此操作仅在系统内删除该合同履约流转记录，不会删除您电脑本地的任何实际对应文件或合同文件夹。`)) {
      deleteContract(id);
    }
  };

  // Filter logic
  const filteredContracts = contracts.filter(contract => {
    // 1. Ship category tab matching
    const associatedShips = contract.ship.split(',').map(s => s.trim()).filter(Boolean);
    const isMultiShipContract = associatedShips.length >= 2;

    let matchesShipTab = false;
    if (activeShipTab === 'all') {
      matchesShipTab = true;
    } else if (activeShipTab === 'multi') {
      matchesShipTab = isMultiShipContract;
    } else {
      // Single ship tab (e.g. '鸿鹄01')
      // Must not be a multi-ship contract, and must match the selected ship
      matchesShipTab = !isMultiShipContract && associatedShips.includes(activeShipTab);
    }

    // 2. Text Search - also search within settlement details (multi-batch independent settlement details)
    const searchLower = searchTerm.toLowerCase().trim();
    const associatedProjects = projects.filter(p => p.contractId === contract.id);
    const associatedProjectsTags = associatedProjects.map(p => p.name.toLowerCase() + ' ' + p.code.toLowerCase()).join(' ');
    
    // Index multi-batch settlement details
    const settlementDetails = contract.isMultiSettlement && contract.settlements
      ? contract.settlements.map(s => `${s.name} ${s.status} ${s.remark || ''} ${s.ship || ''}`).join(' ').toLowerCase()
      : '';

    const matchesSearch = !searchLower ||
      contract.name.toLowerCase().includes(searchLower) ||
      contract.code.toLowerCase().includes(searchLower) ||
      contract.remark.toLowerCase().includes(searchLower) ||
      associatedProjectsTags.includes(searchLower) ||
      contract.tags.some(t => t.toLowerCase().includes(searchLower)) ||
      settlementDetails.includes(searchLower);

    // 3. Status filter
    const matchesStatus = selectedStatus === 'all' || 
      (contract.isMultiSettlement
        ? (contract.settlements?.some(s => {
            const matchesMultiShipFilter = activeShipTab !== 'multi' || multiShipSettlementFilter === 'all' || s.ship === multiShipSettlementFilter;
            return matchesMultiShipFilter && s.status === selectedStatus;
          }) || false)
        : contract.status === selectedStatus);

    // 4. Color indicator filter
    const matchesColor = selectedColor === 'all' || 
      (contract.isMultiSettlement
        ? (contract.settlements?.some(s => {
            const matchesMultiShipFilter = activeShipTab !== 'multi' || multiShipSettlementFilter === 'all' || s.ship === multiShipSettlementFilter;
            return matchesMultiShipFilter && getContractStatusColor(s.status) === selectedColor;
          }) || false)
        : getContractStatusColor(contract.status) === selectedColor);

    // 5. Urgency checkbox
    const matchesUrgent = filterUrgent === 'all' || contract.isUrgent === filterUrgent;

    return matchesShipTab && matchesSearch && matchesStatus && matchesColor && matchesUrgent;
  });

  // Sort contracts by latest updated/created time first
  const sortedContracts = [...filteredContracts].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <span>后置工作</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            对起草会签完毕的合同进行到货接收、结算及付款周期跟踪。项目依<b>所属船舶</b>独立划分管理。
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setSelectedProjectIdsToLink([]);
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-style shadow-3xs cursor-pointer self-start md:self-center"
        >
          <Plus size={14} />
          <span>新建后置合同</span>
        </button>
      </div>

      {/* Categories by Ship selection (horizontal tab group) */}
      <div className="bg-slate-100/80 p-1 rounded-md flex flex-wrap gap-1 border border-slate-200/50">
        <button
          onClick={() => {
            setActiveShipTab('all');
            setMultiShipSettlementFilter('all');
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeShipTab === 'all'
              ? 'bg-white text-blue-600 shadow-3xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40'
          }`}
        >
          🚢 全部合同 ({contracts.length})
        </button>
        <button
          onClick={() => {
            setActiveShipTab('multi');
            setMultiShipSettlementFilter('all');
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeShipTab === 'multi'
              ? 'bg-white text-blue-600 shadow-3xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40'
          }`}
        >
          ⛓️ 多船舶 ({contracts.filter(c => c.ship.split(',').map(s => s.trim()).filter(Boolean).length >= 2).length})
        </button>
        {SHIPS.map(ship => {
          const shipContractsCount = contracts.filter(c => {
            const associated = c.ship.split(',').map(s => s.trim()).filter(Boolean);
            return associated.length === 1 && associated[0] === ship;
          }).length;
          return (
            <button
              key={ship}
              onClick={() => setActiveShipTab(ship)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeShipTab === ship
                  ? 'bg-white text-blue-600 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40'
              }`}
            >
              {ship} ({shipContractsCount})
            </button>
          );
        })}
      </div>

      {/* Filter Box */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
        
        {/* Text Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none placeholder-slate-400 text-slate-800"
            placeholder="搜索合同编码、名称、备注说明、关联前置项目（A001）或标签..."
          />
        </div>

        {/* Multi Criteria Selector */}
        <div className={`grid grid-cols-1 ${activeShipTab === 'multi' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4 pt-1`}>
          
          {/* Status Step filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">业务节点阶段</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium"
            >
              <option value="all">📁 所有节点</option>
              {postWorkflow.map(step => {
                const colorEmoji = step.color === 'yellow' ? '🟡' : step.color === 'green' ? '🟢' : step.color === 'blue' ? '🔵' : step.color === 'red' ? '🔴' : '⚪';
                const hasEmoji = /^[^\w\s\u4e00-\u9fa5]{1,2}\s/.test(step.name);
                const displayName = hasEmoji ? step.name : `${colorEmoji} ${step.name}`;
                return (
                  <option key={step.id} value={step.name}>{displayName}</option>
                );
              })}
            </select>
          </div>

          {/* Color State filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">要求色卡状态</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium"
            >
              <option value="all">🎨 所有色度状态</option>
              <option value="yellow">🟡 黄色 - 需要我操作</option>
              <option value="green">🟢 绿色 - 等待他人处理</option>
              <option value="blue">🔵 蓝色 - 主合同已完成归档</option>
              <option value="red">🔴 红色 - 发生异常/作废</option>
            </select>
          </div>

          {/* Urgent state checkbox */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">紧急合同标识</label>
            <div className="flex items-center space-x-2 h-[30px] px-2.5 border border-slate-200 rounded-md bg-slate-50/50">
              <input
                type="checkbox"
                id="contract-urgent-filter"
                checked={filterUrgent === true}
                onChange={(e) => setFilterUrgent(e.target.checked ? true : 'all')}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
              />
              <label htmlFor="contract-urgent-filter" className="text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                仅查看 🔴 紧急结算合同
              </label>
            </div>
          </div>

          {/* Multi Ship Settlement Filter */}
          {activeShipTab === 'multi' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">结算所属船舶 (多船筛选)</label>
              <select
                value={multiShipSettlementFilter}
                onChange={(e) => setMultiShipSettlementFilter(e.target.value)}
                className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-bold border-blue-250 ring-1 ring-blue-50/50"
              >
                <option value="all">⚓ 所有结算期次</option>
                {SHIPS.map(ship => (
                  <option key={ship} value={ship}>{ship} 关联期次</option>
                ))}
              </select>
            </div>
          )}

        </div>

      </div>

      {/* Contracts Render list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>列表匹配到的合同数: <span className="font-bold text-slate-700 font-mono">{sortedContracts.length}</span> 项</span>
          <span>(点击任意合同行查看关联项目，支持一键下一步快捷操作)</span>
        </div>

        {sortedContracts.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-xl p-12 text-center text-slate-400 text-sm">
            没有查找到指定筛选条件下的后置合同项目。可在上面切换其他所属船舶，或新增合同。
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {sortedContracts.map(contract => {
              const statusColor = getContractStatusColor(contract.status);
              const overdue = contract.dueDate && isOverdue(contract.dueDate);
              const { hasPrev, hasNext } = canMove(contract);

              // Resolve demand projects linked to this contract
              const assignedDemandProjects = projects.filter(p => p.contractId === contract.id);

              return (
                <div
                  key={contract.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-5 py-4 shadow-3xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  
                  {/* Left block information */}
                  <div
                    onClick={() => setSelectedItemId(contract.id)}
                    className="flex-1 space-y-3 cursor-pointer group w-full"
                  >
                    
                    {/* Header bar and indicators */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-md">
                        {contract.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {contract.name}
                      </h3>
                      {assignedDemandProjects.length > 0 && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold border border-slate-200/60 px-1.5 py-0.2 rounded-sm">
                          💼 包含 {assignedDemandProjects.length} 笔前置需求
                        </span>
                      )}

                      {/* Overall independent contractStatus badge */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        (contract.contractStatus || '执行中') === '已完成'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : (contract.contractStatus || '执行中') === '已终止'
                          ? 'bg-rose-100 text-rose-850 border-rose-250'
                          : 'bg-amber-100 text-amber-800 border-amber-250'
                      }`}>
                        {contract.contractStatus === '已完成' ? '🔵' : (contract.contractStatus === '已终止' ? '🔴' : '🟡')} {contract.contractStatus || '执行中'}
                      </span>
                    </div>

                    {/* PRD Prescribed Horizontal tags display layout:
                        [外加分类] [流程段] etc
                     */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      
                      {/* Ship Classification */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/50">
                        🚢 {contract.ship}
                      </span>

                      {/* Configurable Status steps colored Tag (Only for single settlement) */}
                      {!contract.isMultiSettlement ? (
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
                          {contract.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-3xs">
                          🔄 多批结算 ({contract.settlements?.length || 0} 期次)
                        </span>
                      )}

                      {/* Red indicator for priority tag */}
                      {contract.isUrgent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          🔴 紧急
                        </span>
                      )}

                      {/* Overdue Alerts on Contract settlement bounds */}
                      {overdue ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-250">
                          ⚠ 已超期 ({contract.dueDate})
                        </span>
                      ) : contract.dueDate ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                          {formatChineseDate(contract.dueDate)}
                        </span>
                      ) : null}

                      {/* Custom Tags */}
                      {Array.from(new Set(contract.tags)).map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {tag}
                        </span>
                      ))}

                    </div>

                    {/* Associated Demand projects list in badges line */}
                    {assignedDemandProjects.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-1.5 pt-1 border-l-2 border-slate-100">
                        <span className="text-[10.5px] text-slate-400 font-semibold mb-0.5">归属前置需求：</span>
                        {assignedDemandProjects.map(p => (
                          <span
                            key={p.id}
                            className="inline-flex items-center bg-slate-50 border border-slate-200 text-slate-500 font-mono text-[10px] px-1.5 py-0.2 rounded hover:text-blue-600 hover:border-blue-200 transition-colors"
                            title="查看需求原案"
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid opening contract
                              setSelectedItemId(p.id);
                            }}
                          >
                            {p.code} {p.name} 🔗
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Brief Note preview if any */}
                    {contract.remark && (
                      <p className="text-xs text-slate-400 line-clamp-1 italic max-w-2xl pl-1">
                        备注: {contract.remark}
                      </p>
                    )}

                    {/* Dynamic expansion of settlements inside the card */}
                    {contract.isMultiSettlement && contract.settlements && contract.settlements.length > 0 && (() => {
                      const contractShips = contract.ship.split(',').map(name => name.trim()).filter(Boolean);
                      const displayedSettlements = contract.settlements.filter(s => {
                        if (activeShipTab === 'multi' && multiShipSettlementFilter !== 'all') {
                          return s.ship === multiShipSettlementFilter;
                        }
                        return true;
                      });

                      return (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 w-full" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span>📊 结算批次列表 (直接流转各期进度)</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newNum = contract.settlements!.length + 1;
                                const nextBatch = {
                                  id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                                  name: `第${newNum}期结算`,
                                  status: '签收单',
                                  remark: '',
                                  ship: contractShips.length === 1 ? contractShips[0] : ''
                                };
                                updateContract(contract.id, {
                                  settlements: [...contract.settlements!, nextBatch]
                                });
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center"
                            >
                              + 新增期次
                            </button>
                          </div>

                          {displayedSettlements.length === 0 ? (
                            <div className="text-[11px] text-slate-400 italic p-3 text-center bg-slate-50 border border-slate-200/50 rounded-lg">
                              ⚠️ 暂无符合当前筛选船舶【{multiShipSettlementFilter}】的结算期次
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {displayedSettlements.map((s) => {
                                const bCol = getContractStatusColor(s.status);
                                return (
                                  <div key={s.id} className="bg-slate-50 border border-slate-250 hover:bg-slate-100/50 rounded-lg p-2 flex items-center justify-between transition-colors">
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                        <span className="text-xs font-bold text-slate-700">{s.name}</span>
                                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                          bCol === 'yellow' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                          bCol === 'green' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                          bCol === 'blue' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                          'bg-red-50 text-red-800 border-red-200'
                                        }`}>
                                          {s.status}
                                        </span>
                                        {/* Inline ship selector for multi-ship contract */}
                                        {contractShips.length >= 2 && (
                                          <select
                                            value={s.ship || ''}
                                            onChange={(e) => {
                                              const updated = contract.settlements!.map(item => item.id === s.id ? { ...item, ship: e.target.value } : item);
                                              updateContract(contract.id, { settlements: updated });
                                            }}
                                            className="text-[10px] font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.2 text-slate-600 focus:outline-none"
                                          >
                                            <option value="">⚓ 指定船舶</option>
                                            {contractShips.map(sh => (
                                              <option key={sh} value={sh}>{sh}</option>
                                            ))}
                                          </select>
                                        )}
                                        {/* Tag for ship name if already specified and not in multiselect */}
                                        {contractShips.length < 2 && s.ship && (
                                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1 rounded">
                                            {s.ship}
                                          </span>
                                        )}
                                      </div>
                                      {s.remark && <p className="text-[10px] text-slate-400 italic line-clamp-1">{s.remark}</p>}
                                    </div>

                                    <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                      <button
                                        title="退回上一步"
                                        disabled={postWorkflow.findIndex(step => step.name === s.status) <= 0}
                                        onClick={() => {
                                          const sIdx = postWorkflow.findIndex(step => step.name === s.status);
                                          if (sIdx > 0) {
                                            const updated = contract.settlements!.map(item => item.id === s.id ? { ...item, status: postWorkflow[sIdx - 1].name } : item);
                                            updateContract(contract.id, { settlements: updated });
                                          }
                                        }}
                                        className="p-1 hover:bg-slate-200 border border-slate-200 rounded text-slate-500 disabled:opacity-40"
                                      >
                                        <ArrowLeft size={10} />
                                      </button>
                                      <button
                                        title="流转下一步"
                                        disabled={postWorkflow.findIndex(step => step.name === s.status) >= postWorkflow.length - 1}
                                        onClick={() => {
                                          const sIdx = postWorkflow.findIndex(step => step.name === s.status);
                                          if (sIdx < postWorkflow.length - 1) {
                                            const updated = contract.settlements!.map(item => item.id === s.id ? { ...item, status: postWorkflow[sIdx + 1].name } : item);
                                            updateContract(contract.id, { settlements: updated });
                                          }
                                        }}
                                        className="p-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-600 disabled:opacity-40"
                                      >
                                        <ArrowRight size={10} />
                                      </button>
                                      <button
                                        title="删除期次"
                                        onClick={() => {
                                          if (window.confirm(`确认删除该笔期次：${s.name} 吗？`)) {
                                            const updated = contract.settlements!.filter(item => item.id !== s.id);
                                            updateContract(contract.id, { settlements: updated });
                                          }
                                        }}
                                        className="p-1 hover:bg-red-50 text-rose-500 rounded"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>

                  {/* Right block: inline step change */}
                  <div className="flex flex-row items-center space-x-3 self-end md:self-auto flex-shrink-0">
                    
                    {!contract.isMultiSettlement ? (
                      <>
                        {/* Previous step arrow */}
                        <button
                          type="button"
                          disabled={!hasPrev}
                          onClick={() => moveContractStep(contract.id, 'prev')}
                          title="合同退回上一步"
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
                          onClick={() => moveContractStep(contract.id, 'next')}
                          title="流转到下一步骤"
                          className={`p-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                            hasNext
                              ? 'border-blue-200 text-blue-700 bg-blue-50/70 hover:bg-blue-50 hover:shadow-2xs active:bg-blue-100'
                              : 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                          }`}
                        >
                          <span className="hidden sm:inline">下一步</span>
                          <ArrowRight size={13} />
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold bg-slate-100 px-2 py-1 rounded shadow-3xs">
                        ⚡ 多分批流转
                      </span>
                    )}

                    <span className="h-6 w-[1px] bg-slate-200 hidden sm:inline" />

                    {/* Edit icon */}
                    <button
                      type="button"
                      onClick={() => setSelectedItemId(contract.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="打开合同详情编辑面板"
                    >
                      <Edit2 size={13} />
                    </button>

                    {/* Trashcan icon */}
                    <button
                      type="button"
                      onClick={() => handleDelete(contract.id, contract.name)}
                      className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                      title="解绑并删除合同"
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

      {/* Contract Creation Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg border border-slate-100 animate-slide-in text-slate-800 flex flex-col max-h-[85vh]">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <span>➕ 新建后置合同及需求合并</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-4 overflow-y-auto pr-1 flex-1 pb-2">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    合同编码 / 项目编号 (必填)
                  </label>
                  <input
                    type="text"
                    required
                    value={newContractCode}
                    onChange={(e) => setNewContractCode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                    placeholder="如: HH01-2026-020"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    合同名称 (必填)
                  </label>
                  <input
                    type="text"
                    required
                    value={newContractName}
                    onChange={(e) => setNewContractName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                    placeholder="如: HH01-2026-020机电阀门采购合同"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                    <span>所属船舶 (可多选)</span>
                    <span className="text-[9px] text-blue-500 font-bold lowercase tracking-normal">已选: {newContractShip.split(',').map(item => item.trim()).filter(Boolean).length}艘</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-1.5 border border-slate-200 bg-slate-50/50 rounded-md max-h-24 overflow-y-auto">
                    {SHIPS.map(ship => {
                      const isChecked = newContractShip.split(',').map(item => item.trim()).includes(ship);
                      return (
                        <label 
                          key={ship}
                          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                            isChecked 
                              ? 'bg-blue-50/80 border-blue-200 text-blue-700 shadow-3xs' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleShipToggleInForm(ship)}
                            className="h-3 w-3 rounded text-blue-600 focus:ring-blue-500 border-slate-350 cursor-pointer"
                          />
                          <span>{ship}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    要求截止日期 (可选)
                  </label>
                  <input
                    type="date"
                    value={newContractDueDate}
                    onChange={(e) => setNewContractDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  合并关口：挑选该船舶上未关联的前置项目 (可选)
                </label>
                {getUnassignedProjectsOfShip(newContractShip).length === 0 ? (
                  <div className="text-[11px] bg-slate-50 border border-slate-100 p-3 rounded-lg text-slate-400 leading-normal">
                    🚢 该船上目前没有「未关联」其它合同的需求项目。
                    （您创建完毕后，可在日后进入项目详情里进行合同重置/绑定。）
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1.5">
                    {getUnassignedProjectsOfShip(newContractShip).map(proj => (
                      <label
                        key={proj.id}
                        className="flex items-center space-x-2 p-2 hover:bg-white rounded-md border border-transparent hover:border-slate-100 transition-all text-xs font-medium text-slate-700 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProjectIdsToLink.includes(proj.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjectIdsToLink(prev => [...prev, proj.id]);
                            } else {
                              setSelectedProjectIdsToLink(prev => prev.filter(id => id !== proj.id));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="font-mono bg-amber-50 text-amber-800 border border-amber-100 px-1 py-0.5 rounded text-[10px]">{proj.code}</span>
                        <span className="flex-1">{proj.name} ({proj.status})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-440 text-slate-400 uppercase tracking-widest mb-1">
                  选择合同状态 (默认为流转第一步)
                </label>
                <select
                  value={newContractStatus}
                  onChange={(e) => setNewContractStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="">-- 系统默认第一阶段 ({postWorkflow[0]?.name || '合同签订'}) --</option>
                  {postWorkflow.map(step => (
                    <option key={step.name} value={step.name}>{step.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  自定义标签 (回车快速创建)
                </label>
                <div className="relative">
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[38px] items-center mb-1.5 focus-within:bg-white focus-within:border-blue-500 transition-all">
                    {newContractTags.map(tag => (
                      <span key={tag} className="inline-flex items-center bg-blue-50 hover:bg-blue-150 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px] transition-colors border border-blue-100/60 font-sans">
                        <span>{tag}</span>
                        <button type="button" onClick={() => handleRemoveContractTag(tag)} className="ml-1 hover:text-red-500 font-bold font-mono text-[10px] cursor-pointer">&times;</button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => {
                        setNewTagInput(e.target.value);
                        setShowTagOptions(true);
                      }}
                      onFocus={() => setShowTagOptions(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newTagInput.trim()) {
                            handleAddContractTag(newTagInput.trim());
                          }
                        }
                      }}
                      placeholder={newContractTags.length === 0 ? "回车确认生成当前标签..." : "+ 添加..."}
                      className="flex-1 bg-transparent border-none text-xs focus:outline-none min-w-[120px]"
                    />
                  </div>

                  {/* Quick-select Recommended Tags */}
                  {recommendedTags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1 items-center pb-1">
                      <span className="text-[10px] text-slate-400 mr-1">推荐点击直接打标:</span>
                      {recommendedTags.map(rt => {
                        const isSelected = newContractTags.includes(rt.name);
                        return (
                          <button
                            key={rt.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                handleRemoveContractTag(rt.name);
                              } else {
                                handleAddContractTag(rt.name);
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-extrabold'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            #{rt.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Autocomplete recommendation dropdown */}
                  {showTagOptions && recommendedTags.length > 0 && (
                    <div className="absolute left-0 bottom-full mb-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-50 text-xs py-1">
                      <div className="px-2 py-1 text-slate-400 border-b border-slate-100 pb-1 font-semibold text-[9px] uppercase tracking-wider flex items-center justify-between">
                        <span>推荐标签</span>
                        <span className="text-[9px] text-slate-350 font-normal normal-case">悬停可删除</span>
                      </div>
                      {recommendedTags
                        .filter(rt => !newContractTags.includes(rt.name) && rt.name.toLowerCase().includes(newTagInput.toLowerCase()))
                        .map(rt => (
                          <div
                            key={rt.id}
                            className="w-full px-2.5 py-1 hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-between cursor-pointer group/rt"
                          >
                            <button
                              type="button"
                              onClick={() => handleAddContractTag(rt.name)}
                              className="flex-1 text-left py-1 text-slate-700 font-semibold cursor-pointer"
                            >
                              #{rt.name}
                            </button>
                            <div className="flex items-center space-x-2">
                              <span className="text-[9px] text-blue-500 bg-blue-50 px-1 py-0.2 rounded font-sans font-bold group-hover/rt:hidden">选择</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`确定要彻底删除推荐标签“${rt.name}”吗？\n(此操作仅移除推荐状态，已打标的现有合同不会受影响)`)) {
                                    deleteRecommendedTag(rt.id);
                                  }
                                }}
                                className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors opacity-0 group-hover/rt:opacity-100"
                                title="删除推荐标签"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      <div className="p-1.5 text-center border-t border-slate-100 mt-1 flex justify-between px-2 shrink-0">
                        <span className="text-[9px] text-slate-400 mt-0.5">支持回车生成任意标签</span>
                        <button
                          type="button"
                          onClick={() => setShowTagOptions(false)}
                          className="text-[10px] text-blue-500 hover:text-blue-700 font-bold cursor-pointer"
                        >
                          收起
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  合同基本备注
                </label>
                <textarea
                  rows={2}
                  value={newContractBriefRemark}
                  onChange={(e) => setNewContractBriefRemark(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-105 focus:border-blue-500 focus:outline-none font-sans"
                  placeholder="填写合同供货方名称、货款结算条件或其它相关说明..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0">
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
                  确认建立后置合同
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Item Details slide-over panel */}
      {selectedItemId && (
        <ItemDetailsModal
          itemId={selectedItemId}
          type="contract"
          onClose={() => setSelectedItemId(null)}
        />
      )}

    </div>
  );
};
