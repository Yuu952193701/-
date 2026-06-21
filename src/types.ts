export type ColorState = 'yellow' | 'green' | 'blue' | 'red';

export interface WorkflowStep {
  id: string;
  name: string;
  color: ColorState;
}

export interface DemandProject {
  id: string; // Internal UUID
  code: string; // 项目编号 (unique-ish)
  name: string; // 项目名称
  ship: string; // 所属船舶
  status: string; // 当前状态 (corresponds to step name)
  isUrgent: boolean; // 是否紧急
  dueDate?: string; // 截止日期 (YYYY-MM-DD or empty)
  tags: string[]; // 自定义标签
  remark: string; // 备注
  folderPath: string; // 文件夹路径
  contractId?: string; // 关联合同ID (Nullable)
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string; // Internal UUID or contract logic
  code: string; // 合同编号 index (custom or user input, often contract ID itself)
  name: string; // 合同名称
  ship: string; // 所属船舶
  status: string; // 当前状态 (corresponds to step name)
  isUrgent: boolean; // 是否紧急
  dueDate?: string; // 截止日期
  tags: string[]; // 自定义标签
  remark: string; // 备注
  folderPath: string; // 文件夹路径
  createdAt: string;
  updatedAt: string;

  // 新增：合同独立状态
  contractStatus?: '执行中' | '已完成' | '已终止';
  // 新增：多次结算开关和批次列表
  isMultiSettlement?: boolean;
  settlements?: SettlementBatch[];
}

export interface SettlementBatch {
  id: string;
  name: string;      // 批次名称, 如 "第1期结算"
  status: string;    // 该批次的结算流程状态 (签收单 → 对账单 → 审核 → 付款申请 → 付款审批 → 付款完成)
  dueDate?: string;  // 要求截止日期
  remark?: string;   // 批次备注说明
}

export const SHIPS = [
  '鸿鹄01',
  '鸿鹄02',
  '鸿鹄03',
  '鲲鹏01',
  '德京108'
] as const;

export type ShipType = typeof SHIPS[number];

export interface BackupFile {
  filename: string;
  timestamp: string;      // ISO format String
  formattedDate: string;  // YYYY-MM-DD
  type: 'auto' | 'manual';
  size: string;           // Simulated size, e.g. "24.5 KB"
  data: string;           // Serialized string containing full state (projects, contracts, workflows, tags)
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  parentId: string | null; // For hierarchy adjustment
}

export interface KnowledgePage {
  id: string;
  categoryId: string | null; // Folder association (null means root)
  title: string;
  content: string; // Plaintext or Markdown text content
  tags: string[];
  createdAt: string;
  updatedAt: string;
  
  // Future linkage preview capability fields (reserved)
  associatedProjectId?: string; // Links to demand project (DemandProject)
  associatedContractId?: string; // Links to contract (Contract)
  associatedSupplierName?: string; // Links to supplier name text
  associatedShip?: string; // Ship model
}

export interface BidProject {
  id: string; // Internal UUID
  name: string; // 标书名称
  ship: string; // 所属船舶 (One of SHIPS)
  tenderUnit?: string; // 招标单位
  status: string; // 当前状态 (corresponds to step name)
  resultStatus: '进行中' | '已中标' | '未中标' | '已终止'; // 结果状态
  isUrgent: boolean; // 是否紧急
  dueDate?: string; // 截止日期 (YYYY-MM-DD)
  tags: string[]; // 自定义标签
  remark: string; // 备注
  folderPath: string; // 文件夹路径
  createdAt: string;
  updatedAt: string;
}


