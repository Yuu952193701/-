import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { BidProject, SHIPS } from '../types';
import { ItemDetailsModal } from './ItemDetailsModal';
import { isOverdue, formatChineseDate } from '../data';
import { 
  Search, Plus, ArrowLeft, ArrowRight, Trash2, Edit2, 
  FolderOpen, Tag, Calendar, AlertTriangle, CheckSquare, 
  Layers, HelpCircle, X, ChevronRight, Briefcase, Award, Clock
} from 'lucide-react';

export const Bidding: React.FC = () => {
  const {
    bids,
    contracts,
    bidWorkflow,
    addBid,
    updateBid,
    deleteBid,
    moveBidStep,
    recommendedTags,
    deleteRecommendedTag,
    addGlobalTag
  } = useAppState();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShip, setSelectedShip] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<string>('all');
  const [filterUrgent, setFilterUrgent] = useState<boolean | 'all'>('all');

  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBidId, setNewBidId] = useState('');
  const [newName, setNewName] = useState('');
  const [newShip, setNewShip] = useState('鸿鹄01');
  const [newTenderUnit, setNewTenderUnit] = useState('');
  const [newIsUrgent, setNewIsUrgent] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [newRemark, setNewRemark] = useState('');
  const [newBidTags, setNewBidTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [newContractId, setNewContractId] = useState('');

  // Selected Item ID for details modal (direct inline editing)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Helper to resolve color of a bid status
  const getBidStatusColor = (statusName: string) => {
    const step = bidWorkflow.find(s => s.name === statusName);
    return step ? step.color : 'green';
  };

  // Helper to check next and prev step existence
  const canMove = (bid: BidProject) => {
    const currentIndex = bidWorkflow.findIndex(s => s.name === bid.status);
    return {
      hasPrev: currentIndex > 0,
      hasNext: currentIndex < bidWorkflow.length - 1,
    };
  };

  const handleAddBidTag = (tagText: string) => {
    const trimmed = tagText.trim();
    if (trimmed && !newBidTags.includes(trimmed)) {
      setNewBidTags(prev => [...prev, trimmed]);
      addGlobalTag(trimmed);
    }
    setNewTagInput('');
    setShowTagOptions(false);
  };

  const handleRemoveBidTag = (tagToRemove: string) => {
    setNewBidTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // Handle bid creation
  const handleCreateBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBidId.trim()) {
      alert('请录入/填写标书编号！');
      return;
    }
    if (bids.some(b => b.id.trim().toLowerCase() === newBidId.trim().toLowerCase())) {
      alert('标书编号已存在，请核对并重新录入！');
      return;
    }
    if (!newName.trim()) {
      alert('请填写标书名称');
      return;
    }

    addBid({
      id: newBidId.trim(),
      name: newName.trim(),
      ship: newShip,
      tenderUnit: newTenderUnit.trim() || undefined,
      isUrgent: newIsUrgent,
      dueDate: newDueDate || undefined,
      remark: newRemark.trim(),
      tags: newBidTags,
      contractId: newContractId || undefined
    });

    // Reset fields
    setNewBidId('');
    setNewName('');
    setNewShip('鸿鹄01');
    setNewTenderUnit('');
    setNewIsUrgent(false);
    setNewDueDate('');
    setNewRemark('');
    setNewBidTags([]);
    setNewTagInput('');
    setShowTagOptions(false);
    setNewContractId('');
    setShowCreateModal(false);
  };

  // Handle direct deletion
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`确认删除标书项目【${name}】及对应所有流转记录吗？\n\n此操作仅在系统内删除该标书进度流转记录，不会删除您电脑本地的任何实际对应标书文件或工作文件夹。`)) {
      deleteBid(id);
      if (selectedItemId === id) setSelectedItemId(null);
    }
  };

  // Quick stats calculations
  const totalBidsCount = bids.length;
  const inProgressBidsCount = bids.filter(b => b.resultStatus === '进行中').length;
  const wonBidsCount = bids.filter(b => b.resultStatus === '已中标').length;
  const urgentBidsCount = bids.filter(b => b.isUrgent).length;

  // Filter application
  const filteredBids = bids.filter(bid => {
    // 1. Search term (matches bid name, remarks, tender unit, or custom tags)
    const searchLower = searchTerm.toLowerCase().trim();
    const tagsMatch = bid.tags.some(tag => tag.toLowerCase().includes(searchLower));
    const termMatch = !searchLower || 
      bid.name.toLowerCase().includes(searchLower) ||
      (bid.tenderUnit || '').toLowerCase().includes(searchLower) ||
      bid.remark.toLowerCase().includes(searchLower) ||
      tagsMatch;

    // 2. Ship filter (allowing matching any ship in comma-separated strings for multiselect)
    const shipMatch = selectedShip === 'all' || bid.ship.split(',').map(s => s.trim()).includes(selectedShip);

    // 3. Status filter
    const statusMatch = selectedStatus === 'all' || bid.status === selectedStatus;

    // 4. Result status filter
    const resultMatch = selectedResult === 'all' || bid.resultStatus === selectedResult;

    // 5. Urgency filter
    const urgentMatch = filterUrgent === 'all' || bid.isUrgent === filterUrgent;

    return termMatch && shipMatch && statusMatch && resultMatch && urgentMatch;
  });

  // Sort bids by latest updated/created time first
  const sortedBids = [...filteredBids].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <span>标书项目管理</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            独立业务版块：用来登记并跟进各海域运维服务、船舶备件与风电维护项目的投标进程。
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowCreateModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-3xs cursor-pointer self-start md:self-center"
        >
          <Plus size={14} />
          <span>新建标书登记</span>
        </button>
      </div>

      {/* 2. Visual Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-3xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Briefcase size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">标书库总存量</div>
            <div className="text-lg font-extrabold text-slate-800 mt-0.5">{totalBidsCount} <span className="text-xs font-normal text-slate-400">个</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-3xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">投标进行中</div>
            <div className="text-lg font-extrabold text-slate-800 mt-0.5">{inProgressBidsCount} <span className="text-xs font-normal text-slate-400">个</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-3xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Award size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">成功中标数</div>
            <div className="text-lg font-extrabold text-slate-800 mt-0.5 text-emerald-600">{wonBidsCount} <span className="text-xs font-normal text-emerald-500">个</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-3xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">特急推进件</div>
            <div className="text-lg font-extrabold text-slate-800 mt-0.5 text-rose-600">{urgentBidsCount} <span className="text-xs font-normal text-rose-400">件</span></div>
          </div>
        </div>
      </div>

      {/* 3. Filtering Controls Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none placeholder-slate-400 text-slate-800 font-medium"
            placeholder="极速检索：输入标书名称、标签、备注内容或招标单位，实时模糊检索..."
          />
        </div>

        {/* Filters Select boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1.5">
          {/* Ship */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">按所属船舶</label>
            <select
              value={selectedShip}
              onChange={(e) => setSelectedShip(e.target.value)}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium cursor-pointer"
            >
              <option value="all">🚢 所有船舶 (支持5大 classification)</option>
              {SHIPS.map(ship => (
                <option key={ship} value={ship}>{ship}</option>
              ))}
            </select>
          </div>

          {/* Workflow progress stage */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">按流转节点</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium cursor-pointer"
            >
              <option value="all">📁 所有推进节点</option>
              {bidWorkflow.map(step => {
                const colorEmoji = step.color === 'yellow' ? '🟡' : step.color === 'green' ? '🟢' : step.color === 'blue' ? '🔵' : step.color === 'red' ? '🔴' : '⚪';
                return (
                  <option key={step.id} value={step.name}>{colorEmoji} {step.name}</option>
                );
              })}
            </select>
          </div>

          {/* Result state */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">按中标结果</label>
            <select
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value)}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium cursor-pointer"
            >
              <option value="all">🎯 所有投标状态</option>
              <option value="进行中">🔵 进行中</option>
              <option value="已中标">🟢 已中标</option>
              <option value="未中标">⚪ 未中标</option>
              <option value="已终止">🔴 已终止</option>
            </select>
          </div>

          {/* Is Urgent dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">紧急特急类别</label>
            <select
              value={filterUrgent.toString()}
              onChange={(e) => {
                const val = e.target.value;
                setFilterUrgent(val === 'all' ? 'all' : val === 'true');
              }}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium cursor-pointer"
            >
              <option value="all">⚡ 所有件 (普通+紧急)</option>
              <option value="true">🚨 仅看 紧急件</option>
              <option value="false">⚪ 仅看 普通件</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Display list panel */}
      <div className="space-y-3">
        {sortedBids.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-3xs">
            <AlertTriangle className="mx-auto text-slate-300 mb-2.5" size={24} />
            <p className="text-xs text-slate-500 font-medium">满足设定过滤指标的标书很少或没有找到该数据件。</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedShip('all');
                setSelectedStatus('all');
                setSelectedResult('all');
                setFilterUrgent('all');
              }}
              className="text-xs text-blue-600 mt-2 hover:underline cursor-pointer font-bold"
            >
              清空过滤器条件并展示全部
            </button>
          </div>
        ) : (
          sortedBids.map(bid => {
            const statusColor = getBidStatusColor(bid.status);
            const overdue = bid.dueDate && isOverdue(bid.dueDate);
            const { hasPrev, hasNext } = canMove(bid);

            return (
              <div
                key={bid.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-5 py-4 shadow-3xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Columns: Left Text content */}
                <div 
                  onClick={() => setSelectedItemId(bid.id)}
                  className="flex-1 cursor-pointer select-none space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Ship classification */}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/65">
                      🚢 {bid.ship}
                    </span>

                    {/* Result Status badge */}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${
                      bid.resultStatus === '已中标' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      bid.resultStatus === '未中标' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                      bid.resultStatus === '已终止' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {bid.resultStatus}
                    </span>

                    {/* Urgency status */}
                    {bid.isUrgent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                        🚨 紧急
                      </span>
                    )}

                    {/* Due Date Indicator */}
                    {bid.dueDate && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                        overdue 
                          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                          : 'bg-slate-50 text-slate-600 border-slate-200/85'
                      }`}>
                        📅 截止: {bid.dueDate} {overdue && '(已逾期)'}
                      </span>
                    )}

                    {/* Custom Tags */}
                    {bid.tags && bid.tags.length > 0 && Array.from(new Set(bid.tags)).map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Main Title content */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">
                      {bid.name}
                    </h3>
                    {bid.tenderUnit && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        招标单位/发包方: <span className="font-semibold text-slate-500">{bid.tenderUnit}</span>
                      </p>
                    )}
                  </div>

                  {/* Horizontal detail remark display line */}
                  {bid.remark && (
                    <div className="text-[11px] text-slate-450 text-slate-500 flex items-center space-x-1">
                      <span className="text-blue-500">💡</span>
                      <span className="italic truncate max-w-xl" title={bid.remark}>备注: {bid.remark}</span>
                    </div>
                  )}
                </div>

                {/* Columns: Right Side Actions & state advancement */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 flex-shrink-0">
                  
                  {/* Current step with specific color */}
                  <div className="flex flex-col items-start sm:items-end justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 select-none">当前标书环节</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-3xs ${
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
                      {bid.status}
                    </span>
                  </div>

                  {/* Action step increment/decrement triggers */}
                  <div className="flex items-center gap-1.5 border-l border-slate-100 pl-0.5 sm:pl-3.5">
                    <button
                      disabled={!hasPrev}
                      onClick={() => moveBidStep(bid.id, 'prev')}
                      className={`p-1.5 rounded-md border ${
                        hasPrev 
                      ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:border-slate-300' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-300 cursor-not-allowed'
                      } transition-all duration-150 shadow-3xs`}
                      title="回退流转至上个环节"
                    >
                      <ArrowLeft size={13} />
                    </button>

                    <button
                      disabled={!hasNext}
                      onClick={() => moveBidStep(bid.id, 'next')}
                      className={`p-1.5 rounded-md border ${
                        hasNext 
                      ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:border-slate-300' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-300 cursor-not-allowed'
                      } transition-all duration-150 shadow-3xs`}
                      title="推进流转至下个环节"
                    >
                      <ArrowRight size={13} />
                    </button>

                    {/* Quick Edit */}
                    <button
                      onClick={() => setSelectedItemId(bid.id)}
                      className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-blue-650 transition-all shadow-3xs cursor-pointer"
                      title="编辑修改标书档案"
                    >
                      <Edit2 size={13} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(bid.id, bid.name)}
                      className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:border-rose-150 hover:text-rose-600 transition-all shadow-3xs cursor-pointer"
                      title="彻底注销标书档案"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL: CREATE BID ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg border border-slate-100 animate-slide-in text-slate-800 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <span>➕ 注册登记新标书文件案</span>
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-650 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBid} className="space-y-4 overflow-y-auto pr-1 flex-1 pb-2">
              
              {/* Field 1: Name and ID selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">标书编号 / ID <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newBidId}
                    onChange={(e) => setNewBidId(e.target.value)}
                    placeholder="如：BID2026-001"
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">标书名称 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                    }}
                    placeholder="如：XX海域电缆备件采购投标"
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 2: Ship Multi-select checklist */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                  <span>所属船舶 (可多选) <span className="text-rose-500">*</span></span>
                  <span className="text-[9px] text-blue-500 font-bold lowercase tracking-normal">已选: {newShip.split(',').map(item => item.trim()).filter(Boolean).length}艘</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-1.5 border border-slate-200 bg-slate-50/50 rounded-md max-h-24 overflow-y-auto">
                  {SHIPS.map(s => {
                    const shipList = newShip.split(',').map(item => item.trim()).filter(Boolean);
                    const isChecked = shipList.includes(s);
                    return (
                      <label 
                        key={s} 
                        className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-blue-50/80 border-blue-200 text-blue-700 shadow-3xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            let newList: string[];
                            if (isChecked) {
                              newList = shipList.filter(item => item !== s);
                            } else {
                              newList = [...shipList, s];
                            }
                            if (newList.length === 0) {
                              newList = ['鸿鹄01'];
                            }
                            const sortedList = SHIPS.filter(item => newList.includes(item));
                            const finalString = sortedList.join(', ');
                            setNewShip(finalString);
                          }}
                          className="h-3 w-3 rounded text-blue-600 focus:ring-blue-500 border-slate-350 cursor-pointer"
                        />
                        <span>{s}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Field 3: Tendering Unit and Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">招标单位 (可选)</label>
                  <input
                    type="text"
                    value={newTenderUnit}
                    onChange={(e) => setNewTenderUnit(e.target.value)}
                    placeholder="如：国家电投海南公司"
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">投标截止时间</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 3: Tags list */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">自定义标签 (回车快速创建)</label>
                <div className="relative">
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[38px] items-center mb-1.5 focus-within:bg-white focus-within:border-blue-500 transition-all">
                    {newBidTags.map(tag => (
                      <span key={tag} className="inline-flex items-center bg-blue-50 hover:bg-blue-150 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px] transition-colors border border-blue-100/60 font-sans">
                        <span>{tag}</span>
                        <button type="button" onClick={() => handleRemoveBidTag(tag)} className="ml-1 hover:text-red-500 font-bold font-mono text-[10px] cursor-pointer">&times;</button>
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
                            handleAddBidTag(newTagInput.trim());
                          }
                        }
                      }}
                      placeholder={newBidTags.length === 0 ? "回车确认生成当前标签..." : "+ 添加..."}
                      className="flex-1 bg-transparent border-none text-xs focus:outline-none min-w-[120px]"
                    />
                  </div>

                  {/* Quick-select Recommended Tags */}
                  {recommendedTags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1 items-center pb-1">
                      <span className="text-[10px] text-slate-400 mr-1">推荐点击直接打标:</span>
                      {recommendedTags.map(rt => {
                        const isSelected = newBidTags.includes(rt.name);
                        return (
                          <button
                            key={rt.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                handleRemoveBidTag(rt.name);
                              } else {
                                handleAddBidTag(rt.name);
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
                        <span>系统推荐候选标签</span>
                        <span className="text-[9px] text-slate-350 font-normal normal-case">悬停可删除</span>
                      </div>
                      {recommendedTags
                        .filter(rt => !newBidTags.includes(rt.name) && rt.name.toLowerCase().includes(newTagInput.toLowerCase()))
                        .map(rt => (
                          <div
                            key={rt.id}
                            className="w-full px-2.5 py-1 hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-between cursor-pointer group/rt"
                          >
                            <button
                              type="button"
                              onClick={() => handleAddBidTag(rt.name)}
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
                                  if (confirm(`确定要彻底删除推荐标签“${rt.name}”吗？\n(此操作仅移除推荐状态，已打标的现有标书不会受影响)`)) {
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
                        <span className="text-[9px] text-slate-400 mt-0.5">支持回车生成任何标签</span>
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

              {/* Is Urgent field */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="newIsUrgent"
                  type="checkbox"
                  checked={newIsUrgent}
                  onChange={(e) => setNewIsUrgent(e.target.checked)}
                  className="rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="newIsUrgent" className="text-[11px] font-bold text-rose-600 select-none cursor-pointer flex items-center space-x-1">
                  <span>🚨 设定为特急跟进标书项目</span>
                </label>
              </div>

              {/* Field 4: Custom remark description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">标书项目备注与说明信息</label>
                <textarea
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  rows={3}
                  placeholder="记录该标书推进过程中发现的技术难度点、要事、特殊保函要求等..."
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-3xs transition-all cursor-pointer"
                >
                  保存登记件
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL / DRAWER: VIEW DETAIL via Unified ItemDetailsModal ================= */}
      {selectedItemId && (
        <ItemDetailsModal
          isOpen={!!selectedItemId}
          onClose={() => setSelectedItemId(null)}
          itemId={selectedItemId}
          type="bid"
        />
      )}

    </div>
  );
};
