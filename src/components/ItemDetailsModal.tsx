import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppContext';
import { DemandProject, Contract, SHIPS, SettlementBatch, BidProject } from '../types';
import { X, Calendar, Plus, Trash2, Tag, AlertTriangle, Search, Link } from 'lucide-react';
import { formatFullChineseDate, isOverdue } from '../data';

interface ItemDetailsModalProps {
  itemId: string;
  type: 'project' | 'contract' | 'bid';
  onClose: () => void;
  onItemIdChange?: (newId: string) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ itemId, type, onClose, onItemIdChange }) => {
  const {
    projects,
    contracts,
    bids,
    preWorkflow,
    postWorkflow,
    bidWorkflow,
    updateProject,
    updateContract,
    updateBid,
    allTags,
    addGlobalTag,
    recommendedTags,
    deleteRecommendedTag,
    associateProjectToContract
  } = useAppState();

  const [newTag, setNewTag] = useState('');
  const [showTagOptions, setShowTagOptions] = useState(false);

  // Retrieve item
  const projectItem = type === 'project' ? projects.find(p => p.id === itemId) : undefined;
  const contractItem = type === 'contract' ? contracts.find(c => c.id === itemId) : undefined;
  const bidItem = type === 'bid' ? bids.find(b => b.id === itemId) : undefined;
  
  const currentItem = projectItem || contractItem || bidItem;

  // Local editable states synced to currentItem with safe optional chaining for when currentItem is undefined initially
  const [name, setName] = useState(currentItem?.name || '');
  const [code, setCode] = useState(type !== 'bid' ? (currentItem as any)?.code || '' : '');
  const [ship, setShip] = useState(currentItem?.ship || '');
  const [status, setStatus] = useState(currentItem?.status || '');
  const [isUrgent, setIsUrgent] = useState(currentItem?.isUrgent || false);
  const [dueDate, setDueDate] = useState(currentItem?.dueDate || '');
  const [remark, setRemark] = useState(currentItem?.remark || '');
  const [tags, setTags] = useState<string[]>(currentItem?.tags || []);
  
  // Specific to Contract
  const [contractStatus, setContractStatus] = useState<'执行中' | '已完成' | '已终止'>(
    contractItem?.contractStatus || '执行中'
  );
  const [isMultiSettlement, setIsMultiSettlement] = useState<boolean>(
    !!contractItem?.isMultiSettlement
  );
  const [settlements, setSettlements] = useState<SettlementBatch[]>(
    contractItem?.settlements || []
  );

  // Specific to Bid
  const [tenderUnit, setTenderUnit] = useState(bidItem?.tenderUnit || '');
  const [resultStatus, setResultStatus] = useState<'进行中' | '已中标' | '未中标' | '已终止'>(
    bidItem?.resultStatus || '进行中'
  );
  const [bidNo, setBidNo] = useState(bidItem?.id || '');

  // Search state for projects in contract view
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Specific to Project & Bid linkage
  const [associatedContractId, setAssociatedContractId] = useState<string>('');

  useEffect(() => {
    if (projectItem) {
      setAssociatedContractId(projectItem.contractId || '');
    } else if (bidItem) {
      setAssociatedContractId(bidItem.contractId || '');
    }
  }, [projectItem, bidItem]);

  useEffect(() => {
    if (currentItem) {
      setName(currentItem.name || '');
      setCode(type !== 'bid' ? (currentItem as any).code || '' : '');
      setShip(currentItem.ship || '');
      setStatus(currentItem.status || '');
      setIsUrgent(currentItem.isUrgent || false);
      setDueDate(currentItem.dueDate || '');
      setRemark(currentItem.remark || '');
      setTags(currentItem.tags || []);
      
      if (type === 'contract' && contractItem) {
        setContractStatus(contractItem.contractStatus || '执行中');
        setIsMultiSettlement(!!contractItem.isMultiSettlement);
        setSettlements(contractItem.settlements || []);
      }
      if (type === 'bid' && bidItem) {
        setTenderUnit(bidItem.tenderUnit || '');
        setResultStatus(bidItem.resultStatus || '进行中');
        setBidNo(bidItem.id);
      }
    }
  }, [itemId, type, currentItem]);

  // Early return if no valid item is loaded, placed safely AFTER hook declarations
  if (!currentItem) {
    return null;
  }

  // Sync edits upon changes
  const handleSaveField = (fields: Partial<any>) => {
    if (type === 'project') {
      updateProject(itemId, fields);
    } else if (type === 'contract') {
      updateContract(itemId, fields);
    } else if (type === 'bid') {
      updateBid(itemId, fields);
      if (fields.id && onItemIdChange) {
        onItemIdChange(fields.id);
      }
    }
  };



  const handleAddTag = (tagText: string) => {
    const trimmed = tagText.trim();
    if (trimmed && !tags.includes(trimmed)) {
      const updatedTags = [...tags, trimmed];
      setTags(updatedTags);
      addGlobalTag(trimmed);
      handleSaveField({ tags: updatedTags });
    }
    setNewTag('');
    setShowTagOptions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    setTags(updatedTags);
    handleSaveField({ tags: updatedTags });
  };

  const activeSteps = type === 'project' ? preWorkflow : type === 'contract' ? postWorkflow : bidWorkflow;

  // Filter existing contracts that contain the selected project/bid's ship (allowing overlapping ships for multiselect)
  const currentShipsList = ship.split(',').map(s => s.trim()).filter(Boolean);
  const eligibleContracts = contracts.filter(c => {
    const contractShips = c.ship.split(',').map(s => s.trim()).filter(Boolean);
    return contractShips.some(s => currentShipsList.includes(s));
  });
  // Find contract associated with this project or bid
  const connectedContract = (projectItem?.contractId || bidItem?.contractId) ? contracts.find(c => c.id === (projectItem?.contractId || bidItem?.contractId)) : undefined;

  // Find projects associated with this contract
  const connectedProjects = contractItem ? projects.filter(p => p.contractId === contractItem.id) : [];

  // Filter projects not associated with any contract
  const unlinkedProjects = projects.filter(p => !p.contractId || p.contractId === '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200" id="root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(1) > div:nth-of-type(2)">
      <div className="relative h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in p-0 text-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div className="flex items-center space-x-3">
            <span className={`px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${
              type === 'project' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              type === 'contract' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              {type === 'project' ? '需求项目详情' : type === 'contract' ? '合同详情' : '标书详情'}
            </span>
            <span className="font-mono text-sm text-slate-400 font-medium">
              ID: {type === 'bid' ? currentItem.id : (code || currentItem.id.substring(0, 8))}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content - Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Quick Alert if Overdue */}
          {dueDate && isOverdue(dueDate) && (
            <div className="bg-red-50 text-red-800 rounded-lg p-3 border border-red-200 flex items-center space-x-2 text-sm z-50">
              <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
              <div>
                <span className="font-semibold">超期警告:</span> 截止日期为 <span className="font-mono underline">{dueDate}</span>，该项目当前状态已超期，请抓紧处理！
              </div>
            </div>
          )}

          {/* Title and Urgent Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                {type === 'project' ? '项目名称' : type === 'contract' ? '合同名称' : '标书名称'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  handleSaveField({ name: e.target.value });
                }}
                className="w-full text-xl font-bold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none pb-1 transition-colors"
                placeholder="输入名称..."
              />
              {type === 'contract' && name.trim() && contracts.some(c => c.id !== itemId && c.name.trim().toLowerCase() === name.trim().toLowerCase()) && (
                <div className="text-rose-500 text-xs font-bold mt-1.5 flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>⚠️ 该合同名称已存在，请确认是否重复！</span>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-end h-full pt-4 md:pt-0">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block">
                紧急程度
              </label>
              <button
                onClick={() => {
                  const val = !isUrgent;
                  setIsUrgent(val);
                  handleSaveField({ isUrgent: val });
                }}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  isUrgent 
                    ? 'bg-red-50 text-red-700 border-red-200 shadow-xs' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className={`${isUrgent ? 'text-red-500 font-bold' : ''}`}>🔴</span>
                <span>{isUrgent ? (type === 'bid' ? '紧急标书' : '紧急项目') : (type === 'bid' ? '普通标书' : '普通项目')}</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Primary Metadata fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Project/Contract Code / Bid Tender Unit */}
            {type === 'bid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1 md:col-span-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 font-bold">
                    标书ID / 编号 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bidNo}
                    onChange={(e) => {
                      const newId = e.target.value.trim();
                      setBidNo(newId);
                      if (newId && newId !== itemId) {
                        const exists = bids.some(b => b.id === newId);
                        if (!exists) {
                          handleSaveField({ id: newId });
                        }
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none font-mono"
                    placeholder="请输入标书编号..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 font-bold">
                    招标单位 / 建设业主
                  </label>
                  <input
                    type="text"
                    value={tenderUnit}
                    onChange={(e) => {
                      setTenderUnit(e.target.value);
                      handleSaveField({ tenderUnit: e.target.value });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                    placeholder="请输入招标单位..."
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  {type === 'project' ? '项目编号' : '合同编号'}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    handleSaveField({ code: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                  placeholder={type === 'project' ? "项目编号" : "合同编号"}
                />
              </div>
            )}

            {/* Ship Selector */}
            <div className={(type === 'contract' || type === 'bid') ? "col-span-1 md:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                <span>所属船舶</span>
                {(type === 'contract' || type === 'bid') && <span className="text-[10px] text-blue-500 font-bold tracking-normal">(多选)</span>}
              </label>
              {(type === 'contract' || type === 'bid') ? (
                <div id="ship-checklist-container" className="flex flex-wrap gap-2 p-2 border border-slate-200 bg-slate-50/70 rounded-lg">
                  {SHIPS.map(s => {
                    const isChecked = ship.split(',').map(item => item.trim()).includes(s);
                    return (
                      <label 
                        key={s} 
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-3xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const shipList = ship.split(',').map(item => item.trim()).filter(Boolean);
                            let newList: string[];
                            if (isChecked) {
                              newList = shipList.filter(item => item !== s);
                            } else {
                              newList = [...shipList, s];
                            }
                            // Sort them according to SHIPS order for aesthetics
                            const sortedList = SHIPS.filter(item => newList.includes(item));
                            const finalString = sortedList.join(', ');
                            setShip(finalString);
                            handleSaveField({ ship: finalString });
                          }}
                          className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                        <span>{s}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <select
                  value={ship}
                  onChange={(e) => {
                    setShip(e.target.value);
                    handleSaveField({ ship: e.target.value });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white font-medium text-slate-700"
                >
                  {SHIPS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Contract specific independent status */}
            {type === 'contract' && (
              <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  💼 合同独立签署/执行状态
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['执行中', '已完成', '已终止'] as const).map((s) => {
                    const isActive = contractStatus === s;
                    let colorClasses = '';
                    if (s === '执行中') colorClasses = isActive ? 'bg-amber-100 text-amber-850 border-amber-300 font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-600 border-slate-200';
                    if (s === '已完成') colorClasses = isActive ? 'bg-blue-100 text-blue-850 border-blue-300 font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-600 border-slate-200';
                    if (s === '已终止') colorClasses = isActive ? 'bg-rose-100 text-rose-850 border-rose-300 font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-600 border-slate-200';

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setContractStatus(s);
                          handleSaveField({ contractStatus: s });
                        }}
                        className={`px-3 py-2 border rounded-lg text-xs transition-all flex items-center justify-center space-x-1 ${colorClasses}`}
                      >
                        <span>
                          {s === '执行中' ? '🟡' : s === '已完成' ? '🔵' : '🔴'}
                        </span>
                        <span>{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Render conditional status block (either standard or multi-settlement list) */}
            {type === 'project' || type === 'bid' || !isMultiSettlement ? (
              <>
                {/* Current Step Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    {type === 'bid' ? '当前标书环节' : '当前业务状态'}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      handleSaveField({ status: e.target.value });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white font-medium text-slate-700"
                  >
                    {activeSteps.map(step => {
                      let indicatorStr = '';
                      if (step.color === 'yellow') indicatorStr = '🟡 ';
                      else if (step.color === 'green') indicatorStr = '🟢 ';
                      else if (step.color === 'blue') indicatorStr = '🔵 ';
                      else if (step.color === 'red') indicatorStr = '🔴 ';
                      
                      return (
                        <option key={step.id} value={step.name}>
                          {indicatorStr}{step.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Due Date picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 font-bold">
                    {type === 'bid' ? '投标截止日期' : '截止日期 (可选)'}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => {
                        setDueDate(e.target.value);
                        handleSaveField({ dueDate: e.target.value || undefined });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none text-slate-700"
                    />
                  </div>
                </div>

                {/* Bid Status result buttons */}
                {type === 'bid' && (
                  <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                      🎯 标投结果状态
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['进行中', '已中标', '未中标', '已终止'] as const).map((s) => {
                        const isActive = resultStatus === s;
                        let colorClasses = '';
                        if (s === '进行中') colorClasses = isActive ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-600 border-slate-200';
                        if (s === '已中标') colorClasses = isActive ? 'bg-emerald-100 text-emerald-850 border-emerald-300 font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-600 border-slate-200';
                        if (s === '未中标') colorClasses = isActive ? 'bg-slate-100 text-slate-800 border-slate-300 font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-600 border-slate-200';
                        if (s === '已终止') colorClasses = isActive ? 'bg-rose-100 text-rose-850 border-rose-300 font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-600 border-slate-200';

                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setResultStatus(s);
                              handleSaveField({ resultStatus: s });
                            }}
                            className={`px-3 py-2 border rounded-lg text-xs transition-all flex items-center justify-center space-x-1 ${colorClasses}`}
                          >
                            <span>
                              {s === '进行中' ? '🟡' : s === '已中标' ? '🟢' : s === '未中标' ? '⚪' : '🔴'}
                            </span>
                            <span>{s}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Simple mode upgrade banner */}
                {type === 'contract' && !isMultiSettlement && (
                  <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ⚡ 简易 / 单次结算模式
                      </span>
                      <p className="text-xs text-slate-650 mt-2 leading-relaxed">
                        该合同当前处于单次结算模式，直接跟踪付款总流程。若该项目属于多次供货、分期结算的长周期合同，可一键升级。
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const firstBatch: SettlementBatch = {
                          id: `s-${Date.now()}-1`,
                          name: '第1期结算',
                          status: status || '签收单',
                          remark: ''
                        };
                        setSettlements([firstBatch]);
                        setIsMultiSettlement(true);
                        handleSaveField({
                          isMultiSettlement: true,
                          settlements: [firstBatch]
                        });
                      }}
                      className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 border border-transparent rounded-lg font-bold text-xs text-white hover:bg-blue-700 active:scale-98 transition-all shadow-xs"
                    >
                      <Plus size={14} />
                      <span>开启多批次分批结算 ↗</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Multi-settlement section if enabled */
              <div className="col-span-1 md:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
                    <span>📊 多批次独立结算明细</span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-full font-bold">
                      {settlements.length} 批次
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newNum = settlements.length + 1;
                      const newBatch: SettlementBatch = {
                        id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                        name: `第${newNum}期结算`,
                        status: '签收单',
                        remark: ''
                      };
                      const updated = [...settlements, newBatch];
                      setSettlements(updated);
                      handleSaveField({ settlements: updated });
                    }}
                    className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-bold"
                  >
                    <Plus size={14} />
                    <span>新增结算批次</span>
                  </button>
                </div>
                
                {settlements.map((batch, index) => (
                  <div key={batch.id} className="relative bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 transition-all">
                    {/* Batch Header */}
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={batch.name}
                        onChange={(e) => {
                          const updated = settlements.map(b => b.id === batch.id ? { ...b, name: e.target.value } : b);
                          setSettlements(updated);
                          handleSaveField({ settlements: updated });
                        }}
                        className="font-bold text-sm text-slate-800 bg-transparent border-b border-transparent hover:border-slate-350 focus:border-blue-500 focus:outline-none pb-0.5 min-w-[140px]"
                        placeholder="批次名称..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`确认移除 ${batch.name} 吗？`)) {
                            const updated = settlements.filter(b => b.id !== batch.id);
                            setSettlements(updated);
                            handleSaveField({ settlements: updated });
                          }
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Batch Content (Status & Due Date) */}
                    {(() => {
                      const contractShips = ship.split(',').map(s => s.trim()).filter(Boolean);
                      return (
                        <div className={`grid ${contractShips.length >= 2 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                              结算业务状态
                            </label>
                            <select
                              value={batch.status}
                              onChange={(e) => {
                                const updated = settlements.map(b => b.id === batch.id ? { ...b, status: e.target.value } : b);
                                setSettlements(updated);
                                handleSaveField({ settlements: updated });
                              }}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {postWorkflow.map(step => {
                                const colorEmoji = step.color === 'yellow' ? '🟡' : step.color === 'green' ? '🟢' : step.color === 'blue' ? '🔵' : step.color === 'red' ? '🔴' : '⚪';
                                const hasEmoji = /^[^\w\s\u4e00-\u9fa5]{1,2}\s/.test(step.name);
                                const displayName = hasEmoji ? step.name : `${colorEmoji} ${step.name}`;
                                return (
                                  <option key={step.id} value={step.name}>
                                    {displayName}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                              本批截止日期
                            </label>
                            <input
                              type="date"
                              value={batch.dueDate || ''}
                              onChange={(e) => {
                                const updated = settlements.map(b => b.id === batch.id ? { ...b, dueDate: e.target.value || undefined } : b);
                                setSettlements(updated);
                                handleSaveField({ settlements: updated });
                              }}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          {contractShips.length >= 2 && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                结算关联船舶
                              </label>
                              <select
                                value={batch.ship || ''}
                                onChange={(e) => {
                                  const updated = settlements.map(b => b.id === batch.id ? { ...b, ship: e.target.value } : b);
                                  setSettlements(updated);
                                  handleSaveField({ settlements: updated });
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                              >
                                <option value="">⚓ 未指定</option>
                                {contractShips.map(sh => (
                                  <option key={sh} value={sh}>{sh}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Batch Remark */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        本期备注 (如：核凭证、已付金额、进度说明等)
                      </label>
                      <input
                        type="text"
                        value={batch.remark || ''}
                        onChange={(e) => {
                          const updated = settlements.map(b => b.id === batch.id ? { ...b, remark: e.target.value } : b);
                          setSettlements(updated);
                          handleSaveField({ settlements: updated });
                        }}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                        placeholder="输入备注或说明..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          <hr className="border-slate-100" />

          {/* Custom Tag Editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              自定义快捷标签
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[46px] items-center">
              {(Array.from(new Set(tags)) as string[]).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs group hover:border-red-200 hover:bg-red-50/50 transition-all cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                  title="点击移除标签"
                >
                  <span>{tag}</span>
                  <X size={10} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                </span>
              ))}
              
              <div className="relative inline-block flex-1 min-w-[120px]">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => {
                    setNewTag(e.target.value);
                    setShowTagOptions(true);
                  }}
                  onFocus={() => setShowTagOptions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(newTag);
                    }
                  }}
                  placeholder="➕ 回车新增标签..."
                  className="w-full bg-transparent border-none text-xs focus:outline-none px-1 text-slate-700 py-0.5"
                />

                {/* Autocomplete dropdown for tags */}
                {showTagOptions && (
                  <div className="absolute left-0 bottom-full mb-1 w-56 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 text-xs py-1">
                    <div className="px-2 py-1 text-slate-400 border-b border-slate-100 pb-1 font-semibold flex items-center justify-between">
                      <span>推荐标签</span>
                      <span className="text-[10px] text-slate-300 font-normal">悬停可删除</span>
                    </div>
                    {recommendedTags
                      .filter(rt => !tags.includes(rt.name) && rt.name.toLowerCase().includes(newTag.toLowerCase()))
                      .map(rt => (
                        <div
                          key={rt.id}
                          className="w-full px-2 py-1 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between group/rt"
                        >
                          <button
                            type="button"
                            onClick={() => handleAddTag(rt.name)}
                            className="flex-1 text-left py-1 text-slate-700 font-medium cursor-pointer"
                          >
                            #{rt.name}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`确定要彻底删除推荐标签“${rt.name}”吗？\n(此操作仅移除推荐状态，现有已打标项目不会被修改)`)) {
                                deleteRecommendedTag(rt.id);
                              }
                            }}
                            className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors opacity-0 group-hover/rt:opacity-100"
                            title="从推荐库中删除此标签"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    {recommendedTags.filter(rt => !tags.includes(rt.name) && rt.name.toLowerCase().includes(newTag.toLowerCase())).length === 0 && (
                      <div className="px-2.5 py-2 text-[10px] text-slate-400 text-center">暂无匹配推荐标签</div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowTagOptions(false)}
                      className="w-full text-center px-1 py-1 text-blue-500 hover:text-blue-700 border-t border-slate-50 mt-1 cursor-pointer font-semibold"
                    >
                      关闭候选
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Relationships Configuration */}
          {type === 'project' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                已关联合同 (仅能关联同艘船舶的合同)
              </label>
              {eligibleContracts.length === 0 ? (
                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  当前船舶 <span className="font-bold">{ship}</span> 尚未创建任何合同，无法关联。请先去后置工作模块创建一个属于 {ship} 的合同。
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={associatedContractId}
                    onChange={(e) => {
                      const newId = e.target.value || undefined;
                      setAssociatedContractId(newId || '');
                      associateProjectToContract(itemId, newId);
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none bg-white font-medium"
                  >
                    <option value="">-- 未关联任何合同 --</option>
                    {eligibleContracts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status})
                      </option>
                    ))}
                  </select>
                  {connectedContract && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs space-y-1">
                      <div className="font-medium text-slate-700 flex items-center justify-between">
                        <span>关联详情：{connectedContract.name}</span>
                        <span className="text-blue-600 font-semibold">{connectedContract.status}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : type === 'bid' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                已关联合同 (关联属于相同船舶的合同)
              </label>
              {eligibleContracts.length === 0 ? (
                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  当前船舶 <span className="font-bold">{ship}</span> 尚未创建任何对应的合同。请先去后置工作模块创建一个属于 {ship} 的合同。
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={associatedContractId}
                    onChange={(e) => {
                      const newId = e.target.value || undefined;
                      setAssociatedContractId(newId || '');
                      handleSaveField({ contractId: newId });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none bg-white font-medium"
                  >
                    <option value="">-- 未关联任何合同 --</option>
                    {eligibleContracts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status})
                      </option>
                    ))}
                  </select>
                  {connectedContract && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs space-y-1">
                      <div className="font-medium text-slate-700 flex items-center justify-between">
                        <span>关联详情：{connectedContract.name}</span>
                        <span className="text-blue-600 font-semibold">{connectedContract.status}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : type === 'contract' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                  <span>📊 已关联的前置需求工作项 ({connectedProjects.length})</span>
                </label>
                {connectedProjects.length === 0 ? (
                  <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-200 border-dashed text-center">
                    暂无任何需求项目关联此合同。
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {connectedProjects.map(p => (
                      <div key={p.id} className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200 rounded-lg p-3 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-700 flex items-center space-x-1.5">
                            <span className="font-mono bg-slate-200 text-slate-700 px-1 py-0.5 rounded text-[10px]">{p.code}</span>
                            <span>{p.name}</span>
                          </div>
                          <p className="text-slate-400 text-[10px] mt-1 font-mono">
                            船号: {p.ship}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-semibold text-[10px]">{p.status}</span>
                          <button
                            type="button"
                            onClick={() => associateProjectToContract(p.id, undefined)}
                            className="p-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                            title="取消关联"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search & link new projects */}
              <div className="relative pt-1 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  🔍 搜索并关联新的前置需求项目 (限制：仅显示未连接合同的项目)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={projectSearchQuery}
                    onChange={(e) => {
                      setProjectSearchQuery(e.target.value);
                      setShowProjectDropdown(true);
                    }}
                    onFocus={() => setShowProjectDropdown(true)}
                    className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-medium animate-none"
                    placeholder="输入编号、项目名称、船号进行搜索..."
                  />
                  <Search className="absolute left-2.5 top-2.5 text-slate-400" size={12} />
                  {projectSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProjectSearchQuery('')}
                      className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs px-1 font-semibold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {showProjectDropdown && (
                  <>
                    <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 divide-y divide-slate-100">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 tracking-wider bg-slate-50">
                        待关联需求项目库 ({unlinkedProjects.filter(p => {
                          const query = projectSearchQuery.trim().toLowerCase();
                          if (!query) return true;
                          return p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query) || p.ship.toLowerCase().includes(query);
                        }).length})
                      </div>
                      {unlinkedProjects.filter(p => {
                        const query = projectSearchQuery.trim().toLowerCase();
                        if (!query) return true;
                        return p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query) || p.ship.toLowerCase().includes(query);
                      }).length === 0 ? (
                        <div className="px-3 py-2.5 text-xs text-slate-400 text-center">暂无匹配的未关联项目</div>
                      ) : (
                        unlinkedProjects.filter(p => {
                          const query = projectSearchQuery.trim().toLowerCase();
                          if (!query) return true;
                          return p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query) || p.ship.toLowerCase().includes(query);
                        }).map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              associateProjectToContract(p.id, contractItem!.id);
                              setProjectSearchQuery('');
                              setShowProjectDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between group transition-colors"
                          >
                            <div className="flex flex-col">
                              <div className="font-semibold text-slate-700 flex items-center space-x-1.5">
                                <span className="font-mono bg-slate-100 text-slate-600 px-1 py-0.2 rounded text-[9px]">{p.code}</span>
                                <span className="truncate max-w-[280px]">{p.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                船号: {p.ship}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-semibold">{p.status}</span>
                              <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold">关联 ↗</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowProjectDropdown(false)}
                    />
                  </>
                )}
              </div>
            </div>
          ) : null}

          {type !== 'bid' && <hr className="border-slate-100" />}

          {/* Long Text Remark */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              详细备注记录 (记录催单、审批、采购过程等)
            </label>
            <textarea
              rows={5}
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value);
                handleSaveField({ remark: e.target.value });
              }}
            className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none font-sans leading-relaxed"
              placeholder="在这里记录催单情况，审批说明，供应商谈判过程，退回原因等长文本信息..."
            />
          </div>

        </div>

        {/* Modal Footer with quick confirm close */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs hover:shadow-md transition-all"
          >
            保存并返回
          </button>
        </div>

      </div>
    </div>
  );
};
