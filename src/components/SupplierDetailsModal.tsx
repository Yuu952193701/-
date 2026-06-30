import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppContext';
import { Supplier, SupplierContact, SupplierCustomAttr } from '../types';
import { X, Plus, Trash2, User, Phone, Mail, Building, Briefcase, Tag, FileText, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react';

interface SupplierDetailsModalProps {
  supplierId: string;
  onClose: () => void;
  onOpenProject?: (id: string) => void;
  onOpenContract?: (id: string) => void;
}

export const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({
  supplierId,
  onClose,
  onOpenProject,
  onOpenContract,
}) => {
  const {
    suppliers,
    supplierCategories,
    updateSupplier,
    projects,
    contracts,
  } = useAppState();

  const supplier = suppliers.find(s => s.id === supplierId);

  // Local editing states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [customAttributes, setCustomAttributes] = useState<SupplierCustomAttr[]>([]);
  const [notes, setNotes] = useState('');

  // Initial load
  useEffect(() => {
    if (supplier) {
      setName(supplier.name || '');
      setCategoryId(supplier.categoryId || '');
      setContacts(supplier.contacts || []);
      setCustomAttributes(supplier.customAttributes || []);
      setNotes(supplier.notes || supplier.remark || '');
    }
  }, [supplierId, supplier]);

  if (!supplier) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 text-center shadow-lg max-w-sm w-full">
          <p className="text-slate-500 text-sm">该供应商数据未找到</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-100 rounded text-xs hover:bg-slate-200">
            关闭
          </button>
        </div>
      </div>
    );
  }

  // Auto-save changes helper
  const handleSave = (updatedFields: Partial<Supplier>) => {
    updateSupplier(supplier.id, updatedFields);
  };

  // Contacts manager
  const handleAddContact = () => {
    const newContact: SupplierContact = {
      id: `contact-${Date.now()}`,
      name: '',
      phone: '',
      email: '',
      role: '',
    };
    const nextContacts = [...contacts, newContact];
    setContacts(nextContacts);
    
    // Sync to legacy fields for backward compatibility
    const updates: Partial<Supplier> = { contacts: nextContacts };
    if (nextContacts.length > 0) {
      updates.contact = nextContacts[0].name || undefined;
      updates.phone = nextContacts[0].phone || undefined;
      updates.email = nextContacts[0].email || undefined;
    }
    handleSave(updates);
  };

  const handleUpdateContact = (id: string, field: keyof SupplierContact, value: string) => {
    const nextContacts = contacts.map(c => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setContacts(nextContacts);

    const updates: Partial<Supplier> = { contacts: nextContacts };
    if (nextContacts.length > 0) {
      // Sync first contact as legacy info
      updates.contact = nextContacts[0].name || undefined;
      updates.phone = nextContacts[0].phone || undefined;
      updates.email = nextContacts[0].email || undefined;
    }
    handleSave(updates);
  };

  const handleRemoveContact = (id: string) => {
    const nextContacts = contacts.filter(c => c.id !== id);
    setContacts(nextContacts);

    const updates: Partial<Supplier> = { contacts: nextContacts };
    if (nextContacts.length > 0) {
      updates.contact = nextContacts[0].name || undefined;
      updates.phone = nextContacts[0].phone || undefined;
      updates.email = nextContacts[0].email || undefined;
    } else {
      updates.contact = undefined;
      updates.phone = undefined;
      updates.email = undefined;
    }
    handleSave(updates);
  };

  // Custom attributes manager
  const handleAddAttr = () => {
    const newAttr: SupplierCustomAttr = {
      id: `attr-${Date.now()}`,
      key: '',
      value: '',
    };
    const nextAttrs = [...customAttributes, newAttr];
    setCustomAttributes(nextAttrs);
    handleSave({ customAttributes: nextAttrs });
  };

  const handleUpdateAttr = (id: string, field: 'key' | 'value', value: string) => {
    const nextAttrs = customAttributes.map(a => {
      if (a.id === id) {
        return { ...a, [field]: value };
      }
      return a;
    });
    setCustomAttributes(nextAttrs);
    handleSave({ customAttributes: nextAttrs });
  };

  const handleRemoveAttr = (id: string) => {
    const nextAttrs = customAttributes.filter(a => a.id !== id);
    setCustomAttributes(nextAttrs);
    handleSave({ customAttributes: nextAttrs });
  };

  // Find relationships
  const associatedProjects = projects.filter(p => 
    p.inquiries?.some(inq => inq.supplierId === supplier.id)
  );

  const associatedContracts = contracts.filter(c => 
    c.supplierId === supplier.id
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fade-in">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Building size={20} />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  handleSave({ name: e.target.value });
                }}
                className="text-lg font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-full py-0.5 truncate"
                placeholder="输入公司名称..."
              />
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-[10px] text-slate-400 font-medium">所属分类:</span>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    handleSave({ categoryId: e.target.value });
                  }}
                  className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded border border-transparent hover:border-slate-300 focus:outline-none focus:bg-white font-semibold cursor-pointer"
                >
                  {supplierCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="关闭详情"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content - Split layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Panel: Contacts, Attributes & Document Notes Editor (60%) */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 border-b md:border-b-0 md:border-r border-slate-200/60 scrollbar-thin">
            
            {/* 1. Contacts Management Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <User size={14} className="text-blue-500" />
                  <span>业务联络人清单 (不限数量)</span>
                </h4>
                <button
                  type="button"
                  onClick={handleAddContact}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer"
                >
                  <Plus size={14} />
                  <span>添加联系人</span>
                </button>
              </div>

              {contacts.length === 0 ? (
                <div 
                  onClick={handleAddContact}
                  className="text-center py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:text-blue-600 hover:border-blue-400 cursor-pointer transition-all"
                >
                  暂无联系人。点击“添加联系人”录入。
                </div>
              ) : (
                <div className="space-y-2.5">
                  {contacts.map((contact, idx) => (
                    <div 
                      key={contact.id} 
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(contact.id)}
                        className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-rose-50"
                        title="删除联系人"
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Line 1: Name & Role */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded px-2 py-1">
                          <User size={12} className="text-slate-400" />
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => handleUpdateContact(contact.id, 'name', e.target.value)}
                            placeholder={`联系人姓名 ${idx === 0 ? '(主联系人)' : ''}`}
                            className="w-full text-xs font-medium focus:outline-none bg-transparent"
                          />
                        </div>
                        <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded px-2 py-1">
                          <Briefcase size={12} className="text-slate-400" />
                          <input
                            type="text"
                            value={contact.role || ''}
                            onChange={(e) => handleUpdateContact(contact.id, 'role', e.target.value)}
                            placeholder="职务/职责 (如：销售总监)"
                            className="w-full text-xs focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>

                      {/* Line 2: Phone & Email */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded px-2 py-1">
                          <Phone size={12} className="text-slate-400" />
                          <input
                            type="text"
                            value={contact.phone || ''}
                            onChange={(e) => handleUpdateContact(contact.id, 'phone', e.target.value)}
                            placeholder="电话号码"
                            className="w-full text-xs font-mono focus:outline-none bg-transparent"
                          />
                        </div>
                        <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded px-2 py-1">
                          <Mail size={12} className="text-slate-400" />
                          <input
                            type="email"
                            value={contact.email || ''}
                            onChange={(e) => handleUpdateContact(contact.id, 'email', e.target.value)}
                            placeholder="电子邮箱"
                            className="w-full text-xs font-mono focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Custom Attributes Key-Value Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <Tag size={14} className="text-emerald-500" />
                  <span>自定义属性 & 企业资质扩展 (无结构限制)</span>
                </h4>
                <button
                  type="button"
                  onClick={handleAddAttr}
                  className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-800 text-xs font-semibold cursor-pointer"
                >
                  <Plus size={14} />
                  <span>添加自定义字段</span>
                </button>
              </div>

              {customAttributes.length === 0 ? (
                <div 
                  onClick={handleAddAttr}
                  className="text-center py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:text-emerald-600 hover:border-emerald-400 cursor-pointer transition-all"
                >
                  暂无自定义字段。点击“添加自定义字段”可以记录如：开户行、账号、营业执照、公司地址等。
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {customAttributes.map((attr) => (
                    <div 
                      key={attr.id} 
                      className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-2 relative group"
                    >
                      <input
                        type="text"
                        value={attr.key}
                        onChange={(e) => handleUpdateAttr(attr.id, 'key', e.target.value)}
                        placeholder="字段名 (如：开户行)"
                        className="w-1/3 bg-white border border-slate-200 text-xs px-2 py-1 rounded font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => handleUpdateAttr(attr.id, 'value', e.target.value)}
                        placeholder="值 (如：招商银行...)"
                        className="flex-1 bg-white border border-slate-200 text-xs px-2 py-1 rounded font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttr(attr.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-rose-50"
                        title="删除该字段"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Free Memo / Notebook (备忘录/文档编辑器) */}
            <div className="space-y-2 flex flex-col h-[280px]">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5 flex-shrink-0">
                <FileText size={14} className="text-amber-500" />
                <span>✍️ 供应商备忘录 & 合作档案 (文档编辑器模式)</span>
              </h4>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  handleSave({ notes: e.target.value, remark: e.target.value });
                }}
                className="flex-1 w-full p-4 bg-amber-50/20 text-slate-700 border border-amber-200/50 rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 font-medium resize-none shadow-3xs"
                placeholder="在此像写备忘录一样，自由记录该供应商的资质细节、核心物料供应优势、历史交易谈判备忘、对账偏好等多维度非结构化数据..."
              />
            </div>

          </div>

          {/* Right Panel: CRM Cooperative Records & Linkage Trace (40%) */}
          <div className="w-full md:w-[40%] bg-slate-50/80 p-6 overflow-y-auto space-y-6 flex flex-col scrollbar-thin">
            
            {/* Associated Pre-Work / Demand Projects */}
            <div className="space-y-3 flex flex-col flex-1 min-h-[220px]">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <ShieldCheck size={14} className="text-teal-600" />
                  <span>关联前置需求 ({associatedProjects.length})</span>
                </span>
                <HelpCircle size={12} className="text-slate-400" title="在此供应商参与了询比价工作的需求项目" />
              </h4>

              {associatedProjects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-xl bg-white text-center text-slate-400">
                  <span className="text-[10px] font-medium">暂无关联的前置采购需求工作</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {associatedProjects.map(p => {
                    const inquiry = p.inquiries?.find(i => i.supplierId === supplier.id);
                    const isQuoted = inquiry?.hasQuoted || false;

                    return (
                      <div 
                        key={p.id}
                        className="bg-white border border-slate-200 hover:border-blue-300 rounded-lg p-3 shadow-3xs transition-all duration-150 group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-[9px] text-slate-400 block">{p.code}</span>
                            <span className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</span>
                            <span className="text-[10px] text-slate-500 mt-1 block">🚢 {p.ship} | 步骤: {p.status}</span>
                          </div>
                          
                          {/* Action & Status Badges */}
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isQuoted ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {isQuoted ? '已报价' : '未报价'}
                            </span>
                            
                            {onOpenProject && (
                              <button
                                onClick={() => onOpenProject(p.id)}
                                className="text-blue-600 hover:text-blue-800 text-[10px] font-semibold flex items-center space-x-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <span>跳转</span>
                                <ExternalLink size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Associated Post-Work / Contracts (Cooperative History) */}
            <div className="space-y-3 flex flex-col flex-1 min-h-[220px]">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <FileText size={14} className="text-indigo-600" />
                  <span>历史合作合同记录 ({associatedContracts.length})</span>
                </span>
                <span className="text-[10px] font-mono font-extrabold text-indigo-600">小型ERP档案</span>
              </h4>

              {associatedContracts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-xl bg-white text-center text-slate-400">
                  <span className="text-[10px] font-medium">暂无已订立的合作合同记录</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {associatedContracts.map(c => {
                    return (
                      <div 
                        key={c.id}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded-lg p-3 shadow-3xs transition-all duration-150 group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-[9px] text-slate-400 block">{c.code}</span>
                            <span className="text-xs font-bold text-slate-800 line-clamp-1">{c.name}</span>
                            
                            {/* Amount & Ship badges */}
                            <div className="flex items-center space-x-1.5 mt-1">
                              <span className="text-[10px] text-slate-500">🚢 {c.ship}</span>
                              {c.amount && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  {c.amount}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Workflow state step badge */}
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="inline-flex px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                              {c.status}
                            </span>
                            
                            {onOpenContract && (
                              <button
                                onClick={() => onOpenContract(c.id)}
                                className="text-indigo-600 hover:text-indigo-800 text-[10px] font-semibold flex items-center space-x-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <span>跳转</span>
                                <ExternalLink size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>注册时间: {new Date(supplier.createdAt).toLocaleString()}</span>
          <span>双向追踪一致性保护激活</span>
        </div>

      </div>
    </div>
  );
};
