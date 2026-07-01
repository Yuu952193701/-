import { WorkflowStep, DemandProject, Contract, KnowledgeCategory, KnowledgePage, BidProject } from './types';

export const DEFAULT_PRE_STEPS: WorkflowStep[] = [
  { id: 'p1', name: '需求单', color: 'green' },
  { id: 'p2', name: '制作询价表', color: 'yellow' },
  { id: 'p3', name: '等待报价', color: 'green' },
  { id: 'p4', name: '制作比价表', color: 'yellow' },
  { id: 'p5', name: '制作会签单', color: 'yellow' },
  { id: 'p6', name: '制作合同', color: 'yellow' },
  { id: 'p7', name: '合同审核中', color: 'green' },
  { id: 'p8', name: '合同审核完成', color: 'blue' },
  { id: 'p9', name: '流程结束', color: 'blue' },
];

export const DEFAULT_POST_STEPS: WorkflowStep[] = [
  { id: 'post1', name: '签收单', color: 'green' },
  { id: 'post2', name: '对账单', color: 'yellow' },
  { id: 'post3', name: '审核', color: 'yellow' },
  { id: 'post4', name: '付款申请', color: 'yellow' },
  { id: 'post5', name: '付款审批', color: 'green' },
  { id: 'post6', name: '付款完成', color: 'blue' },
  { id: 'post7', name: '🟢 合同执行中', color: 'green' },
];

export const DEFAULT_POST_SERVICE_STEPS: WorkflowStep[] = [
  { id: 'post_svc1', name: '签收单', color: 'green' },
  { id: 'post_svc2', name: '对账单', color: 'yellow' },
  { id: 'post_svc3', name: '审核', color: 'yellow' },
  { id: 'post_svc4', name: '付款申请', color: 'yellow' },
  { id: 'post_svc5', name: '付款审批', color: 'green' },
  { id: 'post_svc6', name: '付款完成', color: 'blue' },
  { id: 'post_svc7', name: '🟢 合同执行中', color: 'green' },
];

export const DEFAULT_BID_STEPS: WorkflowStep[] = [
  { id: 'b1', name: '收到招标信息', color: 'green' },
  { id: 'b2', name: '阅读招标文件', color: 'yellow' },
  { id: 'b3', name: '制作投标文件', color: 'yellow' },
  { id: 'b4', name: '自查文件', color: 'yellow' },
  { id: 'b5', name: '小组审核', color: 'green' },
  { id: 'b6', name: '张总审核', color: 'green' },
  { id: 'b7', name: '杨总签字', color: 'green' },
  { id: 'b8', name: '提交投标', color: 'yellow' },
  { id: 'b9', name: '等待领导通知', color: 'green' }
];

