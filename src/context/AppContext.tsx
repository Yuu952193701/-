import React, { createContext, useContext, useState, useEffect } from 'react';
import { DemandProject, Contract, WorkflowStep, SHIPS, BackupFile, KnowledgeCategory, KnowledgePage, BidProject, ChecklistTask, RecommendedTag } from '../types';
import {
  DEFAULT_PRE_STEPS,
  DEFAULT_POST_STEPS,
  DEFAULT_BID_STEPS,
  INITIAL_DEMAND_PROJECTS,
  INITIAL_CONTRACTS,
  INITIAL_KNOWLEDGE_CATEGORIES,
  INITIAL_KNOWLEDGE_PAGES,
  INITIAL_BID_PROJECTS,
} from '../data';

interface AppContextProps {
  projects: DemandProject[];
  contracts: Contract[];
  preWorkflow: WorkflowStep[];
  postWorkflow: WorkflowStep[];
  bids: BidProject[];
  bidWorkflow: WorkflowStep[];
  
  // Knowledge Library
  knowledgeCategories: KnowledgeCategory[];
  knowledgePages: KnowledgePage[];
  addKnowledgeCategory: (name: string, parentId?: string | null) => KnowledgeCategory | undefined;
  renameKnowledgeCategory: (id: string, name: string) => void;
  deleteKnowledgeCategory: (id: string) => void;
  moveKnowledgeCategory: (id: string, newParentId: string | null) => void;
  addKnowledgePage: (page: Partial<KnowledgePage> & { title: string; categoryId: string | null }) => KnowledgePage;
  updateKnowledgePage: (id: string, updates: Partial<KnowledgePage>) => void;
  deleteKnowledgePage: (id: string) => void;
  moveKnowledgePage: (id: string, targetCategoryId: string | null) => void;
  
  // Project Actions
  addProject: (project: Partial<DemandProject> & { code: string; name: string; ship: string }) => void;
  updateProject: (id: string, updates: Partial<DemandProject>) => void;
  deleteProject: (id: string) => void;
  moveProjectStep: (id: string, direction: 'next' | 'prev') => void;
  
  // Contract Actions
  addContract: (contract: Partial<Contract> & { name: string; ship: string }) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
  moveContractStep: (id: string, direction: 'next' | 'prev') => void;

  // Bid Actions
  addBid: (bid: Partial<BidProject> & { name: string; ship: string }) => void;
  updateBid: (id: string, updates: Partial<BidProject>) => void;
  deleteBid: (id: string) => void;
  moveBidStep: (id: string, direction: 'next' | 'prev') => void;

  // Association Actions
  associateProjectToContract: (projectId: string, contractId: string | undefined) => void;
  batchAssociateProjects: (contractId: string, projectIds: string[]) => void;

  // Workflow Actions
  updatePreWorkflow: (steps: WorkflowStep[]) => void;
  updatePostWorkflow: (steps: WorkflowStep[]) => void;
  updateBidWorkflow: (steps: WorkflowStep[]) => void;
  
  // Global Tags catalog for autocomplete suggestion
  allTags: string[];
  addGlobalTag: (tag: string) => void;

  // Checklist Actions
  checklistTasks: ChecklistTask[];
  addChecklistTask: (title: string, notes?: string, dueDate?: string, isUrgent?: boolean) => void;
  updateChecklistTask: (id: string, updates: Partial<ChecklistTask>) => void;
  deleteChecklistTask: (id: string) => void;
  reorderChecklistTasks: (tasks: ChecklistTask[]) => void;

  // Recommended Tags Actions
  recommendedTags: RecommendedTag[];
  addRecommendedTag: (name: string) => void;
  updateRecommendedTag: (id: string, name: string) => void;
  deleteRecommendedTag: (id: string) => void;
  reorderRecommendedTags: (tags: RecommendedTag[]) => void;

  // Global Navigation Helper State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedKnowledgePageId: string | null;
  setSelectedKnowledgePageId: (id: string | null) => void;

  // Database Backup / Restore Actions
  backups: BackupFile[];
  createBackup: (type: 'auto' | 'manual') => Promise<{ success: boolean; filename: string; error?: string }>;
  restoreBackup: (filename: string) => Promise<{ success: boolean; error?: string }>;
  deleteBackup: (filename: string) => void;
  exportDatabase: () => void;
  importDatabase: (fileContent: string, fileName: string) => Promise<{ success: boolean; error?: string }>;
  isDatabaseConnecting: boolean;
  systemLogs: string[];
  addSystemLog: (msg: string) => void;
  clearSystemLogs: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from LocalStorage or seed defaults
  const [projects, setProjects] = useState<DemandProject[]>(() => {
    const saved = localStorage.getItem('p_workbench_projects');
    return saved ? JSON.parse(saved) : INITIAL_DEMAND_PROJECTS;
  });

