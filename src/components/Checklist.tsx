import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { ChecklistTask } from '../types';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Flame, 
  ChevronRight, 
  X, 
  GripVertical,
  Check
} from 'lucide-react';

export const Checklist: React.FC = () => {
  const {
    checklistTasks,
    addChecklistTask,
    updateChecklistTask,
    deleteChecklistTask,
    reorderChecklistTasks
  } = useAppState();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Drag and Drop ordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const selectedTask = checklistTasks.find(t => t.id === selectedTaskId);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = newTaskTitle.trim();
      if (trimmed) {
        addChecklistTask(trimmed);
        setNewTaskTitle('');
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    
    const updated = [...checklistTasks];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);
    
    reorderChecklistTasks(updated);
    setDraggedIndex(null);
  };

  const handleToggleComplete = (task: ChecklistTask) => {
    updateChecklistTask(task.id, { completed: !task.completed });
  };

  const handleUpdateField = (field: keyof ChecklistTask, value: any) => {
    if (!selectedTaskId) return;
    updateChecklistTask(selectedTaskId, { [field]: value });
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('确认删除此个人待办任务吗？')) {
      deleteChecklistTask(id);
      if (selectedTaskId === id) setSelectedTaskId(null);
    }
  };

  // Filter tasks
  const todoTasks = checklistTasks.filter(t => !t.completed);
  const completedTasks = checklistTasks.filter(t => t.completed);

  return (
    <div className="bg-slate-50 rounded-xl overflow-hidden shadow-xs flex flex-col md:flex-row h-[78vh] md:h-[82vh] border border-slate-205">
      
      {/* Task List Workspace */}
      <div className="flex-1 p-5 md:p-6 flex flex-col h-full bg-white max-w-full">
        
        {/* Module Title and Info */}
        <div className="flex items-center space-x-2.5 mb-5 select-none shrink-0 border-b border-slate-100 pb-3">
          <ClipboardList size={18} className="text-blue-600" />
          <div>
            <h1 className="text-base font-bold text-slate-800">清单</h1>
            <p className="text-[10px] text-slate-400">采购流程之外的个人待办记事板，回车闪存，支持拖动换序</p>
          </div>
        </div>

        {/* Quick Add Input Bar */}
        <div className="relative mb-5 shrink-0">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="添加任务，按回车立即保存..."
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-lg py-2.5 pl-4 pr-10 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-3xs"
          />
          <button
            onClick={() => {
              if (newTaskTitle.trim()) {
                addChecklistTask(newTaskTitle.trim());
                setNewTaskTitle('');
              }
            }}
            className="absolute right-2 top-2 p-1 text-blue-500 hover:text-blue-700 bg-white shadow-3xs rounded-md border border-slate-200 cursor-pointer"
            title="添加任务"
          >
            <Plus size={14} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Scrolling list sections */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 select-none">
          
          {/* Todo area */}
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">待办中的事项 ({todoTasks.length})</span>
              <span className="text-[9px] text-slate-400">拖拽手柄可重新排定优先级</span>
            </div>
            
            {todoTasks.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200/60 text-slate-400 text-xs">
                ☕️ 完美！暂无任何待办，享用一杯茶吧！
              </div>
            ) : (
              <div className="space-y-1.5">
                {todoTasks.map((task, index) => {
                  const globalIdx = checklistTasks.findIndex(t => t.id === task.id);
                  const isSelected = selectedTaskId === task.id;
                  
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, globalIdx)}
                      onDragOver={(e) => handleDragOver(e, globalIdx)}
                      onDrop={(e) => handleDrop(e, globalIdx)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-all group ${
                        isSelected 
                          ? 'bg-blue-50/40 border-blue-200 shadow-3xs' 
                          : 'bg-white border-slate-200/80 shadow-3xs hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        {/* Drag and Drop Drag Handle */}
                        <div className="cursor-grab active:cursor-grabbing p-0.5 text-slate-350 hover:text-slate-450 rounded hover:bg-slate-50 transition-colors shrink-0">
                          <GripVertical size={13} />
                        </div>

                        {/* Custom status toggle */}
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className="text-slate-400 hover:text-blue-500 transition-colors shrink-0 cursor-pointer"
                        >
                          <Circle size={15} />
                        </button>

                        <button
                          onClick={() => setSelectedTaskId(task.id)}
                          className="flex-1 text-left truncate hover:text-blue-600 transition-colors text-slate-800"
                        >
                          <div className="flex items-center space-x-1.5 min-w-0">
                            {task.isUrgent && (
                              <span className="inline-flex items-center bg-red-50 text-red-700 px-1.5 py-0.2 rounded text-[9px] font-bold border border-red-100/60 flex-shrink-0 animate-pulse">
                                <Flame size={10} className="mr-0.5 shrink-0" />
                                紧急
                              </span>
                            )}
                            <span className="truncate">{task.title}</span>
                          </div>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 pl-2">
                        {task.dueDate && (
                          <span className="text-[9px] font-bold text-slate-400 font-mono bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 rounded flex items-center">
                            <Calendar size={10} className="mr-1 opacity-60" />
                            {task.dueDate}
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`p-1 rounded hover:bg-slate-100 text-slate-450 hover:text-slate-750 transition-all ${isSelected ? 'text-blue-600 bg-blue-50/50' : 'opacity-0 group-hover:opacity-100'}`}
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Connected Completed Area */}
          <div>
            <div className="px-1 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">已完成的事项 ({completedTasks.length})</span>
            </div>
            
            {completedTasks.length === 0 ? (
              <div className="text-center py-4 text-slate-450 text-[11px] italic">
                无完成记录
              </div>
            ) : (
              <div className="space-y-1 bg-slate-50/45 p-1 rounded-xl border border-slate-200/40">
                {completedTasks.map(task => {
                  const isSelected = selectedTaskId === task.id;
                  
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all group ${
                        isSelected 
                          ? 'bg-blue-50/15 border border-blue-100 shadow-3xs' 
                          : 'bg-transparent hover:bg-white text-slate-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1 pl-1">
                        {/* Custom status checkbox */}
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className="text-emerald-500 hover:text-slate-405 hover:text-slate-400 transition-colors shrink-0 cursor-pointer"
                        >
                          <CheckCircle2 size={15} />
                        </button>

                        <button
                          onClick={() => setSelectedTaskId(task.id)}
                          className="flex-1 text-left truncate hover:text-blue-600 transition-colors line-through decoration-slate-300 text-slate-400"
                        >
                          <span className="truncate">{task.title}</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 pl-1">
                        <button
                          onClick={() => setSelectedTaskId(task.id)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-450 hover:text-slate-750 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Task Details Side-Panel */}
      {selectedTask && (
        <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col h-full animate-slide-in select-none">
          
          {/* Details header */}
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">📝 任务明细</span>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Details fields panel */}
          <div className="flex-1 p-4 space-y-4.5 overflow-y-auto">
            
            {/* Title display/rename */}
            <div>
              <label className="block text-[10px] font-bold text-slate-401 text-slate-400 uppercase tracking-widest mb-1">
                任务内容名称
              </label>
              <input
                type="text"
                value={selectedTask.title}
                onChange={(e) => handleUpdateField('title', e.target.value)}
                className="w-full px-2.5 py-1.8 border border-slate-200 focus:border-blue-500 focus:bg-white bg-white rounded-md text-xs font-semibold text-slate-800 transition-all focus:outline-none"
              />
            </div>

            {/* Is completed checkbox toggle card */}
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/80 shadow-3xs">
              <span className="text-slate-750 text-xs font-bold">任务完成状态</span>
              <button
                onClick={() => handleToggleComplete(selectedTask)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md border flex items-center space-x-1 cursor-pointer transition-all ${
                  selectedTask.completed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {selectedTask.completed ? <Check size={11} className="stroke-[3]" /> : null}
                <span>{selectedTask.completed ? '已完成' : '未完成'}</span>
              </button>
            </div>

            {/* Emergency status 🔥 */}
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/80 shadow-3xs">
              <span className="text-slate-750 text-xs font-bold">标记为「🔥 紧急」</span>
              <button
                onClick={() => handleUpdateField('isUrgent', !selectedTask.isUrgent)}
                className={`h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
                  selectedTask.isUrgent ? 'bg-red-500 flex justify-end' : 'bg-slate-200 flex justify-start'
                }`}
              >
                <span className="h-5 w-5 rounded-full bg-white shadow-xs flex items-center justify-center">
                  {selectedTask.isUrgent ? '🔥' : ''}
                </span>
              </button>
            </div>

            {/* Due date Calendar picker value */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                截止完成日期 (可选)
              </label>
              <input
                type="date"
                value={selectedTask.dueDate || ''}
                onChange={(e) => handleUpdateField('dueDate', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white"
              />
            </div>

            {/* Large text notes area */}
            <div>
              <label className="block text-[10px] font-bold text-slate-451 text-slate-400 uppercase tracking-widest mb-1">
                备忘便签 / 任务备注
              </label>
              <textarea
                rows={5}
                value={selectedTask.notes || ''}
                onChange={(e) => handleUpdateField('notes', e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-xs text-slate-755 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white font-sans leading-relaxed"
                placeholder="在此记下该待办的详细要求、对接电话、物资清单、快递单号..."
              />
            </div>

          </div>

          {/* Delete Task Footer Button */}
          <div className="p-3 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
            <span className="text-[9px] font-mono text-slate-400">
              更新于: {new Date(selectedTask.updatedAt).toLocaleDateString()}
            </span>
            <button
              onClick={() => handleDeleteTask(selectedTask.id)}
              className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md border border-rose-100 flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <Trash2 size={11} />
              <span>删除任务</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
