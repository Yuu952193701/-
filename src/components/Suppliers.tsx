import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { Supplier, SupplierCategory } from '../types';
import { Plus, Edit2, Trash2, FolderPlus, Search, User, Phone, Mail, Building2, Tag, X, FileText } from 'lucide-react';

export const Suppliers: React.FC = () => {
  const {
    suppliers,
    supplierCategories,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierCategory,
    updateSupplierCategory,
    deleteSupplierCategory,
  } = useAppState();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');

  // New/Edit Category States
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // New/Edit Supplier States
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState('');
  const [supCatId, setSupCatId] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supRemark, setSupRemark] = useState('');

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.remark || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contact || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    
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
    if (window.confirm('确定要删除该分类吗？关联的供应商将保持原状态。')) {
      deleteSupplierCategory(catId);
      if (selectedCatId === catId) {
        setSelectedCatId('all');
      }
    }
  };

  // Handle supplier management
  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setSupName('');
    setSupCatId(supplierCategories[0]?.id || '');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupRemark('');
    setShowSupplierModal(true);
  };

  const handleOpenEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupName(sup.name);
    setSupCatId(sup.categoryId);
    setSupContact(sup.contact || '');
    setSupPhone(sup.phone || '');
    setSupEmail(sup.email || '');
    setSupRemark(sup.remark || '');
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      alert('请输入供应商名称');
      return;
    }

    const supplierData = {
      name: supName.trim(),
      categoryId: supCatId,
      contact: supContact.trim() || undefined,
      phone: supPhone.trim() || undefined,
      email: supEmail.trim() || undefined,
      remark: supRemark.trim() || undefined,
    };

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierData);
    } else {
      addSupplier(supplierData);
    }

    setShowSupplierModal(false);
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    if (window.confirm(`确定要删除供应商「${name}」吗？该删除不会影响历史已生成的合同。`)) {
      deleteSupplier(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Registry Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Building2 className="text-blue-500" size={22} />
            <span>供应商管理中心</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            维护采购询价相关的合作商、供应商主数据。可在此进行供应商资质、分类管理，与前置需求端询价矩阵无缝打通。
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Category Sidebar */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-xl p-4 space-y-4 shadow-2xs">
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
          <div className="space-y-1">
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
                          onClick={() => handleStartEditCat(cat)}
                          className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="编辑分类"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          onClick={() => handleDeleteCat(cat.id)}
                          className="p-0.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="删除分类"
                        >
                          <Trash2 size={10} />
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
        <div className="lg:col-span-3 space-y-4">
          
          {/* Top Search Filter and Metrics */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <input
                type="text"
                placeholder="搜索供应商名称、联系人、电话、备注描述..."
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

          {/* Supplier Cards Grid */}
          {filteredSuppliers.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center text-slate-400 shadow-2xs">
              <Building2 className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-sm font-semibold">暂无符合条件的供应商</p>
              <p className="text-xs text-slate-400 mt-1">您可以通过上方“登记新供应商”按钮为该分类增加实体供应商。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuppliers.map(sup => {
                const categoryName = supplierCategories.find(c => c.id === sup.categoryId)?.name || '未分类';

                return (
                  <div
                    key={sup.id}
                    className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      
                      {/* Name & Action Menu */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-800 text-sm tracking-tight truncate max-w-[200px]" title={sup.name}>
                            {sup.name}
                          </h3>
                          <span className="inline-block bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.2 rounded-sm mt-1">
                            {categoryName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 bg-slate-50 border border-slate-100 rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(sup)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                            title="修改"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="删除"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Contact Channels */}
                      <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                        <div className="flex items-center space-x-2">
                          <User size={12} className="text-slate-400" />
                          <span>联系人: <span className="text-slate-800">{sup.contact || '--'}</span></span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone size={12} className="text-slate-400" />
                          <span>电话: <span className="text-slate-800 font-mono">{sup.phone || '--'}</span></span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail size={12} className="text-slate-400" />
                          <span>邮箱: <span className="text-slate-800 font-mono">{sup.email || '--'}</span></span>
                        </div>
                      </div>

                      {/* Remark details */}
                      {sup.remark && (
                        <div className="bg-slate-50 border border-slate-100/60 rounded-lg p-2.5 text-[11px] text-slate-500 leading-relaxed flex items-start space-x-1.5">
                          <FileText size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2" title={sup.remark}>{sup.remark}</span>
                        </div>
                      )}

                    </div>

                    <div className="border-t border-slate-100 mt-4 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>已注册</span>
                      <span>{new Date(sup.createdAt).toLocaleDateString()}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Slide-over Form Modal for Adding / Editing Suppliers */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-fade-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingSupplier ? '编辑供应商信息' : '登记新供应商商企'}
              </h3>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveSupplier}>
              <div className="p-6 space-y-4">
                
                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">供应商名称 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none focus:border-blue-500 font-medium"
                    placeholder="例如: 上海港机油服务总公司"
                  />
                </div>

                {/* Category Selector */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">所属行业分类 <span className="text-rose-500">*</span></label>
                  <select
                    value={supCatId}
                    onChange={(e) => setSupCatId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {supplierCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Contacts grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500">业务联系人</label>
                    <input
                      type="text"
                      value={supContact}
                      onChange={(e) => setSupContact(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none focus:border-blue-500 font-medium"
                      placeholder="张总"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500">联系电话</label>
                    <input
                      type="text"
                      value={supPhone}
                      onChange={(e) => setSupPhone(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none focus:border-blue-500 font-mono font-medium"
                      placeholder="139-0000-0000"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">商务邮箱</label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none focus:border-blue-500 font-mono font-medium"
                    placeholder="sales@example.com"
                  />
                </div>

                {/* Remark Text area */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">详细资质及经营范围备注</label>
                  <textarea
                    rows={3}
                    value={supRemark}
                    onChange={(e) => setSupRemark(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none focus:border-blue-500 font-medium"
                    placeholder="例如：主营上海港、太仓港燃润油物料保供，资质齐全，结算账期3个月..."
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 text-xs bg-white hover:bg-slate-50 text-slate-600 font-medium rounded-lg border border-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  确认保存
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
