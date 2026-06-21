import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { ItemDetailsModal } from './ItemDetailsModal';
import { AlertCircle, ArrowUpRight, CheckSquare, Layers, Clock, AlertOctagon, HelpCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { projects, contracts, preWorkflow, postWorkflow } = useAppState();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'project' | 'contract' | null>(null);

  // Track yellow (Requires immediate personal actions)
  interface ActionableItem {
    id: string;
    type: 'project' | 'contract';
    code?: string;
    name: string;
    status: string;
    ship: string;
    remark?: string;
    isUrgent: boolean;
  }
  const actionableItems: ActionableItem[] = [];

  // Helper to resolve color of a project status
  const getProjectStatusColor = (statusName: string) => {
    const step = preWorkflow.find(s => s.name === statusName);
    return step ? step.color : 'green';
  };

  // Helper to resolve color of a contract status
  const getContractStatusColor = (statusName: string) => {
    const step = postWorkflow.find(s => s.name === statusName);
    return step ? step.color : 'green';
  };

  // Derive counts - non-blue status items
  const totalProjects = projects.filter(p => {
    return getProjectStatusColor(p.status) !== 'blue';
  }).length;

  const totalContracts = contracts.filter(c => {
    if (c.contractStatus === '已完成' || c.contractStatus === '已终止') return false;
    return getContractStatusColor(c.status) !== 'blue';
  }).length;

  // Let's count statuses by color
  let yellowCount = 0;
  let greenCount = 0;
  let blueCount = 0;
  let redCount = 0;

  projects.forEach(p => {
    const col = getProjectStatusColor(p.status);
    if (col === 'blue') return;
    if (col === 'yellow') {
      yellowCount++;
      actionableItems.push({
        id: p.id,
        type: 'project',
        code: p.code,
        name: p.name,
        status: p.status,
        ship: p.ship,
        remark: p.remark,
        isUrgent: p.isUrgent
      });
    } else if (col === 'green') {
      greenCount++;
    } else if (col === 'blue') {
      blueCount++;
    } else if (col === 'red') {
      redCount++;
    }
  });

  contracts.forEach(c => {
    if (c.contractStatus === '已完成' || c.contractStatus === '已终止') return;
    const col = getContractStatusColor(c.status);
    if (col === 'blue') return;
    if (col === 'yellow') {
      yellowCount++;
      actionableItems.push({
        id: c.id,
        type: 'contract',
        code: c.code,
        name: c.name,
        status: c.status,
        ship: c.ship,
        remark: c.remark,
        isUrgent: c.isUrgent
      });
    } else if (col === 'green') {
      greenCount++;
    } else if (col === 'blue') {
      blueCount++;
    } else if (col === 'red') {
      redCount++;
    }
  });

  const handleOpenItem = (id: string, type: 'project' | 'contract') => {
    setSelectedItemId(id);
    setSelectedItemType(type);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <span>工作台概览</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            单人采购商务专属。无缝追踪物料招标比价及合同结算结算，保持桌面文件归档与业务进程同步。
          </p>
        </div>
        <div className="text-xs bg-slate-100 hover:bg-slate-200/50 border border-slate-200/50 px-3 py-1.5 rounded-md text-slate-600 font-mono flex items-center space-x-1.5 shadow-3xs self-start sm:self-center transition-all">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
          <span>北京时间: 2026-06-21 14:30</span>
        </div>
      </div>

      {/* Dashboard Stats (High Density 5-column layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        
        {/* Box 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs hover:shadow-xs transition-shadow">
          <div className="text-xs font-semibold text-slate-500 mb-1">需求项目 (前置)</div>
          <div className="text-2xl font-bold text-slate-800 font-mono">{String(totalProjects).padStart(2, '0')}</div>
        </div>

        {/* Box 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs hover:shadow-xs transition-shadow">
          <div className="text-xs font-semibold text-slate-500 mb-1">合同数量 (后置)</div>
          <div className="text-2xl font-bold text-slate-800 font-mono">{String(totalContracts).padStart(2, '0')}</div>
        </div>

        {/* Box 3 */}
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-3xs hover:shadow-xs transition-shadow">
          <div className="text-xs font-semibold text-amber-600 mb-1">需要处理</div>
          <div className="text-2xl font-bold text-amber-600 font-mono">{String(yellowCount).padStart(2, '0')}</div>
        </div>

        {/* Box 4 */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-3xs hover:shadow-xs transition-shadow">
          <div className="text-xs font-semibold text-emerald-600 mb-1">等待审核</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">{String(greenCount).padStart(2, '0')}</div>
        </div>

        {/* Box 5 */}
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 shadow-3xs hover:shadow-xs transition-shadow">
          <div className="text-xs font-semibold text-rose-600 mb-1">异常状态</div>
          <div className="text-2xl font-bold text-rose-600 font-mono">{String(redCount).padStart(2, '0')}</div>
        </div>
      </div>

      {/* Main View: Need My Action */}
      <div className="flex flex-col space-y-3 pt-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold flex items-center text-slate-800">
            <span className="w-2 h-4 bg-amber-400 rounded mr-2"></span>
            需要我处理待办事项
          </h2>
          <span className="text-xs text-slate-400">按紧急程度与优先级排序</span>
        </div>

        {actionableItems.length === 0 ? (
          <div className="p-8 bg-white border border-slate-200/80 rounded-xl text-center text-slate-500 text-xs shadow-3xs">
            🎉 干净整洁！无急需处理的单项前置/后置采购流转。
          </div>
        ) : (
          <div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {actionableItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleOpenItem(item.id, item.type)}
                  className="group bg-white p-4 rounded-lg border-l-4 border-l-amber-400 border border-slate-200 shadow-3xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {item.code || '00'}
                      </span>
                      <h3 className="font-bold text-xs text-slate-800 line-clamp-1 flex-1">{item.name}</h3>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded">
                        {item.ship}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-medium rounded border border-amber-100">
                        🟡 {item.status}
                      </span>
                      {item.isUrgent && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[11px] font-bold rounded border border-rose-100">
                          🔴 紧急
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Item details modal */}
      {selectedItemId && selectedItemType && (
        <ItemDetailsModal
          itemId={selectedItemId}
          type={selectedItemType}
          onClose={() => {
            setSelectedItemId(null);
            setSelectedItemType(null);
          }}
        />
      )}

    </div>
  );
};
