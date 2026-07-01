import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { Contract, SHIPS } from '../types';
import { ItemDetailsModal } from './ItemDetailsModal';
import { isOverdue, formatChineseDate } from '../data';
import { Search, Plus, ArrowLeft, ArrowRight, Trash2, Edit2, FileText, CheckCircle, Clock, Link, AlertTriangle, Layers, X, FolderMinus, Tag } from 'lucide-react';

interface PostProcurementProps {
  contractType?: 'purchase' | 'service';
}

export const PostProcurement: React.FC<PostProcurementProps> = ({ contractType = 'purchase' }) => {
  const {
    projects,
    contracts,
    postWorkflow,
    postServiceWorkflow,
    addContract,
    updateContract,
    deleteContract,
    moveContractStep,
    batchAssociateProjects,
    recommendedTags,
    deleteRecommendedTag,
    addGlobalTag,
    suppliers,
    supplierCategories,
    addSupplier
  } = useAppState();

  const currentWorkflow = contractType === 'service' ? postServiceWorkflow : postWorkflow;

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
  const [newContractAmount, setNewContractAmount] = useState('');
  const [newContractSupplierId, setNewContractSupplierId] = useState('');
  const [showSupplierSelector, setShowSupplierSelector] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [supSearch, setSupSearch] = useState('');
  const [supFilterCat, setSupFilterCat] = useState('all');
  const [quickSupName, setQuickSupName] = useState('');
  const [quickSupCatId, setQuickSupCatId] = useState('');

  // Resolver for status color
  const getContractStatusColor = (statusName: string) => {
    const step = currentWorkflow.find(s => s.name === statusName);
    return step ? step.color : 'green';
  };

  // Check step transitions boundaries
  const canMove = (contract: Contract) => {
    const currentIndex = currentWorkflow.findIndex(s => s.name === contract.status);
    return {
      hasPrev: currentIndex > 0,
      hasNext: currentIndex < currentWorkflow.length - 1
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

  const handleSelectContractSupplier = (id: string) => {
    setNewContractSupplierId(id);
    setShowSupplierSelector(false);
  };

  const handleRemoveContractSupplier = () => {
    setNewContractSupplierId('');
  };

  const handleContractQuickAddAndSelect = () => {
    if (!quickSupName.trim()) {
      alert('请输入供应商/公司名称');
      return;
    }
    const trimmed = quickSupName.trim();
    const existing = suppliers.find(s => s.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      alert(`对应公司「${existing.name}」已存在，已直接为您选择该供应商。`);
      setNewContractSupplierId(existing.id);
      setShowQuickAdd(false);
      setQuickSupName('');
      setQuickSupCatId('');
      return;
    }
    const catId = quickSupCatId || supplierCategories[0]?.id || '';
    const newSup = addSupplier({
      name: trimmed,
      categoryId: catId,
      contact: '',
      phone: '',
      email: '',
      remark: '快速登记（自新建合同入口）',
      historyCount: 0
    });
    setNewContractSupplierId(newSup.id);
    setShowQuickAdd(false);
    setQuickSupName('');
    setQuickSupCatId('');
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractName.trim()) {
      alert('请输入合同名称');
      return;
    }

    const isDuplicate = contracts.some(c => {
      const cType = c.contractType || 'purchase';
      return cType === contractType && c.name.trim().toLowerCase() === newContractName.trim().toLowerCase();
    });
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
      amount: newContractAmount.trim() || undefined,
      supplierId: newContractSupplierId || undefined,
      contractType,
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
    setNewContractAmount('');
    setNewContractSupplierId('');
    setShowSupplierSelector(false);
    setShowQuickAdd(false);
    setSupSearch('');
    setSupFilterCat('all');
    setQuickSupName('');
    setQuickSupCatId('');
    setShowCreateModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    const typeLabel = contractType === 'service' ? '服务合同' : '采购合同';
    if (window.confirm(`确认删除后置${typeLabel}【${name}】吗？\n\n此操作会自动断开与该合同绑定的需求项目的关联关系。此操作仅在系统内删除该合同履约流转记录，不会删除您电脑本地的任何实际对应文件或合同文件夹。`)) {
      deleteContract(id);
    }
  };

  const typeContracts = contracts.filter(c => {
    const cType = c.contractType || 'purchase';
    return cType === contractType;
  });

  // Filter logic
  const filteredContracts = contracts.filter(contract => {
    // Filter by Contract Type
    const matchesContractType = contractType === 'service'
      ? contract.contractType === 'service'
      : (contract.contractType === 'purchase' || !contract.contractType);
    if (!matchesContractType) return false;

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
    const settlementDetails = contract.settlements && contract.settlements.length > 0
      ? contract.settlements.map(s => `${s.name} ${s.status} ${s.remark || ''} ${s.ship || ''} ${s.amount || ''}`).join(' ').toLowerCase()
      : '';

    // Find associated supplier name and contract amount
    const associatedSupplier = contract.supplierId ? suppliers.find(s => s.id === contract.supplierId) : null;
    const supplierNameLower = associatedSupplier ? associatedSupplier.name.toLowerCase() : '';
    const contractAmountLower = contract.amount ? contract.amount.toLowerCase() : '';

    const matchesSearch = !searchLower ||
      contract.name.toLowerCase().includes(searchLower) ||
      contract.code.toLowerCase().includes(searchLower) ||
      contract.remark.toLowerCase().includes(searchLower) ||
      associatedProjectsTags.includes(searchLower) ||
      contract.tags.some(t => t.toLowerCase().includes(searchLower)) ||
      settlementDetails.includes(searchLower) ||
      supplierNameLower.includes(searchLower) ||
      contractAmountLower.includes(searchLower);

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
            <span>后置工作 ({contractType === 'service' ? '服务合同' : '采购合同'})</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            对会签完毕的{contractType === 'service' ? '服务' : '采购'}合同进行到货接收、结算及付款周期跟踪。项目依<b>所属船舶</b>独立划分管理。
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
          <span>新建后置{contractType === 'service' ? '服务合同' : '采购合同'}</span>
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
          🚢 全部合同 ({typeContracts.length})
        </button>
        {SHIPS.map(ship => {
          const shipContractsCount = typeContracts.filter(c => {
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
          ⛓️ 多船舶 ({typeContracts.filter(c => c.ship.split(',').map(s => s.trim()).filter(Boolean).length >= 2).length})
        </button>
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
            placeholder="搜索合同编码、名称、金额、公司/供应商、备注说明、关联前置项目或标签..."
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
              {currentWorkflow.map(step => {
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
            没有查找到指定筛选条件下的后置${contractType === 'service' ? '服务' : '采购'}合同项目。可在上面切换其他所属船舶，或新增合同。
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {sortedContracts.map(contract => {
              const statusColor = getContractStatusColor(contract.status);
              const overdue = contract.dueDate && isOverdue(contract.dueDate);
              const { hasPrev, hasNext } = canMove(contract);

              // Resolve demand projects linked to this contract
              const assignedDemandProjects = projects.filter(p => p.contractId === contract.id);
              const contractSupplier = suppliers.find(s => s.id === contract.supplierId);

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

                      {/* Contract Amount */}
                      {contract.amount && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-3xs">
                          {contract.amount}
                        </span>
                      )}

                      {/* Bound Company */}
                      {contractSupplier && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-3xs">
                          {contractSupplier.name}
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
                                  ship: contractShips.length === 1 ? contractShips[0] : '',
                                  amount: ''
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
                                        {/* Batch Amount Tag */}
                                        {s.amount && (
                                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-3xs">
                                            💰 {s.amount}
                                          </span>
                                        )}
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
                                      
                                      <div className="flex items-center space-x-2 flex-wrap text-[10px] text-slate-400 mt-0.5">
                                        {s.dueDate && (
                                          <span className="bg-slate-100 text-slate-600 font-medium px-1 rounded">
                                            📅 {s.dueDate}
                                          </span>
                                        )}
                                        {s.remark && (
                                          <span className="italic line-clamp-1">
                                            💬 {s.remark}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                      <button
                                        title="退回上一步"
                                        disabled={currentWorkflow.findIndex(step => step.name === s.status) <= 0}
                                        onClick={() => {
                                          const sIdx = currentWorkflow.findIndex(step => step.name === s.status);
                                          if (sIdx > 0) {
                                            const updated = contract.settlements!.map(item => item.id === s.id ? { ...item, status: currentWorkflow[sIdx - 1].name } : item);
                                            updateContract(contract.id, { settlements: updated });
                                          }
                                        }}
                                        className="p-1 hover:bg-slate-200 border border-slate-200 rounded text-slate-500 disabled:opacity-40"
                                      >
                                        <ArrowLeft size={10} />
                                      </button>
                                      <button
                                        title="流转下一步"
                                        disabled={currentWorkflow.findIndex(step => step.name === s.status) >= currentWorkflow.length - 1}
                                        onClick={() => {
                                          const sIdx = currentWorkflow.findIndex(step => step.name === s.status);
                                          if (sIdx < currentWorkflow.length - 1) {
                                            const updated = contract.settlements!.map(item => item.id === s.id ? { ...item, status: currentWorkflow[sIdx + 1].name } : item);
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
                <span>➕ 新建后置${contractType === 'service' ? '服务' : '采购'}合同及需求合并</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    合同金额
                  </label>
                  <input
                    type="text"
                    value={newContractAmount}
                    onChange={(e) => setNewContractAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                    placeholder="如: 50,000元 或 $8,500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    选择合同状态 (默认为流转第一步)
                  </label>
                  <select
                    value={newContractStatus}
                    onChange={(e) => setNewContractStatus(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="">-- 系统默认第一阶段 ({currentWorkflow[0]?.name || '合同签订'}) --</option>
                    {currentWorkflow.map(step => (
                      <option key={step.name} value={step.name}>{step.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 对应公司 模块 */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <span>对应公司</span>
                  </label>
                  {newContractSupplierId && (
                    <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      已选择
                    </span>
                  )}
                </div>

                {/* 关联的对应公司展示 */}
                <div className="space-y-1.5">
                  {!newContractSupplierId ? (
                    <div className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-lg bg-white">
                      暂无选择对应公司。请在下方搜索选择或快速登记。
                    </div>
                  ) : (
                    (() => {
                      const sup = suppliers.find(s => s.id === newContractSupplierId);
                      if (!sup) {
                        return (
                          <div className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-lg bg-white">
                            选择的供应商已不存在，请重新选择。
                          </div>
                        );
                      }
                      const catName = supplierCategories.find(c => c.id === sup.categoryId)?.name || '未分类';
                      return (
                        <div className="flex items-center justify-between py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-bold text-slate-800 text-sm">
                              {sup.name}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 font-medium space-x-2">
                              <span>分类: {catName}</span>
                              {sup.contact && <span>| 联系人: {sup.contact}</span>}
                              {sup.phone && <span>| 电话: {sup.phone}</span>}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveContractSupplier}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                            title="解除选择"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* 选择与快捷新建 */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSupplierSelector(!showSupplierSelector);
                        setShowQuickAdd(false);
                      }}
                      className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all flex items-center justify-center space-x-1.5 ${
                        showSupplierSelector
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>🔍 选择对应公司</span>
                      <span className="bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-mono text-[9px]">{suppliers.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickAdd(!showQuickAdd);
                        setShowSupplierSelector(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                        showQuickAdd
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      ⚡ 快速登记
                    </button>
                  </div>

                  {/* 对应公司选择面板 */}
                  {showSupplierSelector && (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 shadow-2xs">
                      {/* Search Bar */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="搜索对应公司名称、分类、联系人..."
                          value={supSearch}
                          onChange={(e) => setSupSearch(e.target.value)}
                          className="w-full pl-7 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-semibold"
                        />
                        <Search className="absolute left-2.5 top-2.5 text-slate-400" size={12} />
                        {supSearch && (
                          <button
                            type="button"
                            onClick={() => setSupSearch('')}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Category Quick Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                        <button
                          type="button"
                          onClick={() => setSupFilterCat('all')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                            supFilterCat === 'all'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          全部
                        </button>
                        {supplierCategories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSupFilterCat(cat.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                              supFilterCat === cat.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>

                      {/* Candidate Suppliers for Single Selection */}
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-md p-1 bg-slate-50/50 font-sans">
                        {(() => {
                          const candidates = suppliers.filter(s => {
                            const matchesSearch = s.name.toLowerCase().includes(supSearch.toLowerCase()) ||
                              (s.remark || '').toLowerCase().includes(supSearch.toLowerCase()) ||
                              (s.contact || '').toLowerCase().includes(supSearch.toLowerCase());
                            const matchesCat = supFilterCat === 'all' || s.categoryId === supFilterCat;
                            return matchesSearch && matchesCat;
                          });

                          if (candidates.length === 0) {
                            return (
                              <div className="text-[11px] text-slate-400 py-4 text-center">
                                未匹配到相关供应商/公司
                              </div>
                            );
                          }

                          return candidates.map(s => {
                            const isSelected = newContractSupplierId === s.id;
                            const catName = supplierCategories.find(c => c.id === s.categoryId)?.name || '未分类';

                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleSelectContractSupplier(s.id)}
                                className={`w-full text-left flex items-start space-x-2 p-2 rounded-md border transition-all cursor-pointer ${
                                  isSelected ? 'bg-blue-50/40 border-blue-200/60' : 'bg-transparent border-transparent hover:bg-white'
                                }`}
                              >
                                <div className="mt-0.5 flex-shrink-0">
                                  <div className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'}`}>
                                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                  </div>
                                </div>
                                <div className="flex flex-col text-[11px] min-w-0">
                                  <span className={`font-semibold text-slate-800 ${isSelected ? 'text-blue-700' : ''}`}>
                                    {s.name}
                                  </span>
                                  <span className="text-[9px] text-slate-400 truncate">
                                    分类: {catName} {s.contact ? `| 联系人: ${s.contact}` : ''}
                                  </span>
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* 快速新建并关联输入表单 */}
                  {showQuickAdd && (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5 shadow-2xs font-sans">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        快捷录入并关联对应公司：
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans">
                        <input
                          type="text"
                          placeholder="新供应商/公司名称"
                          value={quickSupName}
                          onChange={(e) => setQuickSupName(e.target.value)}
                          className="p-1.5 border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <select
                          value={quickSupCatId}
                          onChange={(e) => setQuickSupCatId(e.target.value)}
                          className="p-1.5 border border-slate-200 rounded-md text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                        >
                          <option value="" disabled>选择供应商分类...</option>
                          {supplierCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleContractQuickAddAndSelect}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer transition-colors"
                        >
                          登记并选择
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                  确认建立后置${contractType === 'service' ? '服务' : '采购'}合同
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
