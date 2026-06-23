import React, { useState, useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import { KnowledgeCategory, KnowledgePage, DemandProject, Contract, SHIPS } from '../types';
import { 
  FolderPlus, 
  FileText, 
  Plus, 
  Search, 
  Tag, 
  Trash2, 
  Edit3, 
  Folder, 
  FolderOpen, 
  SearchX, 
  ChevronRight, 
  ChevronDown, 
  ExternalLink,
  BookOpen, 
  Check, 
  X, 
  Move, 
  CornerDownRight, 
  FileEdit,
  ArrowRight,
  Sparkles,
  Link2
} from 'lucide-react';

export const KnowledgeLibrary: React.FC = () => {
  const {
    projects,
    contracts,
    knowledgeCategories,
    knowledgePages,
    addKnowledgeCategory,
    renameKnowledgeCategory,
    deleteKnowledgeCategory,
    moveKnowledgeCategory,
    addKnowledgePage,
    updateKnowledgePage,
    deleteKnowledgePage,
    moveKnowledgePage
  } = useAppState();

  // State Management
  const [selectedPageId, setSelectedPageId] = useState<string | null>(() => {
    return knowledgePages[0]?.id || null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // UI States for Category interactions
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [relocatingCategoryId, setRelocatingCategoryId] = useState<string | null>(null);

  // Active page state in Read vs Edit
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  
  // Future Linkage states on active editing page
  const [associatedProjectId, setAssociatedProjectId] = useState<string>('');
  const [associatedContractId, setAssociatedContractId] = useState<string>('');
  const [associatedSupplierName, setAssociatedSupplierName] = useState('');
  const [associatedShip, setAssociatedShip] = useState('');

  // Folder collapse states
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Active Page entity helper
  const activePage = useMemo(() => {
    return knowledgePages.find(p => p.id === selectedPageId) || null;
  }, [knowledgePages, selectedPageId]);

  // Launching edit mode loader
  const handleStartEdit = (page: KnowledgePage) => {
    setEditTitle(page.title);
    setEditContent(page.content);
    setEditTagsInput(page.tags.join(', '));
    setEditCategoryId(page.categoryId);
    setAssociatedProjectId(page.associatedProjectId || '');
    setAssociatedContractId(page.associatedContractId || '');
    setAssociatedSupplierName(page.associatedSupplierName || '');
    setAssociatedShip(page.associatedShip || '');
    setIsEditingPage(true);
  };

  // Saving edited page
  const handleSavePage = () => {
    if (!selectedPageId) return;
    const tagsArray = editTagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    updateKnowledgePage(selectedPageId, {
      title: editTitle.trim() || '无标题页面',
      content: editContent,
      tags: tagsArray,
      categoryId: editCategoryId,
      associatedProjectId: associatedProjectId || undefined,
      associatedContractId: associatedContractId || undefined,
      associatedSupplierName: associatedSupplierName.trim() || undefined,
      associatedShip: associatedShip || undefined,
    });
    setIsEditingPage(false);
  };

  // Helper to expand all parent folders of a category
  const expandParentCategories = (catId: string) => {
    const toExpand: { [key: string]: boolean } = {};
    let currentId: string | null = catId;
    while (currentId) {
      const cat = knowledgeCategories.find(c => c.id === currentId);
      if (cat) {
        toExpand[cat.id] = false; // false means NOT collapsed (i.e. expanded)
        currentId = cat.parentId;
      } else {
        break;
      }
    }
    setCollapsedCategories(prev => ({
      ...prev,
      ...toExpand
    }));
  };

  // Launch pre-filled Page creation
  const handleCreateNewPage = (categoryId: string | null = null) => {
    const parentFolder = knowledgeCategories.find(c => c.id === categoryId);
    const titlePlaceholder = `${parentFolder ? parentFolder.name + '的' : ''}新页面`;
    
    // Auto-create page structure and select/edit it immediately
    const newPage = addKnowledgePage({
      title: titlePlaceholder,
      categoryId: categoryId,
      content: `# ${titlePlaceholder}\n\n在这里写下新知识与备注...\n`,
      tags: categoryId === 'cat-1' ? ['供应商'] : categoryId === 'cat-2' ? ['付款'] : []
    });

    if (newPage) {
      setSelectedPageId(newPage.id);
      handleStartEdit(newPage);
      if (categoryId) {
        expandParentCategories(categoryId);
      }
    }
  };

  // Action helpers for categories
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const newCat = addKnowledgeCategory(newCategoryName, newCategoryParentId);
    if (newCat) {
      setSelectedCategoryId(newCat.id);
      if (newCat.parentId) {
        expandParentCategories(newCat.parentId);
      }
    }
    setIsAddingCategory(false);
    setNewCategoryName('');
    setNewCategoryParentId(null);
  };

  const handleRenameCategorySubmit = (id: string) => {
    if (!editingCategoryName.trim()) return;
    renameKnowledgeCategory(id, editingCategoryName);
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Render HTML / Markdown Preview engine
  const renderMarkdownPreview = (text: string) => {
    if (!text) return <p className="text-slate-400 text-xs italic">正文为空</p>;
    
    const lines = text.split('\n');
    let inList = false;
    let listItems: string[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const elements: React.ReactNode[] = [];

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1 text-slate-700 text-xs text-left leading-relaxed">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }}></li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushTable = (key: string) => {
      if (tableHeaders.length > 0 || tableRows.length > 0) {
        elements.push(
          <div key={`table-wrapper-${key}`} className="overflow-x-auto my-3 border border-slate-200 rounded">
            <table className="w-full text-xs text-left border-collapse bg-white">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="px-3 py-2 font-semibold text-slate-800 border-r border-slate-100 last:border-0" dangerouslySetInnerHTML={{ __html: inlineFormat(h) }}></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-slate-600 border-r border-slate-100 last:border-0" dangerouslySetInnerHTML={{ __html: inlineFormat(cell) }}></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeaders = [];
        tableRows = [];
        inTable = false;
      }
    };

    const inlineFormat = (raw: string) => {
      // Escape HTML safely
      let formatted = raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Bolding: **text**
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Code tags: `code`
      formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.2 rounded font-mono text-[11px] text-pink-600 font-semibold">$1</code>');
      
      // Hyperlinks: [text](url) -> custom target to open external link
      formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-medium hover:underline inline-flex items-center gap-0.5">$1</a>');

      return formatted;
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();

      // Table line checking: | col 1 | col 2 |
      if (trimmed.startsWith('|')) {
        flushList(`line-${lineIdx}`);
        inTable = true;
        // Divide into cell fragments
        const cells = line.split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        // Skip markdown separator alignment rows: |:---|---:| or |---|
        const isSeparator = cells.every(c => c.match(/^:?-+:?$/));
        if (isSeparator) {
          return;
        }

        if (tableHeaders.length === 0) {
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        return;
      } else {
        if (inTable) {
          flushTable(`line-${lineIdx}`);
        }
      }

      // Headers: # Title, ## Subtitle, ### Subsection
      if (trimmed.startsWith('# ')) {
        flushList(`line-${lineIdx}`);
        elements.push(
          <h1 key={lineIdx} className="text-lg md:text-xl font-bold text-slate-900 border-b border-slate-100 pb-1 mt-4 mb-2 first:mt-0" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.substring(2)) }}></h1>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList(`line-${lineIdx}`);
        elements.push(
          <h2 key={lineIdx} className="text-sm font-semibold text-slate-800 mt-3.5 mb-1" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.substring(3)) }}></h2>
        );
      } else if (trimmed.startsWith('### ')) {
        flushList(`line-${lineIdx}`);
        elements.push(
          <h3 key={lineIdx} className="text-xs font-semibold text-slate-700 uppercase mt-3 mb-1 tracking-wider" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.substring(4)) }}></h3>
        );
      } 
      // Bullet list item: * text, - text
      else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        inList = true;
        listItems.push(trimmed.substring(2));
      } 
      // Number list item: 1. text
      else if (/^\d+\.\s/.test(trimmed)) {
        flushList(`line-${lineIdx}`);
        const textContent = trimmed.replace(/^\d+\.\s/, '');
        elements.push(
          <div key={lineIdx} className="flex items-start space-x-2 my-1 text-slate-700 text-xs">
            <span className="font-mono text-[10px] text-slate-400 bg-slate-100/80 px-1 rounded inline-flex items-center justify-center min-w-4 h-4 mt-0.5 font-bold">
              {trimmed.match(/^\d+/)?.[0]}
            </span>
            <span className="flex-1 text-left leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(textContent) }}></span>
          </div>
        );
      }
      // Empty line / spacer
      else if (trimmed === '') {
        flushList(`line-${lineIdx}`);
        elements.push(<div key={lineIdx} className="h-2"></div>);
      } 
      // Paragraph line
      else {
        flushList(`line-${lineIdx}`);
        elements.push(
          <p key={lineIdx} className="text-slate-600 text-xs text-left leading-relaxed my-1.5" dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}></p>
        );
      }
    });

    // Final flushes
    flushList('final');
    flushTable('final');

    return elements;
  };

  // Helper formatting injectors for markdown buttons
  const injectFormat = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('md-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const replacement = prefix + (selectedText || '内容占位') + suffix;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    setEditContent(newValue);
    
    // Resume focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText || '内容占位').length);
    }, 50);
  };

  const handlePasteTableBoilerplate = () => {
    const tableTemplate = `\n| 指标/字段 | 规格/明细说明 | 备注/要求 |\n| --- | --- | --- |\n| 公司名称 | 某某港航代办处 | 手续特设 |\n| 对接账期 | 对账核销 30 天 | 附发票款项 |\n| 收款行号 | 建行 6222... | 付款备注 |\n`;
    injectFormat(tableTemplate);
  };

  // Recursively fetch children category ids to prevent invalid movements
  const getSubCategoryIds = (catId: string): string[] => {
    const directChildren = knowledgeCategories.filter(c => c.parentId === catId);
    let ids = directChildren.map(c => c.id);
    directChildren.forEach(child => {
      ids = [...ids, ...getSubCategoryIds(child.id)];
    });
    return ids;
  };

  // Flat structured Category tree with parent-child structure
  const buildTree = (parentId: string | null) => {
    return knowledgeCategories.filter(c => c.parentId === parentId);
  };

  // Generate a flat list of nested options with labels showing indentation for select picker
  const getCategoryOptions = () => {
    const list: { id: string; name: string; indentedName: string }[] = [];
    
    const recurse = (parentId: string | null, depth: number) => {
      const children = knowledgeCategories.filter(c => c.parentId === parentId);
      children.forEach(c => {
        const prefix = '\u00A0\u00A0'.repeat(depth) + (depth > 0 ? '└─ ' : '');
        list.push({
          id: c.id,
          name: c.name,
          indentedName: `${prefix}📁 ${c.name}`
        });
        recurse(c.id, depth + 1);
      });
    };
    
    recurse(null, 0);
    return list;
  };

  // Search filter
  const filteredPages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    return knowledgePages.filter(p => {
      // 1. Match selected category folder (if set)
      if (selectedCategoryId !== null && p.categoryId !== selectedCategoryId) {
        return false;
      }
      
      // 2. Full text query match: Page Title, Body Content, and Tags list
      if (!query) return true;
      const titleMatch = p.title.toLowerCase().includes(query);
      const contentMatch = p.content.toLowerCase().includes(query);
      const tagsMatch = p.tags.some(t => t.toLowerCase().includes(query));
      
      return titleMatch || contentMatch || tagsMatch;
    });
  }, [knowledgePages, selectedCategoryId, searchQuery]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col md:flex-row h-[78vh] md:h-[82vh]">
      
      {/* 2-1 Left Sidebar Pane (Category Navigation and List) */}
      <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full flex-shrink-0">
        
        {/* Search header area */}
        <div className="p-3 border-b border-slate-200/80 bg-white flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 tracking-wider flex items-center space-x-1.5">
              <BookOpen size={13} className="text-blue-600" />
              <span>知识库资料分级</span>
            </h2>
            <button
              onClick={() => handleCreateNewPage(selectedCategoryId)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-0.8 text-[11px] font-semibold flex items-center space-x-0.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus size={11} className="stroke-[3]" />
              <span>记资料</span>
            </button>
          </div>

          {/* Page Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="全文检索标题、正文或自定义标签..."
              className="w-full bg-slate-50/80 border border-slate-200 rounded py-1 pl-7 pr-4 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-left placeholder:text-slate-400"
            />
            <Search size={11} className="absolute left-2.5 top-2.5 text-slate-400" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tree folders & actions */}
        <div className="p-2 bg-slate-100/50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="font-semibold px-1 text-slate-600">目录分类树状层级</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                // Default to selected folder if any, otherwise null
                setNewCategoryParentId(selectedCategoryId);
                setIsAddingCategory(true);
              }}
              title="新建目录分类"
              className="hover:text-blue-600 bg-white hover:bg-slate-200/50 px-1.5 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer text-[9px] font-bold flex items-center space-x-0.5"
            >
              <span>+ 加分类</span>
            </button>
          </div>
        </div>

        {/* Category adding block inline */}
        {isAddingCategory && (
          <form onSubmit={handleAddCategorySubmit} className="p-3 border-b border-slate-200 bg-slate-50/50 shadow-inner flex flex-col space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
              <span>📂 新建目录分类</span>
              <button 
                type="button" 
                onClick={() => setIsAddingCategory(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
            
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase">分类名称</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="名称, 如: 对账合同等"
                className="w-full bg-white border border-slate-300 rounded text-xs px-2 py-1 focus:outline-none focus:border-blue-500 font-sans"
                autoFocus
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase">层级归属 (所属父分类)</label>
              <select
                value={newCategoryParentId || ''}
                onChange={(e) => setNewCategoryParentId(e.target.value || null)}
                className="w-full bg-white border border-slate-300 rounded text-xs px-1.5 py-1 focus:outline-none focus:border-blue-500 font-sans"
              >
                <option value="">📁 [根目录] 作为一级分类</option>
                {getCategoryOptions().map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.indentedName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-1.5 pt-1">
              <button 
                type="button" 
                onClick={() => setIsAddingCategory(false)} 
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[10px] rounded px-2.5 py-1 cursor-pointer transition-colors"
              >
                取消
              </button>
              <button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded px-3 py-1 cursor-pointer transition-colors flex items-center space-x-1"
              >
                <Check size={11} />
                <span>创建分类</span>
              </button>
            </div>
          </form>
        )}

        {/* Scrollable Categories & Files Explorer Tree */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {searchQuery.trim() ? (
            // Search Active Mode: Flat List of matching pages
            <div className="space-y-1">
              <div className="p-1 px-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>🔍 全文搜索结果 ({filteredPages.length} 篇)</span>
              </div>
              <div className="space-y-0.5">
                {filteredPages.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-[11px]">
                    <SearchX size={15} className="mx-auto text-slate-300 mb-1" />
                    <span>无相应搜索结果</span>
                  </div>
                ) : (
                  filteredPages.map(page => {
                    const isSelected = selectedPageId === page.id;
                    const hasAssoc = page.associatedContractId || page.associatedProjectId || page.associatedSupplierName;
                    
                    return (
                      <button
                        key={page.id}
                        onClick={() => {
                          setSelectedPageId(page.id);
                          setIsEditingPage(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded text-[11px] font-medium transition-colors text-left cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600 text-white font-semibold' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 truncate max-w-[85%]">
                          <FileText size={11} className={isSelected ? 'text-white' : 'text-slate-400'} />
                          <span className="truncate">{page.title}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {hasAssoc && (
                            <div className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-blue-200' : 'bg-blue-500/80 animate-pulse'}`} />
                          )}
                          <span className={`text-[9px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {page.tags.length > 0 && `[${page.tags[0]}]`}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            // Default Mode: Windows Explorer Integrated Tree Layout
            <div className="space-y-1">
              {/* Loose/View All category buttons */}
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold text-left transition-colors text-slate-700 hover:bg-slate-200/40 cursor-pointer ${selectedCategoryId === null ? 'bg-white border border-slate-200/80 shadow-3xs text-blue-600' : ''}`}
              >
                <div className="flex items-center space-x-1.5">
                  <BookOpen size={12} className={selectedCategoryId === null ? 'text-blue-600' : 'text-slate-400'} />
                  <span>📚 全部门类 (不设限)</span>
                </div>
                <span className="bg-slate-200/70 text-slate-500 font-mono text-[9px] px-1.5 py-0.2 rounded font-bold">{knowledgePages.length}</span>
              </button>

              <div className="h-px bg-slate-200/50 my-1"></div>

              {/* Render category list tree recursively with nice nested indentation style */}
              <div className="space-y-0.5">
                {/* A. Top-level categories */}
                {buildTree(null).map(topCat => (
                  <CategoryNode 
                    key={topCat.id} 
                    node={topCat} 
                    depth={0} 
                    selectedCategoryId={selectedCategoryId}
                    setSelectedCategoryId={setSelectedCategoryId}
                    collapsedCategories={collapsedCategories}
                    toggleCategoryCollapse={toggleCategoryCollapse}
                    editingCategoryId={editingCategoryId}
                    setEditingCategoryId={setEditingCategoryId}
                    editingCategoryName={editingCategoryName}
                    setEditingCategoryName={setEditingCategoryName}
                    handleRenameCategorySubmit={handleRenameCategorySubmit}
                    deleteKnowledgeCategory={deleteKnowledgeCategory}
                    subCategoryIds={getSubCategoryIds(topCat.id)}
                    getSubCategoryIds={getSubCategoryIds}
                    knowledgeCategories={knowledgeCategories}
                    moveKnowledgeCategory={moveKnowledgeCategory}
                    relocatingCategoryId={relocatingCategoryId}
                    setRelocatingCategoryId={setRelocatingCategoryId}
                    pages={knowledgePages}
                    handleCreateNewPage={handleCreateNewPage}
                    setIsAddingCategory={setIsAddingCategory}
                    setNewCategoryParentId={setNewCategoryParentId}
                    selectedPageId={selectedPageId}
                    setSelectedPageId={setSelectedPageId}
                    setIsEditingPage={setIsEditingPage}
                    deleteKnowledgePage={deleteKnowledgePage}
                  />
                ))}

                {/* B. Top-level (root classified) files/pages */}
                {knowledgePages.filter(p => !p.categoryId).map(page => {
                  const isPageSelected = selectedPageId === page.id;
                  const hasAssoc = page.associatedContractId || page.associatedProjectId || page.associatedSupplierName;
                  return (
                    <div
                      key={page.id}
                      style={{ paddingLeft: '22px' }}
                      className={`group flex items-center justify-between rounded px-1.5 py-1 text-[11px] transition-colors cursor-pointer ${
                        isPageSelected
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-200/50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPageId(page.id);
                        setIsEditingPage(false);
                      }}
                    >
                      <div className="flex items-center space-x-1.5 truncate max-w-[80%]">
                        <FileText size={10} className={isPageSelected ? 'text-white' : 'text-slate-400'} />
                        <span className="truncate">{page.title}</span>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasAssoc && (
                          <div className={`h-1.5 w-1.5 rounded-full ${isPageSelected ? 'bg-blue-200' : 'bg-blue-500/80 animate-pulse'}`} />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('确定要删除本篇资料吗？此操作无法撤销。')) {
                              deleteKnowledgePage(page.id);
                              if (selectedPageId === page.id) {
                                setSelectedPageId(null);
                              }
                            }
                          }}
                          title="安全丢弃"
                          className={`p-0.5 rounded ${isPageSelected ? 'hover:bg-blue-700 text-blue-100' : 'hover:bg-slate-200 text-slate-400 hover:text-red-650'}`}
                        >
                          <Trash2 size={9} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {knowledgeCategories.length === 0 && knowledgePages.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-[11px]">
                    无自定义分类与资料页面
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 2-2 Right Document View workspace */}
      <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
        
        {activePage ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Header section with page metadata details */}
            <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-1.5">
                    <FileText size={14} className="text-blue-500" />
                    <span>{activePage.title}</span>
                  </h1>
                  
                  {/* Category breadcrumb */}
                  <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded">
                    📁 {knowledgeCategories.find(c => c.id === activePage.categoryId)?.name || '未归类根目录'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-medium">
                  <span>录入时间: {new Date(activePage.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>最近更新: {new Date(activePage.updatedAt).toLocaleString()}</span>
                  
                  {activePage.associatedShip && (
                    <>
                      <span>•</span>
                      <span className="text-cyan-600 bg-cyan-50 border border-cyan-100 px-1 py-0.2 rounded">⚓ 船只: {activePage.associatedShip}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions panel */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {!isEditingPage ? (
                  <>
                    <button
                      onClick={() => handleStartEdit(activePage)}
                      className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded px-2.5 py-1 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Edit3 size={11} />
                      <span>编辑正文</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('确定要删除本篇资料吗？此操作无法撤销。')) {
                          deleteKnowledgePage(activePage.id);
                          setSelectedPageId(knowledgePages[1]?.id || null);
                        }
                      }}
                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded px-2.5 py-1 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Trash2 size={11} />
                      <span>丢弃页面</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSavePage}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 rounded px-3 py-1 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Check size={12} className="stroke-[3]" />
                      <span>保存</span>
                    </button>
                    <button
                      onClick={() => setIsEditingPage(false)}
                      className="bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 rounded px-3 py-1 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      取消
                    </button>
                  </>
                )}
              </div>

            </div>

            {/* Document body pane: Read mode vs Edit mode */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              
              {/* Left pane: Active View/Edit content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 select-text">
                
                {isEditingPage ? (
                  // EDIT MODE
                  <div className="space-y-4 h-full flex flex-col">
                    
                    {/* Raw Text Title editing input */}
                    <div className="space-y-1 shrink-0">
                      <label className="text-[10px] font-bold uppercase text-slate-400">页面标题 (Title)</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="输入资料标题, 比如 [中国船级社认可标准]"
                        className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Category relocator option */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">所属分类目录</label>
                        <select
                          value={editCategoryId || ''}
                          onChange={(e) => setEditCategoryId(e.target.value || null)}
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 bg-white"
                        >
                          <option value="">📁 [根目录] / 未归类</option>
                          {knowledgeCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>📁 {cat.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Interactive Tags list */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">自定义标签 (逗号隔开)</label>
                        <input
                          type="text"
                          value={editTagsInput}
                          onChange={(e) => setEditTagsInput(e.target.value)}
                          placeholder="供应商, 重要, 鸿鹄01"
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* LIGHTWEIGHT FORMAT BAR TOOLBAR (highly helpful requested feature) */}
                    <div className="bg-slate-100 border border-slate-250 p-1.5 rounded flex flex-wrap items-center gap-1 shrink-0 text-[11px] font-bold text-slate-600">
                      <span className="text-[10px] text-slate-400 px-1">排版助手:</span>
                      <button 
                        onClick={() => injectFormat('# ')} 
                        type="button"
                        className="hover:bg-slate-200 hover:text-slate-800 px-2 py-0.5 rounded cursor-pointer border border-slate-200 bg-white shadow-3xs"
                      >
                        标题
                      </button>
                      <button 
                        onClick={() => injectFormat('## ')} 
                        type="button"
                        className="hover:bg-slate-200 hover:text-slate-800 px-2 py-0.5 rounded cursor-pointer border border-slate-200 bg-white shadow-3xs"
                      >
                        副标题
                      </button>
                      <button 
                        onClick={() => injectFormat('**', '**')} 
                        type="button"
                        className="font-bold hover:bg-slate-200 hover:text-slate-800 px-2 py-0.5 rounded cursor-pointer border border-slate-200 bg-white shadow-3xs"
                      >
                        B 粗体
                      </button>
                      <button 
                        onClick={() => injectFormat('* ')} 
                        type="button"
                        className="hover:bg-slate-200 hover:text-slate-800 px-2 py-0.5 rounded cursor-pointer border border-slate-200 bg-white shadow-3xs"
                      >
                        • 项目符号
                      </button>
                      <button 
                        onClick={() => injectFormat('1. ')} 
                        type="button"
                        className="hover:bg-slate-200 hover:text-slate-800 px-2 py-0.5 rounded cursor-pointer border border-slate-200 bg-white shadow-3xs"
                      >
                        1. 数字列表
                      </button>
                      <button 
                        onClick={() => injectFormat('[百度]', '(https://www.baidu.com)')} 
                        type="button"
                        className="hover:bg-slate-200 hover:text-slate-800 px-2 py-0.5 rounded cursor-pointer border border-slate-200 bg-white shadow-3xs text-blue-600"
                      >
                        🔗 链接
                      </button>
                      <button 
                        onClick={handlePasteTableBoilerplate} 
                        type="button"
                        className="hover:bg-emerald-200 hover:text-emerald-800 px-2 py-0.5 rounded cursor-pointer border border-emerald-200 bg-white shadow-3xs text-emerald-600"
                        title="插入简单表格占位模板"
                      >
                        📊 插入表格
                      </button>
                    </div>

                    {/* Editing Core Textarea */}
                    <div className="flex-1 min-h-[160px] flex flex-col space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">正文内容 (支持简捷 Markdown 书写)</label>
                      <textarea
                        id="md-textarea"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="# 在此录入文章详情..."
                        className="w-full flex-1 border border-slate-300 rounded p-3 font-mono text-xs focus:outline-none focus:border-blue-500 bg-slate-50/20 leading-relaxed outline-none resize-none"
                      />
                    </div>

                    {/* Integrated Live Markdown Rendering side-panel during edits */}
                    <div className="border border-slate-200 bg-slate-50/50 p-2.5 rounded text-left">
                      <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 flex items-center space-x-1">
                        <Sparkles size={10} className="text-blue-500 animate-pulse" />
                        <span>快捷渲染预览效果</span>
                      </div>
                      <div className="max-h-32 overflow-y-auto bg-white border border-slate-200/50 p-2.5 rounded shadow-inner">
                        {renderMarkdownPreview(editContent)}
                      </div>
                    </div>

                  </div>
                ) : (
                  // READ MODE
                  <div className="space-y-4">
                    
                    {/* Custom Tag Badge display */}
                    {activePage.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2">
                        {activePage.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            onClick={() => setSearchQuery(tag)} // Filter on click tag!
                            className="bg-blue-50 hover:bg-blue-100 hover:text-blue-700 text-blue-600 border border-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer select-none transition-all flex items-center space-x-0.5"
                          >
                            <Tag size={9} />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Active Page document content processed via MD parser */}
                    <div className="prose max-w-none text-slate-800 py-2 select-text">
                      {renderMarkdownPreview(activePage.content)}
                    </div>
                    
                  </div>
                )}

              </div>

              {/* SECTION: Integrated linkage setup pane. (Always displayed on right side or as overlay for great user visual UI experience) */}
              <div className="w-full md:w-60 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-4 shrink-0 overflow-y-auto">
                <div className="space-y-4 text-left">
                  
                  <div className="space-y-1">
                    <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                      <Link2 size={12} className="text-slate-500 animate-pulse" />
                      <span>联动关联配置区</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                      将本页面与主系统中的具体合同、前置需求或供应商进行实体绑定，形成完整的生产管理闭环。
                    </p>
                  </div>

                  {isEditingPage ? (
                    // EDIT MODE LINKAGES
                    <div className="space-y-3 pt-2 border-t border-slate-200/60">
                      
                      {/* Project Linkage selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500">联结前置需求项目</label>
                        <select
                          value={associatedProjectId}
                          onChange={(e) => setAssociatedProjectId(e.target.value)}
                          className="w-full border border-slate-300 rounded px-1.5 py-1 text-[11px] bg-white text-slate-700 focus:outline-none"
                        >
                          <option value="">-- 选择绑定需求 --</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>[{p.ship}] {p.code} - {p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Contract Linkage selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500">联结后置采购合同</label>
                        <select
                          value={associatedContractId}
                          onChange={(e) => setAssociatedContractId(e.target.value)}
                          className="w-full border border-slate-300 rounded px-1.5 py-1 text-[11px] bg-white text-slate-700 focus:outline-none"
                        >
                          <option value="">-- 选择合规合同 --</option>
                          {contracts.map(c => (
                            <option key={c.id} value={c.id}>[{c.ship}] {c.code} - {c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Supplier Linkage text input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500">关联供应商商企</label>
                        <input
                          type="text"
                          value={associatedSupplierName}
                          onChange={(e) => setAssociatedSupplierName(e.target.value)}
                          placeholder="例如: 上海丰冠船务, 佐敦涂料"
                          className="w-full border border-slate-300 rounded px-1.5 py-1 text-[11px] text-slate-850"
                        />
                      </div>

                      {/* Ship selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500">特定关联船舶</label>
                        <select
                          value={associatedShip}
                          onChange={(e) => setAssociatedShip(e.target.value)}
                          className="w-full border border-slate-300 rounded px-1.5 py-1 text-[11px] bg-white text-slate-700 focus:outline-none"
                        >
                          <option value="">-- 选择船舶 --</option>
                          {SHIPS.map(ship => (
                            <option key={ship} value={ship}>{ship}</option>
                          ))}
                        </select>
                      </div>

                    </div>
                  ) : (
                    // READ MODE LINKAGES DISPLAY
                    <div className="space-y-2.5 pt-2 border-t border-slate-200">
                      
                      {/* Active Project linkage card */}
                      {activePage.associatedProjectId ? (
                        (() => {
                          const linkedProj = projects.find(p => p.id === activePage.associatedProjectId);
                          return (
                            <div className="bg-white border border-slate-200 p-2 rounded shadow-2xs">
                              <span className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded px-1.5 py-0.2 uppercase">🔗 关联前置需求项</span>
                              {linkedProj ? (
                                <div className="mt-1 space-y-0.5">
                                  <div className="text-[11px] font-bold text-slate-800 line-clamp-1">{linkedProj.name}</div>
                                  <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
                                    <span>代号: {linkedProj.code}</span>
                                    <span>批次: {linkedProj.status}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 mt-1">关联的项目ID [{activePage.associatedProjectId}] 疑似已在原主表删除</div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="border border-dashed border-slate-200 px-2.5 py-1.5 rounded text-center text-[10px] text-slate-400">
                          - 未接驳采购需求单 -
                        </div>
                      )}

                      {/* Active Contract linkage card */}
                      {activePage.associatedContractId ? (
                        (() => {
                          const linkedCont = contracts.find(c => c.id === activePage.associatedContractId);
                          return (
                            <div className="bg-white border border-slate-200 p-2 rounded shadow-2xs">
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.2 uppercase">📑 关联采购副合同</span>
                              {linkedCont ? (
                                <div className="mt-1 space-y-0.5">
                                  <div className="text-[11px] font-bold text-slate-800 line-clamp-1">{linkedCont.name}</div>
                                  <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
                                    <span>单号: {linkedCont.code}</span>
                                    <span>目前: {linkedCont.status}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 mt-1">关联合同物元可能已在主库注销</div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="border border-dashed border-slate-200 px-2.5 py-1.5 rounded text-center text-[10px] text-slate-400">
                          - 未关联业务主合同 -
                        </div>
                      )}

                      {/* Custom Supplier display */}
                      {activePage.associatedSupplierName ? (
                        <div className="bg-white border border-slate-200 p-2 rounded shadow-2xs">
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.2 uppercase">🏢 目标商户实体</span>
                          <div className="mt-1 font-semibold text-slate-800 text-[11px]">
                            {activePage.associatedSupplierName}
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-200 px-2.5 py-1.5 rounded text-center text-[10px] text-slate-400">
                          - 未绑定供应商实体 -
                        </div>
                      )}

                      {/* Associated ship model */}
                      {activePage.associatedShip && (
                        <div className="bg-white border border-slate-200 p-2 rounded shadow-2xs">
                          <span className="text-[9px] font-bold text-cyan-600 bg-cyan-50 border border-cyan-100 rounded px-1.5 py-0.2 uppercase">⚓ 航务绑定轮船</span>
                          <div className="mt-1 text-slate-800 text-[11px] flex items-center space-x-1 font-semibold">
                            <span>{activePage.associatedShip}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* High Density metadata guidance card */}
                  <div className="mt-4 p-2 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-500 leading-relaxed font-sans shadow-inner">
                    <div className="font-bold text-slate-600 mb-0.5 flex items-center space-x-1">
                      <span>💡 资料库协作提示</span>
                    </div>
                    资料库采用分布式 SQLite 保障，支持关联数据链条。保存后数据会通过 SHA224 算法合并在本地 app/database 主副本及 backups 中。
                  </div>

                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Empty / Welcome state if no pages are created or query yields empty */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3 text-lg font-bold">
              📚
            </div>
            <h2 className="text-sm font-bold text-slate-800">欢迎来到资料知识库</h2>
            <p className="text-slate-500 text-xs mt-1.5 max-w-sm leading-relaxed">
              这是属于您的工作知识沉淀池。随时收集保存工作流程中非结构化、无法放入传统报表但需要长期反复调阅、全文查索的核心信息。
            </p>
            <div className="flex flex-wrap gap-2 mt-4 max-w-lg justify-center">
              <button
                onClick={() => handleCreateNewPage(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded px-3.5 py-1.5 cursor-pointer shadow-sm transition-colors"
              >
                新建第一篇资料
              </button>
              <button
                onClick={() => addKnowledgeCategory('新分类', null)}
                className="bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded px-3.5 py-1.5 cursor-pointer transition-colors"
              >
                初始化分类
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

// ================= INDIVIDUAL CATEGORY recursor helper component =================
interface CategoryNodeProps {
  node: KnowledgeCategory;
  depth: number;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  collapsedCategories: Record<string, boolean>;
  toggleCategoryCollapse: (id: string) => void;
  editingCategoryId: string | null;
  setEditingCategoryId: (id: string | null) => void;
  editingCategoryName: string;
  setEditingCategoryName: (name: string) => void;
  handleRenameCategorySubmit: (id: string) => void;
  deleteKnowledgeCategory: (id: string) => void;
  subCategoryIds: string[];
  getSubCategoryIds: (catId: string) => string[];
  knowledgeCategories: KnowledgeCategory[];
  moveKnowledgeCategory: (id: string, newParentId: string | null) => void;
  relocatingCategoryId: string | null;
  setRelocatingCategoryId: (id: string | null) => void;
  pages: KnowledgePage[];
  handleCreateNewPage: (catId: string) => void;
  setIsAddingCategory: (add: boolean) => void;
  setNewCategoryParentId: (id: string | null) => void;
  
  // Handlers for nested page selection & deletion
  selectedPageId: string | null;
  setSelectedPageId: (id: string | null) => void;
  setIsEditingPage: (editing: boolean) => void;
  deleteKnowledgePage: (id: string) => void;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  node,
  depth,
  selectedCategoryId,
  setSelectedCategoryId,
  collapsedCategories,
  toggleCategoryCollapse,
  editingCategoryId,
  setEditingCategoryId,
  editingCategoryName,
  setEditingCategoryName,
  handleRenameCategorySubmit,
  deleteKnowledgeCategory,
  subCategoryIds,
  getSubCategoryIds,
  knowledgeCategories,
  moveKnowledgeCategory,
  relocatingCategoryId,
  setRelocatingCategoryId,
  pages,
  handleCreateNewPage,
  setIsAddingCategory,
  setNewCategoryParentId,
  selectedPageId,
  setSelectedPageId,
  setIsEditingPage,
  deleteKnowledgePage
}) => {
  const isSelected = selectedCategoryId === node.id;
  const isCollapsed = !!collapsedCategories[node.id];
  const isEditing = editingCategoryId === node.id;
  const isMoving = relocatingCategoryId === node.id;

  // Find sub-nodes (folders) and files (pages) inside this folder
  const subNodes = knowledgeCategories.filter(c => c.parentId === node.id);
  const nodePages = pages.filter(p => p.categoryId === node.id);
  const nodePagesCount = nodePages.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameCategorySubmit(node.id);
    }
  };

  // True if this folder contains either subfolders OR files
  const hasChildren = subNodes.length > 0 || nodePagesCount > 0;

  return (
    <div className="space-y-0.5">
      
      {/* Target category bar */}
      <div 
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        className={`group flex items-center justify-between rounded px-1.5 py-1 text-xs transition-colors hover:bg-slate-200/50 ${
          isSelected 
            ? 'bg-blue-50 border-l-2 border-blue-500 text-blue-700 font-semibold' 
            : 'text-slate-700'
        }`}
      >
        <div className="flex items-center space-x-1.5 truncate max-w-[70%]">
          {/* Arrow / Chevron triggers */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleCategoryCollapse(node.id);
            }}
            className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
          >
            {hasChildren ? (
              isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />
            ) : (
              <span className="w-2.5 h-2.5 block" />
            )}
          </button>
          
          <button 
            onClick={() => setSelectedCategoryId(node.id)}
            className="flex items-center space-x-1.5 truncate text-left focus:outline-none cursor-pointer flex-1"
          >
            {isCollapsed ? (
              <Folder size={11} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
            ) : (
              <FolderOpen size={11} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
            )}
            
            {isEditing ? (
              <input
                type="text"
                value={editingCategoryName}
                onChange={(e) => setEditingCategoryName(e.target.value)}
                onBlur={() => handleRenameCategorySubmit(node.id)}
                onKeyDown={handleKeyDown}
                className="bg-white border border-slate-300 rounded text-[11px] px-1 py-0.2 focus:outline-none focus:border-blue-500 text-slate-800 font-normal w-28"
                autoFocus
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </button>

          <span className="bg-slate-200/60 text-slate-500 text-[8px] font-mono font-bold px-1 rounded">
            {nodePagesCount}
          </span>
         </div>

         {/* Action icons displayed on hover */}
         <div className="flex items-center space-x-1 opacity-35 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200">
          
          {/* Create page directly in this folder */}
          <button
            onClick={() => handleCreateNewPage(node.id)}
            title="在此分类下加资料"
            className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-blue-600 cursor-pointer"
          >
            <Plus size={10} className="stroke-[3]" />
          </button>

          {/* Create a sub-folder under this node */}
          <button
            onClick={() => {
              setNewCategoryParentId(node.id);
              setIsAddingCategory(true);
            }}
            title="加分子分类"
            className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-cyan-600 cursor-pointer"
          >
            <FolderPlus size={10} />
          </button>

          {/* Rename folder */}
          <button
            onClick={() => {
              setEditingCategoryId(node.id);
              setEditingCategoryName(node.name);
            }}
            title="改名"
            className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <Edit3 size={10} />
          </button>

          {/* Re-level folder layout */}
          <button
            onClick={() => {
              setRelocatingCategoryId(isMoving ? null : node.id);
            }}
            title="移动/调整层级"
            className={`p-0.5 rounded cursor-pointer ${isMoving ? 'bg-amber-100 text-amber-600' : 'hover:bg-slate-200 text-slate-500 hover:text-amber-600'}`}
          >
            <Move size={10} />
          </button>

          {/* Delete folder */}
          <button
            onClick={() => {
              if (confirm(`确定要删除分类 [${node.name}] 吗？\n删除分类后：\n1. 其内的资料页面不会丢失，会自动向上移动。\n2. 其子级目录分类也会安全向上移动。`)) {
                deleteKnowledgeCategory(node.id);
                setSelectedCategoryId(null);
              }
            }}
            title="安全删除"
            className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-red-600 cursor-pointer"
          >
            <Trash2 size={10} />
          </button>
         </div>

      </div>

      {/* Re-level moving controls dropdown */}
      {isMoving && (
        <div style={{ marginLeft: `${depth * 12 + 20}px` }} className="p-1 px-2 border border-amber-100 rounded bg-amber-50/50 flex flex-col space-y-1">
          <div className="text-[9px] font-bold text-amber-700">移至目标父分级:</div>
          <div className="flex items-center space-x-1.5">
            <select
              value={node.parentId || ''}
              onChange={(e) => {
                const targetVal = e.target.value || null;
                moveKnowledgeCategory(node.id, targetVal);
                setRelocatingCategoryId(null);
              }}
              className="border border-amber-200 rounded text-[10px] bg-white text-slate-700 p-0.5 w-32"
            >
              <option value="">📁 [顶级目录]</option>
              {knowledgeCategories
                // Prevent cyclic parenting: can't move to self, or to any subCategory child of self
                .filter(c => c.id !== node.id && !subCategoryIds.includes(c.id))
                .map(cat => (
                  <option key={cat.id} value={cat.id}>📁 {cat.name}</option>
                ))}
            </select>
            <button 
              onClick={() => setRelocatingCategoryId(null)}
              className="text-[9px] text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-1 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Expanded directory tree content: folders first, files second */}
      {!isCollapsed && hasChildren && (
        <div className="space-y-0.5">
          {/* 1. Sub-folders */}
          {subNodes.map(subNode => (
            <CategoryNode
              key={subNode.id}
              node={subNode}
              depth={depth + 1}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              collapsedCategories={collapsedCategories}
              toggleCategoryCollapse={toggleCategoryCollapse}
              editingCategoryId={editingCategoryId}
              setEditingCategoryId={setEditingCategoryId}
              editingCategoryName={editingCategoryName}
              setEditingCategoryName={setEditingCategoryName}
              handleRenameCategorySubmit={handleRenameCategorySubmit}
              deleteKnowledgeCategory={deleteKnowledgeCategory}
              subCategoryIds={getSubCategoryIds(subNode.id)}
              getSubCategoryIds={getSubCategoryIds}
              knowledgeCategories={knowledgeCategories}
              moveKnowledgeCategory={moveKnowledgeCategory}
              relocatingCategoryId={relocatingCategoryId}
              setRelocatingCategoryId={setRelocatingCategoryId}
              pages={pages}
              handleCreateNewPage={handleCreateNewPage}
              setIsAddingCategory={setIsAddingCategory}
              setNewCategoryParentId={setNewCategoryParentId}
              selectedPageId={selectedPageId}
              setSelectedPageId={setSelectedPageId}
              setIsEditingPage={setIsEditingPage}
              deleteKnowledgePage={deleteKnowledgePage}
            />
          ))}

          {/* 2. Files (Pages) */}
          {nodePages.map(page => {
            const isPageSelected = selectedPageId === page.id;
            const hasAssoc = page.associatedContractId || page.associatedProjectId || page.associatedSupplierName;
            return (
              <div
                key={page.id}
                style={{ paddingLeft: `${(depth + 1) * 12 + 22}px` }}
                className={`group flex items-center justify-between rounded px-1.5 py-1 text-[11px] transition-colors cursor-pointer ${
                  isPageSelected
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPageId(page.id);
                  setIsEditingPage(false);
                }}
              >
                <div className="flex items-center space-x-1.5 truncate max-w-[80%]">
                  <FileText size={10} className={isPageSelected ? 'text-white' : 'text-slate-400'} />
                  <span className="truncate">{page.title}</span>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {hasAssoc && (
                    <div className={`h-1.5 w-1.5 rounded-full ${isPageSelected ? 'bg-blue-200' : 'bg-blue-500/80 animate-pulse'}`} />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定要删除本篇资料吗？此操作无法撤销。')) {
                        deleteKnowledgePage(page.id);
                        if (selectedPageId === page.id) {
                          setSelectedPageId(null);
                        }
                      }
                    }}
                    title="安全丢弃"
                    className={`p-0.5 rounded ${isPageSelected ? 'hover:bg-blue-700 text-blue-100' : 'hover:bg-slate-200 text-slate-400 hover:text-red-650'}`}
                  >
                    <Trash2 size={9} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