// Seed Data
export const INITIAL_DEMAND_PROJECTS: DemandProject[] = [
  {
    id: 'd-001',
    code: 'A001',
    name: '机油采购',
    ship: '鸿鹄01',
    status: '制作比价表', // Yellow status
    isUrgent: true,
    dueDate: '2026-06-18', // Under current 2026-06-20, this is overdue
    tags: ['机油', '高优优先', '壳牌润滑脂'],
    remark: '已经收到3家报价：上海壳牌(3.86w)、广州美孚(4.1w)、南京中石化(3.9w)。正在核对技术规格以便制作比价表。',
    folderPath: 'D:\\采购\\前置工作\\A001机油采购',
    contractId: 'c-001',
    createdAt: '2026-06-10T10:00:00.000Z',
    updatedAt: '2026-06-19T14:30:00.000Z'
  },
  {
    id: 'd-002',
    code: 'A002',
    name: '电缆采购',
    ship: '鸿鹄01',
    status: '制作会签单',
    isUrgent: false,
    dueDate: '2026-06-28',
    tags: ['电缆', '远东电缆'],
    remark: '比价方案已定，由远东电缆供货。正制作内部商务会签单。',
    folderPath: 'D:\\采购\\前置工作\\A002电缆采购',
    contractId: 'c-001',
    createdAt: '2026-06-12T09:00:00.000Z',
    updatedAt: '2026-06-20T11:00:00.000Z'
  },
  {
    id: 'd-003',
    code: 'A003',
    name: '灯具采购',
    ship: '鸿鹄01',
    status: '需求单',
    isUrgent: false,
    tags: ['日常备件', 'LED防爆灯'],
    remark: '轮机长提交的新增防爆通道灯需求。',
    folderPath: 'D:\\采购\\前置工作\\A003灯具采购',
    contractId: 'c-001',
    createdAt: '2026-06-15T15:00:00.000Z',
    updatedAt: '2026-06-15T15:00:00.000Z'
  },
  {
    id: 'd-004',
    code: 'A007',
    name: '灯具采购',
    ship: '鸿鹄02',
    status: '制作合同', // Yellow status
    isUrgent: true,
    dueDate: '2026-06-21',
    tags: ['投光灯', '急件'],
    remark: '会签已过。需要抓紧制作德和灯具主合同草案。',
    folderPath: 'D:\\采购\\前置工作\\A007灯具采购',
    createdAt: '2026-06-14T08:00:00.000Z',
    updatedAt: '2026-06-20T16:00:00.000Z'
  },
  {
    id: 'd-005',
    code: 'A012',
    name: '锚链备件采购',
    ship: '德京108',
    status: '等待报价', // Green status
    isUrgent: false,
    dueDate: '2026-06-30',
    tags: ['锚链', '重型件'],
    remark: '询价单已发至4家锚链流转单位，对方预计下周一提供报价。',
    folderPath: 'D:\\采购\\前置工作\\A012锚链备采购',
    createdAt: '2026-06-18T10:45:00.000Z',
    updatedAt: '2026-06-20T10:45:00.000Z'
  },
  {
    id: 'd-006',
    code: 'A015',
    name: '主发电机备件',
    ship: '鲲鹏01',
    status: '流程结束', // Blue status
    isUrgent: false,
    tags: ['柴油机备件', '洋马'],
    remark: '合同已经单独订立完毕，前置项目结转后置跟踪。',
    folderPath: 'D:\\采购\\前置工作\\A015主电机采购',
    createdAt: '2026-05-20T10:00:00.000Z',
    updatedAt: '2026-06-10T16:00:00.000Z'
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'c-001',
    code: 'HH01-2026-015',
    name: 'HH01-2026-015采购合同',
    ship: '鸿鹄01',
    status: '付款申请',
    contractStatus: '执行中',
    isMultiSettlement: false,
    isUrgent: true,
    dueDate: '2026-06-25',
    tags: ['上海丰冠公司', '￥38600', '拼单合同'],
    remark: '合并了A001、A002和A003的主合同。已经到了付款申请阶段，需抓紧向公司呈批。',
    folderPath: 'D:\\采购\\鸿鹄01\\HH01-2026-015采购合同',
    createdAt: '2026-06-15T10:00:00.000Z',
    updatedAt: '2026-06-20T09:00:00.000Z'
  },
  {
    id: 'c-002',
    code: 'HH01-2026-012',
    name: 'HH01-2026-012低硫油合同',
    ship: '鸿鹄01',
    status: '签收单',
    contractStatus: '执行中',
    isMultiSettlement: false,
    isUrgent: false,
    dueDate: '2026-06-26',
    tags: ['燃油供应商', '￥128000'],
    remark: '中燃已派驳船进行加油作业，预计23日完成加注。',
    folderPath: 'D:\\采购\\鸿鹄01\\HH01-2026-012加油',
    createdAt: '2026-06-10T10:00:00.000Z',
    updatedAt: '2026-06-18T10:00:00.000Z'
  },
  {
    id: 'c-003',
    code: 'KP01-2026-009',
    name: 'KP01-2026-009防锈漆合同',
    ship: '鲲鹏01',
    status: '对账单',
    contractStatus: '执行中',
    isMultiSettlement: false,
    isUrgent: false,
    tags: ['佐敦油漆', '核减扣款'],
    remark: '到货发生局部破损拒收，需核减扣减金额后再做对账。',
    folderPath: 'D:\\采购\\鲲鹏01\\KP01-2026-009防锈漆',
    createdAt: '2026-06-05T08:00:00.000Z',
    updatedAt: '2026-06-19T13:30:00.000Z'
  },
  {
    id: 'c-004',
    code: 'DJ-2026-108-005',
    name: 'DJ-108-2026-005钢板材料合同',
    ship: '德京108',
    status: '付款审批',
    contractStatus: '执行中',
    isMultiSettlement: false,
    isUrgent: false,
    tags: ['宝钢集团'],
    remark: '付款批件已呈批到商务部长处，部长批准后下周二进入财务出纳电汇流程。',
    folderPath: 'D:\\采购\\德京108\\钢板采购合同',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-20T15:00:00.000Z'
  },
  {
    id: 'c-005',
    code: 'HH03-2026-018',
    name: 'HH03-2026-018绞泥泵配件合同',
    ship: '鸿鹄03',
    status: '付款完成',
    contractStatus: '已完成',
    isMultiSettlement: false,
    isUrgent: false,
    tags: ['已完成'],
    remark: '货款全部付讫，签收单原件、对账单原件已装袋归档完毕。',
    folderPath: 'D:\\采购\\鸿鹄03\\HH03-2026-018泵配件',
    createdAt: '2026-05-15T09:00:00.000Z',
    updatedAt: '2026-06-15T17:00:00.000Z'
  }
];

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  // System current time is 2026-06-20
  const today = new Date('2026-06-20');
  const due = new Date(dueDate);
  // Reset hours to compare dates only
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function formatChineseDate(dateStr?: string): string {
  if (!dateStr) return '';
  const [, month, day] = dateStr.split('-');
  if (!month || !day) return dateStr;
  return `⏰${parseInt(month, 10)}/${parseInt(day, 10)}`;
}
export function formatFullChineseDate(dateStr?: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
}