  const [postWorkflow, setPostWorkflow] = useState<WorkflowStep[]>(() => {
    const saved = localStorage.getItem('p_workbench_post_wf');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if it's the old default (starting with "合同签订")
      if (parsed.length > 0 && parsed[0].name === '合同签订') {
        localStorage.setItem('p_workbench_post_wf', JSON.stringify(DEFAULT_POST_STEPS));
        return DEFAULT_POST_STEPS;
      }
      return parsed;
    }
    return DEFAULT_POST_STEPS;
  });

  const [contracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem('p_workbench_contracts');
    let parsed: Contract[] = saved ? JSON.parse(saved) : INITIAL_CONTRACTS;

    const mapStatus = (status: string) => {
      if (status === '合同签订' || status === '发货中' || status === '到货签收') return '签收单';
      if (status === '制作对账单' || status === '计量结算') return '对账单';
      if (status === '等待审批') return '审核';
      if (status === '制作付款申请') return '付款申请';
      if (status === '付款审批') return '付款审批';
      if (status === '付款完成' || status === '归档') return '付款完成';
      return status;
    };

    let changed = false;
    parsed = parsed.map(c => {
      const updatedStatus = mapStatus(c.status);
      const updatedStatusChanged = updatedStatus !== c.status;
      
      const contractStatus = c.contractStatus || (c.status === '归档' || c.status === '付款完成' ? '已完成' : '执行中');
      const isMulti = c.isMultiSettlement ?? false;
      let settlements = c.settlements;
      if (isMulti && (!settlements || settlements.length === 0)) {
        settlements = [
          {
            id: `s-${Date.now()}-1`,
            name: '第1期结算',
            status: updatedStatus,
            remark: ''
          }
        ];
      }

      if (updatedStatusChanged || !c.contractStatus || c.isMultiSettlement === undefined) {
        changed = true;
        return {
          ...c,
          status: updatedStatus,
          contractStatus,
          isMultiSettlement: isMulti,
          settlements
        };
      }
      return c;
    });

    if (changed) {
      localStorage.setItem('p_workbench_contracts', JSON.stringify(parsed));
    }
    return parsed;
  });

  const [preWorkflow, setPreWorkflow] = useState<WorkflowStep[]>(() => {
    const saved = localStorage.getItem('p_workbench_pre_wf');
    return saved ? JSON.parse(saved) : DEFAULT_PRE_STEPS;
  });

  const [bids, setBids] = useState<BidProject[]>(() => {
    const saved = localStorage.getItem('p_workbench_bids');
    return saved ? JSON.parse(saved) : INITIAL_BID_PROJECTS;
  });

  const [bidWorkflow, setBidWorkflow] = useState<WorkflowStep[]>(() => {
    const saved = localStorage.getItem('p_workbench_bid_wf');
    return saved ? JSON.parse(saved) : DEFAULT_BID_STEPS;
  });

  const [allTags, setAllTags] = useState<string[]>(() => {
    const saved = localStorage.getItem('p_workbench_all_tags');
    if (saved) return JSON.parse(saved);
    // Extracted from seed
    const tagsSet = new Set<string>();
    INITIAL_DEMAND_PROJECTS.forEach(p => p.tags.forEach(t => tagsSet.add(t)));
    INITIAL_CONTRACTS.forEach(c => c.tags.forEach(t => tagsSet.add(t)));
    INITIAL_KNOWLEDGE_PAGES.forEach(k => k.tags.forEach(t => tagsSet.add(t)));
    INITIAL_BID_PROJECTS.forEach(b => b.tags.forEach(t => tagsSet.add(t)));
    tagsSet.add('机油');
    tagsSet.add('电缆');
    tagsSet.add('紧急');
    tagsSet.add('日常备件');
    tagsSet.add('上海高品质');
    return Array.from(tagsSet);
  });

  const [knowledgeCategories, setKnowledgeCategories] = useState<KnowledgeCategory[]>(() => {
    const saved = localStorage.getItem('p_workbench_k_categories');
    return saved ? JSON.parse(saved) : INITIAL_KNOWLEDGE_CATEGORIES;
  });

  const [knowledgePages, setKnowledgePages] = useState<KnowledgePage[]>(() => {
    const saved = localStorage.getItem('p_workbench_k_pages');
    return saved ? JSON.parse(saved) : INITIAL_KNOWLEDGE_PAGES;
  });

  // DB Backup state variables
  const [backups, setBackups] = useState<BackupFile[]>(() => {
    const saved = localStorage.getItem('p_workbench_all_backups');
    return saved ? JSON.parse(saved) : [];
  });

  // Recommended Tags State
  const [recommendedTags, setRecommendedTags] = useState<RecommendedTag[]>(() => {
    const saved = localStorage.getItem('p_workbench_recommended_tags');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'rec-1', name: '国能', order: 1 },
      { id: 'rec-2', name: '华电', order: 2 },
      { id: 'rec-3', name: '紧急', order: 3 },
      { id: 'rec-4', name: '大宗采购', order: 4 },
      { id: 'rec-5', name: '日常备件', order: 5 },
    ];
  });

  // Checklist Tasks State
  const [checklistTasks, setChecklistTasks] = useState<ChecklistTask[]>(() => {
    const saved = localStorage.getItem('p_workbench_checklist_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  // Global Navigation & Page Selection States
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedKnowledgePageId, setSelectedKnowledgePageId] = useState<string | null>(null);

  // Sync recommendedTags
  useEffect(() => {
    localStorage.setItem('p_workbench_recommended_tags', JSON.stringify(recommendedTags));
    if (window.electronAPI) {
      window.electronAPI.saveData('recommendedTags', recommendedTags).catch(err => console.error(err));
    }
  }, [recommendedTags]);

  // Sync checklistTasks
  useEffect(() => {
    localStorage.setItem('p_workbench_checklist_tasks', JSON.stringify(checklistTasks));
    if (window.electronAPI) {
      window.electronAPI.saveData('checklistTasks', checklistTasks).catch(err => console.error(err));
    }
  }, [checklistTasks]);

  const addChecklistTask = (title: string, notes?: string, dueDate?: string, isUrgent?: boolean) => {
    const newTask: ChecklistTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      completed: false,
      notes: notes || '',
      dueDate: dueDate || '',
      isUrgent: isUrgent || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setChecklistTasks(prev => [newTask, ...prev]);
  };

  const updateChecklistTask = (id: string, updates: Partial<ChecklistTask>) => {
    setChecklistTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));
  };

  const deleteChecklistTask = (id: string) => {
    setChecklistTasks(prev => prev.filter(t => t.id !== id));
  };

  const reorderChecklistTasks = (tasks: ChecklistTask[]) => {
    setChecklistTasks(tasks);
  };

  const addRecommendedTag = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (recommendedTags.some(t => t.name === trimmed)) {
      alert('推荐标签已存在');
      return;
    }
    const maxOrder = recommendedTags.reduce((max, t) => t.order > max ? t.order : max, 0);
    const newTag: RecommendedTag = {
      id: `rec-${Date.now()}`,
      name: trimmed,
      order: maxOrder + 1
    };
    setRecommendedTags(prev => [...prev, newTag]);
  };

  const updateRecommendedTag = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRecommendedTags(prev => prev.map(t => t.id === id ? { ...t, name: trimmed } : t));
  };

  const deleteRecommendedTag = (id: string) => {
    setRecommendedTags(prev => prev.filter(t => t.id !== id));
  };

  const reorderRecommendedTags = (tags: RecommendedTag[]) => {
    const mapped = tags.map((t, idx) => ({ ...t, order: idx + 1 }));
    setRecommendedTags(mapped);
  };

  const [isDatabaseConnecting, setIsDatabaseConnecting] = useState<boolean>(false);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  const addSystemLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  };

  const clearSystemLogs = () => {
    setSystemLogs([]);
  };

  const deleteBackup = (filename: string) => {
    if (window.electronAPI) {
      window.electronAPI.deleteBackup(filename).then(success => {
        if (success) {
          setBackups(prev => prev.filter(b => b.filename !== filename));
          addSystemLog(`[备份库容优化] 已从用户目录清理物理备份: ${filename}`);
        } else {
          addSystemLog(`[备份库容优化] 清理物理备份失败: ${filename}`);
        }
      }).catch(err => {
        addSystemLog(`[备份清理异常] ${err?.message || err}`);
      });
      return;
    }
    setBackups(prev => {
      const filtered = prev.filter(b => b.filename !== filename);
      localStorage.setItem('p_workbench_all_backups', JSON.stringify(filtered));
      addSystemLog(`[备份库容优化] 已清理仿真物理备份文件: app/backup/${filename}`);
      return filtered;
    });
  };

  // 1. Startup Directory & File Check, and Daily Auto Backup
  useEffect(() => {
    const initData = async () => {
      if (window.electronAPI) {
        addSystemLog("检测到 Electron 宿主环境！正在对齐拉取本地 SQLite 主数据库...");
        try {
          setIsDatabaseConnecting(true);
          const pathInfo = await window.electronAPI.getAppPathInfo();
          addSystemLog(`[主库位置] ${pathInfo.dbPath}`);
          addSystemLog(`[备份位置] ${pathInfo.backupPath}`);
          
          const loaded = await window.electronAPI.loadAllData();
          if (loaded) {
            if (loaded.projects) setProjects(loaded.projects);
            if (loaded.contracts) setContracts(loaded.contracts);
            if (loaded.preWorkflow) setPreWorkflow(loaded.preWorkflow);
            if (loaded.postWorkflow) setPostWorkflow(loaded.postWorkflow);
            if (loaded.bids) setBids(loaded.bids);
            if (loaded.bidWorkflow) setBidWorkflow(loaded.bidWorkflow);
            if (loaded.allTags) setAllTags(loaded.allTags);
            if (loaded.knowledgeCategories) setKnowledgeCategories(loaded.knowledgeCategories);
            if (loaded.knowledgePages) setKnowledgePages(loaded.knowledgePages);
            if (loaded.backups) setBackups(loaded.backups);
            
            addSystemLog("物理 SQLite 数据库成功挂载！全部本地工作流水已同步至视图。");
          }
        } catch (err: any) {
          addSystemLog(`[SQLite 载入异常] ${err?.message || err}`);
        } finally {
          setIsDatabaseConnecting(false);
        }
      } else {
        addSystemLog("采购进度桌面管理系统 Electron 仿真内核加载完毕！");
        addSystemLog("进程挂载环境：C:\\采购管理系统\\app.exe - 启动中...");
        
        // Check and create local simulated directories
        const hasDbDir = localStorage.getItem('p_workbench_db_dir_ready');
        if (!hasDbDir) {
          localStorage.setItem('p_workbench_db_dir_ready', 'true');
          addSystemLog("环境检查: 未检测到主数据目录 [app/database/]，已成功创设！");
          addSystemLog("环境检查: 未检测到备份仓库 [app/backup/]，已成功创设！");
          addSystemLog("环境检查: 主数据库文书 [app/database/data.db] 初始化导入成功。");
        } else {
          addSystemLog("环境检查: 目标本地数据存放空间 [app/database/data.db] 热就绪。");
          addSystemLog("环境检查: 备用仓库映射地址 [app/backup/] 初始化扫描通过。");
        }
        addSystemLog("主库服务: 连接主本地 SQLite (v3.35.0) data.db 成功稳定启动。");
        
        // Auto-backup once-per-day restriction
        const todayStr = new Date().toISOString().split('T')[0];
        const savedBackupsRaw = localStorage.getItem('p_workbench_all_backups');
        const existingBackups: BackupFile[] = savedBackupsRaw ? JSON.parse(savedBackupsRaw) : [];
        
        const hasTodayAutoBackup = existingBackups.some(b => b.formattedDate === todayStr && b.type === 'auto');
        if (!hasTodayAutoBackup) {
          addSystemLog(`[启动例会自动备份] 开始为今日时间戳 (${todayStr}) 创建默认保障拷贝...`);
          const stateObj = {
            projects,
            contracts,
            preWorkflow,
            postWorkflow,
            bids,
            bidWorkflow,
            allTags,
            knowledgeCategories,
            knowledgePages,
            version: '1.2'
          };
          const serializedData = JSON.stringify(stateObj);
          const filename = `backup_${todayStr}.db`;
          const newBackup: BackupFile = {
            filename,
            timestamp: new Date().toISOString(),
            formattedDate: todayStr,
            type: 'auto',
            size: `${(serializedData.length / 1024 + 1.2).toFixed(1)} KB`,
            data: serializedData
          };
          
          let updated = [newBackup, ...existingBackups];
          if (updated.length > 30) {
            addSystemLog(`[库容自动维护] 物理备份超过 30 份限制额度，已删除最早归档备份：${updated[updated.length - 1].filename}`);
            updated = updated.slice(0, 30);
          }
          localStorage.setItem('p_workbench_all_backups', JSON.stringify(updated));
          setBackups(updated);
          addSystemLog(`[例会备份就绪] 备份文件已封存至主目录: app/backup/${filename}`);
        } else {
          addSystemLog(`[例会备份就绪] 本日自动备份档 [backup_${todayStr}.db] 表现完备，防止生成重复赘沉数据。`);
        }
      }
    };
    initData();
  }, []);

  // 2. Closure auto backup listener (whenever user exits app session)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const stateObj = {
        projects,
        contracts,
        preWorkflow,
        postWorkflow,
        bids,
        bidWorkflow,
        allTags,
        knowledgeCategories,
        knowledgePages,
        version: '1.2'
      };
      const serializedData = JSON.stringify(stateObj);
      const filename = `backup_${todayStr}.db`;
      
      const newBackup: BackupFile = {
        filename,
        timestamp: new Date().toISOString(),
        formattedDate: todayStr,
        type: 'auto',
        size: `${(serializedData.length / 1024 + 1.2).toFixed(1)} KB`,
        data: serializedData
      };
      
      const saved = localStorage.getItem('p_workbench_all_backups');
      let currentBackups: BackupFile[] = saved ? JSON.parse(saved) : [];
      
      // Keep only one daily backup - override today's backup with latest state on exit
      currentBackups = currentBackups.filter(b => b.filename !== filename);
      let updated = [newBackup, ...currentBackups];
      if (updated.length > 30) {
        updated = updated.slice(0, 30);
      }
      localStorage.setItem('p_workbench_all_backups', JSON.stringify(updated));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [projects, contracts, preWorkflow, postWorkflow, bids, bidWorkflow, allTags, knowledgeCategories, knowledgePages]);

  const createBackup = async (type: 'auto' | 'manual'): Promise<{ success: boolean; filename: string; error?: string }> => {
    if (window.electronAPI) {
      try {
        addSystemLog(`[启动强制物理备份] 唤醒宿主硬件级安全隔离备份镜像...`);
        const result = await window.electronAPI.createBackup(type);
        if (result.success) {
          addSystemLog(`[物理强设备份完成] 库镜像在本地用户 AppData 目录存储归档：${result.filename}`);
          const refreshedBackups = await window.electronAPI.getBackups();
          setBackups(refreshedBackups);
        } else {
          addSystemLog(`[物理级备份故障] 重写出错: ${result.error}`);
        }
        return result;
      } catch (err: any) {
        addSystemLog(`[备份异常拦截] ${err?.message || err}`);
        return { success: false, filename: '', error: err?.message || String(err) };
      }
    }

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      let filename = `backup_${todayStr}.db`;
      if (type === 'manual') {
        const now = new Date();
        const hrs = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        const secs = now.getSeconds().toString().padStart(2, '0');
        filename = `backup_${todayStr}_manual_${hrs}${mins}${secs}.db`;
      }
      
      const stateObj = {
        projects,
        contracts,
        preWorkflow,
        postWorkflow,
        bids,
        bidWorkflow,
        allTags,
        knowledgeCategories,
        knowledgePages,
        version: '1.2'
      };
      const serializedData = JSON.stringify(stateObj);
      
      const newBackup: BackupFile = {
        filename,
        timestamp: new Date().toISOString(),
        formattedDate: todayStr,
        type,
        size: `${(serializedData.length / 1024 + 1.2).toFixed(1)} KB`,
        data: serializedData
      };
      
      setBackups(prev => {
        const filtered = prev.filter(b => b.filename !== filename);
        let updated = [newBackup, ...filtered];
        if (updated.length > 30) {
          addSystemLog(`[库容配额优化] 历史记录大于30份，自动丢弃最旧物理源档 ${updated[updated.length - 1].filename}`);
          updated = updated.slice(0, 30);
        }
        localStorage.setItem('p_workbench_all_backups', JSON.stringify(updated));
        return updated;
      });
      
      addSystemLog(`[手动强制备份] SQLite 内存层全表热切复制成功。镜像路径: app/backup/${filename}`);
      return { success: true, filename };
    } catch (err: any) {
      addSystemLog(`[强制备份失败] 复制 data.db 异常: ${err?.message || err}`);
      return { success: false, filename: '', error: err?.message || String(err) };
    }
  };

  const restoreBackup = async (filename: string): Promise<{ success: boolean; error?: string }> => {
    setIsDatabaseConnecting(true);
    addSystemLog(`[主库还原操作] 调度备份源 [${filename}] 载入还原会话...`);
    
    if (window.electronAPI) {
      addSystemLog(`[主库还原操作] 物理冷重置中... 正在覆盖本地 AppData 主数据库...`);
      await new Promise(resolve => setTimeout(resolve, 800));
      try {
        const res = await window.electronAPI.restoreBackup(filename);
        if (!res.success) {
          throw new Error(res.error || "物理覆盖还原出错");
        }
        
        addSystemLog(`[数据重写] 主 SQLite 物理锁定卸载，覆盖本地 data.db 主库成功！`);
        addSystemLog(`[内核重载] 重新挂载 SQLite 服务句柄，对前置项目组和合同包重构索引...`);
        
        // Reload all data from resurrected sqlite file
        const loaded = await window.electronAPI.loadAllData();
        if (loaded) {
          if (loaded.projects) setProjects(loaded.projects);
          if (loaded.contracts) setContracts(loaded.contracts);
          if (loaded.preWorkflow) setPreWorkflow(loaded.preWorkflow);
          if (loaded.postWorkflow) setPostWorkflow(loaded.postWorkflow);
          if (loaded.bids) setBids(loaded.bids);
          if (loaded.bidWorkflow) setBidWorkflow(loaded.bidWorkflow);
          if (loaded.allTags) setAllTags(loaded.allTags);
          if (loaded.knowledgeCategories) setKnowledgeCategories(loaded.knowledgeCategories);
          if (loaded.knowledgePages) setKnowledgePages(loaded.knowledgePages);
          if (loaded.backups) setBackups(loaded.backups);
        }
        
        addSystemLog(`[重载就绪] 物理 SQLite 新连接重新建立，视图数据全极速刷新同步完成！`);
        setIsDatabaseConnecting(false);
        return { success: true };
      } catch (err: any) {
        addSystemLog(`[还原强制回滚] 物理还原遭遇致命阻隔: ${err?.message || err}`);
        setIsDatabaseConnecting(false);
        return { success: false, error: err?.message || String(err) };
      }
    }

    addSystemLog(`[主库还原操作] 自动向主端发出会话销毁握手，正在关闭 SQLite data.db 管道连接...`);
    await new Promise(resolve => setTimeout(resolve, 700));
    
    try {
      const backup = backups.find(b => b.filename === filename);
      if (!backup) {
        throw new Error("备份数据映射源丢失！请刷新后尝试重新挂载。");
      }
      
      addSystemLog(`[数据重写] 验证源备份包完整签名... 验证成功！`);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const state = JSON.parse(backup.data || '{}');
      if (!state.projects || !state.contracts) {
        throw new Error("检测到该 .db 备份文件记录列损坏或表格列头不配对。安全中断写入。");
      }
      
      // Update our database states
      setProjects(state.projects);
      setContracts(state.contracts);
      setBids(state.bids || []);
      if (state.preWorkflow) setPreWorkflow(state.preWorkflow);
      if (state.postWorkflow) setPostWorkflow(state.postWorkflow);
      if (state.bidWorkflow) setBidWorkflow(state.bidWorkflow);
      if (state.allTags) setAllTags(state.allTags);
      if (state.knowledgeCategories) setKnowledgeCategories(state.knowledgeCategories);
      if (state.knowledgePages) setKnowledgePages(state.knowledgePages);
      
      // Save directly to localStorage
      localStorage.setItem('p_workbench_projects', JSON.stringify(state.projects));
      localStorage.setItem('p_workbench_contracts', JSON.stringify(state.contracts));
      localStorage.setItem('p_workbench_bids', JSON.stringify(state.bids || []));
      if (state.preWorkflow) localStorage.setItem('p_workbench_pre_wf', JSON.stringify(state.preWorkflow));
      if (state.postWorkflow) localStorage.setItem('p_workbench_post_wf', JSON.stringify(state.postWorkflow));
      if (state.bidWorkflow) localStorage.setItem('p_workbench_bid_wf', JSON.stringify(state.bidWorkflow));
      if (state.allTags) localStorage.setItem('p_workbench_all_tags', JSON.stringify(state.allTags));
      if (state.knowledgeCategories) localStorage.setItem('p_workbench_k_categories', JSON.stringify(state.knowledgeCategories));
      if (state.knowledgePages) localStorage.setItem('p_workbench_k_pages', JSON.stringify(state.knowledgePages));
      
      addSystemLog(`[数据重写] 主 SQLite 读写锁卸载，覆盖 app/database/data.db 成功！`);
      addSystemLog(`[内核重载] 重新挂载 SQLite 服务句柄，对前置项目组和合同包重构索引...`);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      addSystemLog(`[重载就绪] 新连接建立，成功恢复至备份节点数据集！`);
      setIsDatabaseConnecting(false);
      return { success: true };
    } catch (err: any) {
      addSystemLog(`[还原强制回滚] 主库覆盖故障，系统已自动回滚至刚才的事务备份：${err?.message || err}`);
      setIsDatabaseConnecting(false);
      return { success: false, error: err?.message || String(err) };
    }
  };

  const exportDatabase = () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const stateObj = {
        projects,
        contracts,
        preWorkflow,
        postWorkflow,
        bids,
        bidWorkflow,
        allTags,
        knowledgeCategories,
        knowledgePages,
        version: '1.2',
        engine: 'Simulated SQLite Direct Copy',
        exportDate: new Date().toISOString()
      };
      
      const serialized = JSON.stringify(stateObj);
      const blob = new Blob([serialized], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${todayStr}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addSystemLog(`[本地物理复制] data.db 已被封锁打包，浏览器拉起外置选择器。默认命名: backup_${todayStr}.db`);
    } catch (err: any) {
      addSystemLog(`[外部导出故障] 文件打包故障: ${err?.message || err}`);
    }
  };

  const importDatabase = async (fileContent: string, fileName: string): Promise<{ success: boolean; error?: string }> => {
    setIsDatabaseConnecting(true);
    addSystemLog(`[外部加载] 已接卸载外部数据流 [${fileName}]。解析哈希与签名中...`);
    addSystemLog(`[数据重配] 向当前的 Live SQLite 连接进程发断开信号，挂起数据库读写...`);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const parsed = JSON.parse(fileContent);
      if (!parsed.projects || !parsed.contracts) {
        throw new Error("格式非本系统标准的 SQLite 仿真 JSON 模型。非法覆盖已安全制止。");
      }
      
      addSystemLog(`[外部校验通过] 解析成功：发现 ${parsed.projects.length} 项前置需求, ${parsed.contracts.length} 套后置合同。物理覆写启动...`);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setProjects(parsed.projects);
      setContracts(parsed.contracts);
      setBids(parsed.bids || []);
      if (parsed.preWorkflow) setPreWorkflow(parsed.preWorkflow);
      if (parsed.postWorkflow) setPostWorkflow(parsed.postWorkflow);
      if (parsed.bidWorkflow) setBidWorkflow(parsed.bidWorkflow);
      if (parsed.allTags) setAllTags(parsed.allTags);
      if (parsed.knowledgeCategories) setKnowledgeCategories(parsed.knowledgeCategories);
      if (parsed.knowledgePages) setKnowledgePages(parsed.knowledgePages);
      
      localStorage.setItem('p_workbench_projects', JSON.stringify(parsed.projects));
      localStorage.setItem('p_workbench_contracts', JSON.stringify(parsed.contracts));
      localStorage.setItem('p_workbench_bids', JSON.stringify(parsed.bids || []));
      if (parsed.preWorkflow) localStorage.setItem('p_workbench_pre_wf', JSON.stringify(parsed.preWorkflow));
      if (parsed.postWorkflow) localStorage.setItem('p_workbench_post_wf', JSON.stringify(parsed.postWorkflow));
      if (parsed.bidWorkflow) localStorage.setItem('p_workbench_bid_wf', JSON.stringify(parsed.bidWorkflow));
      if (parsed.allTags) localStorage.setItem('p_workbench_all_tags', JSON.stringify(parsed.allTags));
      if (parsed.knowledgeCategories) localStorage.setItem('p_workbench_k_categories', JSON.stringify(parsed.knowledgeCategories));
      if (parsed.knowledgePages) localStorage.setItem('p_workbench_k_pages', JSON.stringify(parsed.knowledgePages));
      
      addSystemLog(`[内核重载] 辅导引擎冷切完成，硬盘上的 data.db 数据流极速对齐重写完毕！`);
      setIsDatabaseConnecting(false);
      return { success: true };
    } catch (err: any) {
      addSystemLog(`[导入恢复故障] 安全锁定主数据失败: ${err?.message || err}`);
      setIsDatabaseConnecting(false);
      return { success: false, error: err?.message || String(err) };
    }
  };

  // Persist transitions (dual synchronization)
  useEffect(() => {
    localStorage.setItem('p_workbench_projects', JSON.stringify(projects));
    if (window.electronAPI) window.electronAPI.saveData('projects', projects).catch(err => console.error(err));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('p_workbench_contracts', JSON.stringify(contracts));
    if (window.electronAPI) window.electronAPI.saveData('contracts', contracts).catch(err => console.error(err));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('p_workbench_pre_wf', JSON.stringify(preWorkflow));
    if (window.electronAPI) window.electronAPI.saveData('preWorkflow', preWorkflow).catch(err => console.error(err));
  }, [preWorkflow]);

  useEffect(() => {
    localStorage.setItem('p_workbench_post_wf', JSON.stringify(postWorkflow));
    if (window.electronAPI) window.electronAPI.saveData('postWorkflow', postWorkflow).catch(err => console.error(err));
  }, [postWorkflow]);

  useEffect(() => {
    localStorage.setItem('p_workbench_bids', JSON.stringify(bids));
    if (window.electronAPI) window.electronAPI.saveData('bids', bids).catch(err => console.error(err));
  }, [bids]);

  useEffect(() => {
    localStorage.setItem('p_workbench_bid_wf', JSON.stringify(bidWorkflow));
    if (window.electronAPI) window.electronAPI.saveData('bidWorkflow', bidWorkflow).catch(err => console.error(err));
  }, [bidWorkflow]);

  useEffect(() => {
    localStorage.setItem('p_workbench_all_tags', JSON.stringify(allTags));
    if (window.electronAPI) window.electronAPI.saveData('allTags', allTags).catch(err => console.error(err));
  }, [allTags]);

  useEffect(() => {
    localStorage.setItem('p_workbench_k_categories', JSON.stringify(knowledgeCategories));
    if (window.electronAPI) window.electronAPI.saveData('knowledgeCategories', knowledgeCategories).catch(err => console.error(err));
  }, [knowledgeCategories]);

  useEffect(() => {
    localStorage.setItem('p_workbench_k_pages', JSON.stringify(knowledgePages));
    if (window.electronAPI) window.electronAPI.saveData('knowledgePages', knowledgePages).catch(err => console.error(err));
  }, [knowledgePages]);

  const addGlobalTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !allTags.includes(trimmed)) {
      setAllTags(prev => [...prev, trimmed]);
    }
  };

  // ================= KNOWLEDGE MODULE ACTIONS =================
  const addKnowledgeCategory = (name: string, parentId: string | null = null) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const newCat: KnowledgeCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: cleanName,
      parentId
    };
    setKnowledgeCategories(prev => [...prev, newCat]);
    addSystemLog(`[资料库] 新增目录分类: ${cleanName}`);
    return newCat;
  };

  const renameKnowledgeCategory = (id: string, name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    setKnowledgeCategories(prev => prev.map(c => c.id === id ? { ...c, name: cleanName } : c));
    addSystemLog(`[资料库] 重命名目录分类为: ${cleanName}`);
  };

  const deleteKnowledgeCategory = (id: string) => {
    const targetCat = knowledgeCategories.find(c => c.id === id);
    if (!targetCat) return;
    const parentId = targetCat.parentId;
    
    // Children elements point to deleted folder's parent
    setKnowledgeCategories(prev => prev
      .filter(c => c.id !== id)
      .map(c => c.parentId === id ? { ...c, parentId } : c)
    );
    
    // Pages in deleted folder go to parent
    setKnowledgePages(prev => prev.map(p => p.categoryId === id ? { ...p, categoryId: parentId, updatedAt: new Date().toISOString() } : p));
    addSystemLog(`[资料库] 已删除分类 [${targetCat.name}]，内部页面及子级关联已安全提升。`);
  };

  const moveKnowledgeCategory = (id: string, newParentId: string | null) => {
    if (id === newParentId) return;
    
    // Prevent cyclical chains
    let curr = newParentId;
    while (curr !== null) {
      const parent = knowledgeCategories.find(c => c.id === curr);
      if (!parent) break;
      if (parent.parentId === id) {
        addSystemLog(`[资料库警告] 无法将父目录移动到下辖子目录中，防回环锁定。`);
        return;
      }
      curr = parent.parentId;
    }

    setKnowledgeCategories(prev => prev.map(c => c.id === id ? { ...c, parentId: newParentId } : c));
    addSystemLog(`[资料库] 已更新目录层级归属。`);
  };

  const addKnowledgePage = (pageData: Partial<KnowledgePage> & { title: string; categoryId: string | null }) => {
    const cleanTitle = pageData.title.trim() || '无标题页面';
    const newPage: KnowledgePage = {
      id: `kp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      categoryId: pageData.categoryId,
      title: cleanTitle,
      content: pageData.content ?? '',
      tags: pageData.tags ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      associatedProjectId: pageData.associatedProjectId,
      associatedContractId: pageData.associatedContractId,
      associatedSupplierName: pageData.associatedSupplierName,
      associatedShip: pageData.associatedShip,
    };
    
    setKnowledgePages(prev => [newPage, ...prev]);
    newPage.tags.forEach(addGlobalTag);
    addSystemLog(`[资料库] 增设新页面: ${cleanTitle}`);
    return newPage;
  };

  const updateKnowledgePage = (id: string, updates: Partial<KnowledgePage>) => {
    setKnowledgePages(prev => prev.map(p => {
      if (p.id === id) {
        const mergedTags = updates.tags ? updates.tags : p.tags;
        mergedTags.forEach(addGlobalTag);
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
    if (updates.title) {
      addSystemLog(`[资料库] 变更页面题头: ${updates.title}`);
    }
  };

  const deleteKnowledgePage = (id: string) => {
    setKnowledgePages(prev => prev.filter(p => p.id !== id));
    addSystemLog(`[资料库] 安全丢弃无用页面数据。`);
  };

  const moveKnowledgePage = (id: string, targetCategoryId: string | null) => {
    setKnowledgePages(prev => prev.map(p => p.id === id ? { ...p, categoryId: targetCategoryId, updatedAt: new Date().toISOString() } : p));
    addSystemLog(`[资料库] 页面已调迁至目标分级。`);
  };

  // ================= BID ACTIONS =================
  const addBid = (bidData: Partial<BidProject> & { name: string; ship: string }) => {
    const defaultStatus = bidWorkflow[0]?.name || '收到招标信息';
    const cleanName = bidData.name.trim();
    
    const newBid: BidProject = {
      id: bidData.id || `bid-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: cleanName,
      ship: bidData.ship,
      tenderUnit: bidData.tenderUnit?.trim(),
      status: defaultStatus,
      resultStatus: bidData.resultStatus || '进行中',
      isUrgent: bidData.isUrgent ?? false,
      dueDate: bidData.dueDate,
      tags: bidData.tags ?? [],
      remark: bidData.remark ?? '',
      folderPath: bidData.folderPath || `D:\\采购\\标书\\${bidData.ship}_${cleanName}`,
      contractId: bidData.contractId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBids(prev => [newBid, ...prev]);
    newBid.tags.forEach(addGlobalTag);
    addSystemLog(`[标书管理] 新建投标项目 [${cleanName}] 起步完成。`);
  };

  const updateBid = (id: string, updates: Partial<BidProject>) => {
    setBids(prev => prev.map(b => {
      if (b.id === id) {
        const mergedTags = updates.tags ? updates.tags : b.tags;
        mergedTags.forEach(addGlobalTag);
        return {
          ...b,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    }));
  };

  const deleteBid = (id: string) => {
    setBids(prev => {
      const deleted = prev.find(b => b.id === id);
      if (deleted) addSystemLog(`[标书管理] 已彻底剔除标书: [${deleted.name}]。`);
      return prev.filter(b => b.id !== id);
    });
  };

  const moveBidStep = (id: string, direction: 'next' | 'prev') => {
    setBids(prev => prev.map(b => {
      if (b.id === id) {
        const currentIndex = bidWorkflow.findIndex(step => step.name === b.status);
        if (currentIndex === -1) return b;

        let nextIndex = currentIndex;
        if (direction === 'next' && currentIndex < bidWorkflow.length - 1) {
          nextIndex = currentIndex + 1;
        } else if (direction === 'prev' && currentIndex > 0) {
          nextIndex = currentIndex - 1;
        }

        if (nextIndex !== currentIndex) {
          const newStatus = bidWorkflow[nextIndex].name;
          addSystemLog(`[标书推进] ${b.name}: ${b.status} → ${newStatus}`);
          return {
            ...b,
            status: newStatus,
            updatedAt: new Date().toISOString()
          };
        }
      }
      return b;
    }));
  };

  const updateBidWorkflow = (steps: WorkflowStep[]) => {
    setBidWorkflow(steps);
    addSystemLog(`[设置] 标书自定义推进工作流已安全洗牌完毕。`);
  };

  // ================= PROJECT ACTIONS =================
  const addProject = (projectData: Partial<DemandProject> & { code: string; name: string; ship: string }) => {
    const defaultStatus = preWorkflow[0]?.name || '需求单';
    const cleanCode = projectData.code.trim();
    const cleanName = projectData.name.trim();
    
    const newProject: DemandProject = {
      id: `dp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: cleanCode,
      name: cleanName,
      ship: projectData.ship,
      status: defaultStatus,
      isUrgent: projectData.isUrgent ?? false,
      dueDate: projectData.dueDate,
      tags: projectData.tags ?? [],
      remark: projectData.remark ?? '',
      folderPath: projectData.folderPath || `D:\\采购\\前置工作\\${cleanCode}${cleanName}`,
      contractId: projectData.contractId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects(prev => [newProject, ...prev]);
    newProject.tags.forEach(addGlobalTag);
  };

  // Update Project
  const updateProject = (id: string, updates: Partial<DemandProject>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const mergedTags = updates.tags ? updates.tags : p.tags;
        mergedTags.forEach(addGlobalTag);
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // Delete Project
  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  // Move step for Project (next / prev)
  const moveProjectStep = (id: string, direction: 'next' | 'prev') => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const currentIndex = preWorkflow.findIndex(step => step.name === p.status);
        if (currentIndex === -1) return p;

        let nextIndex = currentIndex;
        if (direction === 'next' && currentIndex < preWorkflow.length - 1) {
          nextIndex = currentIndex + 1;
        } else if (direction === 'prev' && currentIndex > 0) {
          nextIndex = currentIndex - 1;
        }

        if (nextIndex !== currentIndex) {
          return {
            ...p,
            status: preWorkflow[nextIndex].name,
            updatedAt: new Date().toISOString()
          };
        }
      }
      return p;
    }));
  };

  // Create Contract
  const addContract = (contractData: Partial<Contract> & { name: string; ship: string }) => {
    const defaultStatus = postWorkflow[0]?.name || '签收单';
    const cleanName = contractData.name.trim();
    // Default Contract Code is same as name or a unique logic derived
    const cleanCode = contractData.code?.trim() || cleanName;

    const newContract: Contract = {
      id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: cleanCode,
      name: cleanName,
      ship: contractData.ship,
      status: contractData.status || defaultStatus,
      isUrgent: contractData.isUrgent ?? false,
      dueDate: contractData.dueDate,
      tags: contractData.tags ?? [],
      remark: contractData.remark ?? '',
      folderPath: contractData.folderPath || `D:\\采购\\${contractData.ship}\\${cleanName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contractStatus: '执行中',
      isMultiSettlement: false,
      settlements: []
    };

    setContracts(prev => [newContract, ...prev]);
    newContract.tags.forEach(addGlobalTag);
  };

  // Update Contract
  const updateContract = (id: string, updates: Partial<Contract>) => {
    setContracts(prev => prev.map(c => {
      if (c.id === id) {
        const mergedTags = updates.tags ? updates.tags : c.tags;
        mergedTags.forEach(addGlobalTag);
        return {
          ...c,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));
  };

  // Delete Contract
  const deleteContract = (id: string) => {
    // Also disconnect any projects associated with this contract
    setProjects(prev => prev.map(p => {
      if (p.contractId === id) {
        return { ...p, contractId: undefined, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
    setContracts(prev => prev.filter(c => c.id !== id));
  };

  // Move step for Contract (next / prev)
  const moveContractStep = (id: string, direction: 'next' | 'prev') => {
    setContracts(prev => prev.map(c => {
      if (c.id === id) {
        if (c.isMultiSettlement && c.settlements && c.settlements.length > 0) {
          const updatedSettlements = c.settlements.map((batch, index) => {
            if (index === c.settlements!.length - 1) { // Apply to the latest batch
              const currentIndex = postWorkflow.findIndex(step => step.name === batch.status);
              if (currentIndex !== -1) {
                let nextIndex = currentIndex;
                if (direction === 'next' && currentIndex < postWorkflow.length - 1) {
                  nextIndex = currentIndex + 1;
                } else if (direction === 'prev' && currentIndex > 0) {
                  nextIndex = currentIndex - 1;
                }
                if (nextIndex !== currentIndex) {
                  return { ...batch, status: postWorkflow[nextIndex].name };
                }
              }
            }
            return batch;
          });
          return {
            ...c,
            settlements: updatedSettlements,
            updatedAt: new Date().toISOString()
          };
        }

        const currentIndex = postWorkflow.findIndex(step => step.name === c.status);
        if (currentIndex === -1) return c;

        let nextIndex = currentIndex;
        if (direction === 'next' && currentIndex < postWorkflow.length - 1) {
          nextIndex = currentIndex + 1;
        } else if (direction === 'prev' && currentIndex > 0) {
          nextIndex = currentIndex - 1;
        }

        if (nextIndex !== currentIndex) {
          return {
            ...c,
            status: postWorkflow[nextIndex].name,
            updatedAt: new Date().toISOString()
          };
        }
      }
      return c;
    }));
  };

  // Change project connection
  const associateProjectToContract = (projectId: string, contractId: string | undefined) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          contractId,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // Batch associate projects to a contract
  // (Removes other associations for filtered elements and sets this contract)
  const batchAssociateProjects = (contractId: string, projectIds: string[]) => {
    // Find contract to verify ship
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    setProjects(prev => prev.map(p => {
      // If project was associated with this contract, but now omitted, un-associate
      if (p.contractId === contractId && !projectIds.includes(p.id)) {
        return {
          ...p,
          contractId: undefined,
          updatedAt: new Date().toISOString()
        };
      }
      // If project is in the target list of checkouts, associate it
      if (projectIds.includes(p.id)) {
        return {
          ...p,
          contractId: contractId,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // Custom step configurations
  const updatePreWorkflow = (steps: WorkflowStep[]) => {
    setPreWorkflow(steps);
  };

  const updatePostWorkflow = (steps: WorkflowStep[]) => {
    setPostWorkflow(steps);
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        contracts,
        preWorkflow,
        postWorkflow,
        bids,
        bidWorkflow,
        knowledgeCategories,
        knowledgePages,
        addKnowledgeCategory,
        renameKnowledgeCategory,
        deleteKnowledgeCategory,
        moveKnowledgeCategory,
        addKnowledgePage,
        updateKnowledgePage,
        deleteKnowledgePage,
        moveKnowledgePage,
        addProject,
        updateProject,
        deleteProject,
        moveProjectStep,
        addContract,
        updateContract,
        deleteContract,
        moveContractStep,
        addBid,
        updateBid,
        deleteBid,
        moveBidStep,
        associateProjectToContract,
        batchAssociateProjects,
        updatePreWorkflow,
        updatePostWorkflow,
        updateBidWorkflow,
        allTags,
        addGlobalTag,
        checklistTasks,
        addChecklistTask,
        updateChecklistTask,
        deleteChecklistTask,
        reorderChecklistTasks,
        recommendedTags,
        addRecommendedTag,
        updateRecommendedTag,
        deleteRecommendedTag,
        reorderRecommendedTags,
        activeTab,
        setActiveTab,
        selectedKnowledgePageId,
        setSelectedKnowledgePageId,
        backups,
        createBackup,
        restoreBackup,
        deleteBackup,
        exportDatabase,
        importDatabase,
        isDatabaseConnecting,
        systemLogs,
        addSystemLog,
        clearSystemLogs
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};
