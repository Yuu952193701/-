import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { Supplier, SupplierCategory } from '../types';
import { Plus, Edit2, Trash2, FolderPlus, Search, Building2, Tag, X, ExternalLink, HelpCircle } from 'lucide-react';
import { SupplierDetailsModal } from './SupplierDetailsModal';
import { ItemDetailsModal } from './ItemDetailsModal';

export const Suppliers: React.FC = () => {
  const {
    suppliers,
    supplierCategories,
    addSupplier,
    deleteSupplier,
    addSupplierCategory,
    updateSupplierCategory,
    deleteSupplierCategory,
    projects,
    contracts,
  } = useAppState();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');

  // New/Edit Category States
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // New Supplier Dialog states (for quick initial registration)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupCatId, setNewSupCatId] = useState('');

  // Selected supplier for detail view/edit modal
  const [selectedSupplierIdForModal, setSelectedSupplierIdForModal] = useState<string | null>(null);

  // Sub-detail trace modal states (opening a project or contract from within the supplier sheet)
  const [traceItemId, setTraceItemId] = useState<string | null>(null);
  const [traceItemType, setTraceItemType] = useState<'project' | 'contract' | null>(null);

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(s => {
    // Search by name, custom attributes, or notes
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.remark || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contacts?.some(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesCat = selectedCatId === 'all' || s.categoryId === selectedCatId;
    return matchesSearch && matchesCat;
  });

  // Handle category management
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addSupplierCategory(newCatName);
    setNewCatName('');
  };

  const handleStartEditCat = (cat: SupplierCategory) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleSaveEditCat = () => {
    if (!editingCatName.trim() || !editingCatId) return;
    updateSupplierCategory(editingCatId, editingCatName);
    setEditingCatId(null);
    setEditingCatName('');
  };

  const handleDeleteCat = (catId: string) => {
    // Find how many suppliers are currently in this category
    const affectedCount = suppliers.filter(s => s.categoryId === catId).length;
    let message = '确定要删除该分类吗？';
    if (affectedCount > 0) {
      message = `确定要删除该分类吗？当前有 ${affectedCount} 家供应商属于此分类，删除后这些供应商将自动设为「未分类」状态。`;
    }
    if (window.confirm(message)) {
      deleteSupplierCategory(catId);
      if (selectedCatId === catId) {
        setSelectedCatId('all');
      }
    }
  };

  // Handle supplier addition
  const handleOpenAddModal = () => {
    setNewSupName('');
    setNewSupCatId(supplierCategories[0]?.id || '');
    setShowAddModal(true);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) {
      alert('请输入供应商名称');
      return;
    }

    const trimmedName = newSupName.trim();
    const existing = suppliers.find(s => s.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      alert(`供应商「${existing.name}」已存在，请勿重复登记！已自动为您打开该供应商详情。`);
      setShowAddModal(false);
      setSelectedSupplierIdForModal(existing.id);
      return;
    }

    const created = addSupplier({
      name: trimmedName,
      categoryId: newSupCatId,
    });

    setShowAddModal(false);
    // Immediately open the details editor sheet for this newly registered supplier so they can freely extend contacts, custom info, or document notes!
    setSelectedSupplierIdForModal(created.id);
  };

  // Delete supplier with detailed relationship impact warning
  const handleDeleteSupplier = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // Avoid triggering open modal on card click

    const associatedProjCount = projects.filter(p => 
      p.inquiries?.some(inq => inq.supplierId === id)
    ).length;

    const associatedContCount = contracts.filter(c => 
      c.supplierId === id
    ).length;

    let warningMessage = `您确定要删除供应商「${name}」吗？\n\n`;
    
    if (associatedProjCount > 0 || associatedContCount > 0) {
      warningMessage += `⚠️ 影响范围警告 (统一关系数据库校验)：\n`;
      if (associatedProjCount > 0) {
        warningMessage += `• 该供应商正参与 ${associatedProjCount} 个前置需求工作的询报价，删除将自动解除关联；\n`;
      }
      if (associatedContCount > 0) {
        warningMessage += `• 该供应商已绑定 ${associatedContCount} 个后置工作合同，删除将自动清空其主供应商标识；\n`;
      }
      warningMessage += `\n此删除操作不可逆，建议保留并在备忘录中备注「停止合作」。是否坚持删除？`;
    } else {
      warningMessage += `此操作不可逆，是否确认删除该供应商？`;
    }

    if (window.confirm(warningMessage)) {
      deleteSupplier(id);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-150px)] lg:h-[calc(100vh-160px)] flex flex-col space-y-4 min-h-0 overflow-hidden pb-1">
      
      {/* Upper Registry Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Building2 className="text-blue-500" size={22} />
            <span>供应商</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            供应商、前置需求询比价、后置工作合同在此形成统一的关联追踪网络。支持自由扩展属性、备忘录记录，数据多模块实时同步更新。
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all hover:translate-y-[-1px]"
        >
          <Plus size={14} />
          <span>登记新供应商</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch flex-1 min-h-0">
        
        {/* Left Column: Category Sidebar */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col min-h-0 h-full shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Tag size={12} className="text-blue-500" />
              <span>分类管理</span>
            </span>
          </div>

          {/* New Category Input Form */}
          <form onSubmit={handleAddCategory} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="新增分类名称..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full pl-2.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-medium"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1 text-blue-500 hover:text-blue-700 cursor-pointer p-0.5"
                title="新增分类"
              >
                <FolderPlus size={14} />
              </button>
            </div>
          </form>

          {/* Categories List */}
          <div className="space-y-1 overflow-y-auto flex-1 pr-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCatId('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left ${
                selectedCatId === 'all'
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>全部供应商</span>
              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono text-[9px]">{suppliers.length}</span>
            </button>

            {supplierCategories.map(cat => {
              const catCount = suppliers.filter(s => s.categoryId === cat.id).length;
              const isEditing = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCatId === cat.id && !isEditing
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center space-x-1 w-full" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSaveEditCat}
                        className="text-emerald-600 hover:text-emerald-700 font-bold px-1 text-[11px]"
                      >
                        存
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="text-slate-400 hover:text-slate-600 px-1 text-[11px]"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedCatId(cat.id)}
                        className="flex-1 text-left truncate cursor-pointer py-0.5"
                      >
                        {cat.name}
                      </button>
                      <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleStartEditCat(cat);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded cursor-pointer"
                          title="编辑分类"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDeleteCat(cat.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          title="删除分类"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono text-[9px] group-hover:hidden">{catCount}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Suppliers Master List */}
        <div className="lg:col-span-3 space-y-4 h-full flex flex-col min-h-0">
          
          {/* Top Search Filter and Metrics */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center flex-shrink-0">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <input
                type="text"
                placeholder="搜索公司名称、备忘录 notes、联系人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-medium"
              />
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={12} />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-semibold px-1"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter description count */}
            <div className="text-slate-500 font-mono text-[10px] whitespace-nowrap">
              检索到 <span className="text-blue-600 font-bold">{filteredSuppliers.length}</span> 家供应商
              {selectedCatId !== 'all' && ' (已过滤分类)'}
            </div>
          </div>

          {/* Supplier Cards Grid - High visual hierarchy & minimal info */}
          {filteredSuppliers.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center text-slate-400 shadow-2xs flex-1 flex flex-col justify-center">
              <Building2 className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-sm font-semibold">暂无符合条件的供应商</p>
              <p className="text-xs text-slate-400 mt-1">您可以通过上方“登记新供应商”按钮为该分类增加实体供应商。</p>
            </div>
          ) : (
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto pr-2 scrollbar-thin pb-2"
              style={{
                scrollbarWidth: 'thin',
                scrollBehavior: 'smooth'
              }}
            >
              {filteredSuppliers.map(sup => {
                const categoryName = supplierCategories.find(c => c.id === sup.categoryId)?.name || '未分类';
                
                // Track associated metrics
                const projCount = projects.filter(p => p.inquiries?.some(inq => inq.supplierId === sup.id)).length;
                const contCount = contracts.filter(c => c.supplierId === sup.id).length;

                return (
                  <div
                    key={sup.id}
                    onClick={() => setSelectedSupplierIdForModal(sup.id)}
                    className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs hover:shadow-md hover:border-blue-500 hover:translate-y-[-1px] transition-all cursor-pointer flex flex-col justify-between group h-36"
                    id={`sup-card-${sup.id}`}
                  >
                    <div>
                      {/* Name & Action Menu */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-800 text-sm tracking-tight truncate group-hover:text-blue-600 transition-colors" title={sup.name}>
                            {sup.name}
                          </h3>
                          <span className="inline-block bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.2 rounded-sm mt-1">
                            {categoryName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 bg-slate-50 border border-slate-100 rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleDeleteSupplier(e, sup.id, sup.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="删除"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Integrated mini relationship tag in card bottom */}
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center space-x-2">
                        {contCount > 0 ? (
                          <span className="bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.2 rounded">
                            合作合同: {contCount}
                          </span>
                        ) : (
                          <span className="text-slate-300">无合作记录</span>
                        )}
                      </div>
                      
                      <span className="text-blue-500 font-semibold group-hover:underline flex items-center space-x-0.5">
                        <span>详情页</span>
                        <ExternalLink size={9} />
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Quick Registration Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-fade-in">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                登记新供应商 (快速初始化)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier}>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">公司/供应商名称 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none focus:border-blue-500 font-semibold"
                    placeholder="请输入完整的企业工商名称..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">所属行业分类 <span className="text-rose-500">*</span></label>
                  <select
                    value={newSupCatId}
                    onChange={(e) => setNewSupCatId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
                  >
                    {supplierCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs bg-white hover:bg-slate-50 text-slate-600 font-medium rounded-lg border border-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  确认并完善详情
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Full-Feature Supplier Detail Sheet Modal (备忘录/无限联系人/自定义字段/双向关联可追溯) */}
      {selectedSupplierIdForModal && (
        <SupplierDetailsModal
          supplierId={selectedSupplierIdForModal}
          onClose={() => setSelectedSupplierIdForModal(null)}
          onOpenProject={(id) => {
            setTraceItemId(id);
            setTraceItemType('project');
          }}
          onOpenContract={(id) => {
            setTraceItemId(id);
            setTraceItemType('contract');
          }}
        />
      )}

      {/* Trace Item Drawer overlay from Supplier connections */}
      {traceItemId && traceItemType && (
        <ItemDetailsModal
          itemId={traceItemId}
          type={traceItemType}
          onClose={() => {
            setTraceItemId(null);
            setTraceItemType(null);
          }}
          onItemIdChange={(id) => setTraceItemId(id)}
        />
      )}

    </div>
  );
};