export const INITIAL_KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  { id: 'cat-1', name: '供应商', parentId: null },
  { id: 'cat-2', name: '对账资料', parentId: null },
  { id: 'cat-3', name: '工作记录', parentId: null },
  { id: 'cat-4', name: '船舶资料', parentId: null },
  { id: 'cat-5', name: '其他', parentId: null },
];

export const INITIAL_KNOWLEDGE_PAGES: KnowledgePage[] = [
  {
    id: 'kp-1',
    categoryId: 'cat-1',
    title: '上海丰冠船务有限公司',
    content: `# 上海丰冠船务有限公司 (供应商备忘录)

## 1. 基础信息
* **公司名称**: 上海丰冠船务有限公司
* **联系人**: 张总 / 商务总监
* **电话**: 139-1100-2200 (常用) / 021-65008032
* **邮箱**: fengkewan@fg-marine.com
* **付款账号**: 上海浦东发展银行陆家嘴支行 \`9876 5432 1012 3456\`

## 2. 合作历史与条款
* **主营产品**: 各类辅机、船用中速柴油机活塞环、高质机油滤器
* **付款约定**: 货到签收后 15 个工作日内支付 30%, 余款 70% 凭 13% 增值税专用发票 45 天账期支付。
* **信誉星级**: ⭐⭐⭐⭐⭐
* **协作说明**: 配合良好，交货极为准时。支持代办上海港急件直送，如遇紧急清关可委托其常驻代表协助办理。`,
    tags: ['供应商', '付款', '上海港', '重要'],
    createdAt: '2526-06-10T10:00:00.000Z',
    updatedAt: '2026-06-20T14:30:00.000Z',
    associatedSupplierName: '上海丰冠船务有限公司',
    associatedProjectId: 'd-001',
    associatedContractId: 'c-001'
  },
  {
    id: 'kp-2',
    categoryId: 'cat-1',
    title: '佐敦涂料上海销售处',
    content: `# 佐敦涂料上海销售处 (Jotun Paint Contact)

## 1. 业务对接人
* **联系人**: 季经理
* **电话**: 186-2244-5566
* **邮箱**: ji.manager@jotun-china.com
* **付款账号**: 中国建设银行外滩支行 \`6222 0201 9988 7766\`

## 2. 独家合作情况
* **主供货品**: 防锈底漆、防污面漆、船舶甲板耐磨特种漆。
* **作业异常预警**: 
  1. 上半年配油发现由于运输问题，到港钢桶偶尔发生微弱形变，库房收货时**必须拍照取证**。
  2. 多次出现调色批次差异，提货前需叮嘱季经理随船附带本批号质检报告。`,
    tags: ['供应商', '佐敦油漆', '破损警告'],
    createdAt: '2026-06-12T09:00:00.000Z',
    updatedAt: '2026-06-18T10:00:00.000Z',
    associatedSupplierName: '佐敦油漆',
    associatedContractId: 'c-003'
  },
  {
    id: 'kp-3',
    categoryId: 'cat-3',
    title: '船级社大考安全审批流程',
    content: `# 船级社大考安全审批流程指导手册

## 1. 主要流程说明
* **安全设施采购提报**: 轮机长/大台提前 3 个月向工务部提报安全设施采购单。
* **证书强制要求**: 特殊消防探头、救生索具必须配有 CCS 绿色检验原版证书，普通防爆灯不予通过。
* **领导指示**: 凡是金额超过 2 万元的安全装备，必须提供两家及以上资质对比表及书面选型报告。

## 2. 指南与注意事项
* 证书扫描件必须实时存档于 D盘\`\\采购\\公用文档\\CCS证书备份\`中。
* 经验记录：送船时CCS验船师抽查时，注意现场要有合格证挂牌贴。`,
    tags: ['工作记录', '审批', 'CCS证书', '上海高品质'],
    createdAt: '2026-06-15T15:00:00.000Z',
    updatedAt: '2026-06-19T11:00:00.000Z'
  },
  {
    id: 'kp-4',
    categoryId: 'cat-3',
    title: '2026年特殊备件申报规定',
    content: `# 2026年特殊备件申报规定
    
根据上海工务部及机务主管领导最新会议精神：

## 1. 洋马 (YANMAR) 主柴油发电机及相关部件申报要求
* 申报时必须**强制提供唯一图号**。
* 轮机长在采购网提交采购报表后，系统操作员需要在一周内从轮机长处索取原厂技术图纸副本或拍照确认，防止采购错规格。
* 严禁无图号、仅凭文字描述直接向供应商询价。

## 2. 其它重型部件及紧急件
* 首选国内有完备现货备库的地方供应商。`,
    tags: ['工作记录', '特殊规定', '洋马', '日常备件'],
    createdAt: '2026-06-18T10:45:00.000Z',
    updatedAt: '2026-06-20T10:45:00.000Z'
  },
  {
    id: 'kp-5',
    categoryId: 'cat-2',
    title: '鸿鹄01对账主约定',
    content: `# 鸿鹄01 对账及结算特殊约定

## 1. 付款记录与对账模式
* 散货结算及低硫油加注结算，一律需对齐大副及加注船长双重手写签字。
* 截止 2026 年 6 月，上海丰冠已完成 3 笔电汇（分别对应 HH01-2026-015），账目配平。

## 2. 供应商特殊约束
* **德和灯具**: 因返修率问题，所有付款结算必须**预留 5% 质量保证金**，待一个完整疏浚作业航次无异议后再做尾款清退。
* 收款账号请时刻确认是否是官方开户行，拒绝向个人或代收方转账。`,
    tags: ['对账资料', '付款记录', '结算说明', '质保金'],
    createdAt: '2026-06-10T10:00:00.000Z',
    updatedAt: '2026-06-20T09:00:00.000Z',
    associatedShip: '鸿鹄01'
  },
  {
    id: 'kp-6',
    categoryId: 'cat-4',
    title: '鸿鹄01技术规格参数',
    content: `# 鸿鹄01 水底挖泥疏浚轮技术参数

## 1. 船舶基本尺度
* **船舶类型**: 耙吸式挖泥船 (Trailing Suction Hopper Dredger)
* **船长 (L.O.A)**: 108.5 米
* **船宽**: 22.0 米
* **型深**: 8.2 米
* **设计吃水**: 5.5 米

## 2. 动力及主要采购部件型号
* **主发电机**: 陕柴原厂制造 YANMAR 6EY22LW (6缸，1020 kW) - 极其重要，滤器多采购此品
* **柴油底机**: 陕柴 8EY26W (4500 kW)
* **副泵机组**: 重齿 HC-750 减速箱`,
    tags: ['船舶资料', '技术参数', '鸿鹄01', '日常备件'],
    createdAt: '2026-05-15T09:00:00.000Z',
    updatedAt: '2026-06-15T17:00:00.000Z',
    associatedShip: '鸿鹄01'
  }
];

export const INITIAL_BID_PROJECTS: BidProject[] = [
  {
    id: 'bid-001',
    name: '上海港深水航道疏浚维护标书',
    ship: '德京108',
    tenderUnit: '上海海事局',
    status: '制作投标文件',
    resultStatus: '进行中',
    isUrgent: true,
    dueDate: '2026-07-15',
    tags: ['深水航道', '投标一期', '外滩段'],
    remark: '需要核对德京108泥泵的最大排量和真空度等技术指标。',
    folderPath: 'D:\\采购\\标书\\德京108_上海港维护',
    createdAt: '2026-06-18T09:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z'
  },
  {
    id: 'bid-002',
    name: '舟山海上风电场基础防冲刷回填标书',
    ship: '鸿鹄01',
    tenderUnit: '华能舟山风电公司',
    status: '等待领导通知',
    resultStatus: '已中标',
    isUrgent: false,
    dueDate: '2026-06-30',
    tags: ['海上风电', '基础防冲刷', '华能'],
    remark: '本轮已递交，技术方案杨总很满意。等待正式纸质中标通知书。',
    folderPath: 'D:\\采购\\标书\\鸿鹄01_华能舟山风电',
    createdAt: '2026-06-12T08:30:00.000Z',
    updatedAt: '2026-06-21T11:00:00.000Z'
  }
];


