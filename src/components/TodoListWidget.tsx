import React, { useState, useEffect } from "react";
import {
  Plus,
  Check,
  Trash2,
  RefreshCcw,
  Sparkles,
  Star,
  Target,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Code,
  PenTool,
  Palette,
  Clock,
  StickyNote,
  PlusCircle,
  Search,
  CheckSquare,
  AlertTriangle,
  GripVertical
} from "lucide-react";
import { motion, AnimatePresence, Reorder, useDragControls } from "motion/react";
import { Task } from "../types";

interface TodoListWidgetProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "dateCreated">) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onResetTasks: () => void;
  activeTaskId?: string | null;
  onSetActiveTaskId?: (id: string | null) => void;
  onUpdateTask?: (task: Task) => void;
  onAddCalendarEvent?: (title: string, tag: string) => void;
  onReorderTasks?: (tasks: Task[]) => void;
}

// Curated Category Tags
const CATEGORIES = [
  { id: "study", label: "Study", icon: BookOpen, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "code", label: "Code", icon: Code, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { id: "write", label: "Write", icon: PenTool, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "design", label: "Design", icon: Palette, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { id: "deep", label: "Deep Work", icon: Target, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
];

interface TaskItemProps {
  task: Task;
  isExpanded: boolean;
  isActive: boolean;
  categoryDetails: typeof CATEGORIES[0];
  onToggleTask: (id: string) => void;
  onSetActiveTaskId: (id: string | null) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  toggleExpand: (id: string, e: React.MouseEvent) => void;
  getPriorityColor: (lvl: string) => string;
  handleAdjustSessions: (task: Task, type: "est" | "act", dir: "up" | "down") => void;
  handleUpdateTag: (task: Task, tag: string) => void;
  handleUpdatePriority: (task: Task, priority: "low" | "medium" | "high") => void;
  handleUpdateNotes: (task: Task, notes: string) => void;
  handleAddSubtask: (task: Task, title: string) => void;
  handleToggleSubtask: (task: Task, subtaskId: string) => void;
  handleDeleteSubtask: (task: Task, subtaskId: string) => void;
}

function TaskItem({
  task,
  isExpanded,
  isActive,
  categoryDetails,
  onToggleTask,
  onSetActiveTaskId,
  onDeleteTask,
  onUpdateTask,
  toggleExpand,
  getPriorityColor,
  handleAdjustSessions,
  handleUpdateTag,
  handleUpdatePriority,
  handleUpdateNotes,
  handleAddSubtask,
  handleToggleSubtask,
  handleDeleteSubtask,
}: TaskItemProps) {
  const dragControls = useDragControls();
  const [localSubtaskTitle, setLocalSubtaskTitle] = useState("");
  const TagIcon = categoryDetails.icon;

  const onAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSubtaskTitle.trim()) return;
    handleAddSubtask(task, localSubtaskTitle);
    setLocalSubtaskTitle("");
  };

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-2xl transition-all overflow-hidden list-none ${
        task.completed ? "opacity-55" : ""
      } ${isActive ? "border-amber-400/40 bg-amber-400/[0.02]" : ""} ${
        isExpanded ? "ring-1 ring-white/10 bg-white/[0.06]" : ""
      }`}
    >
      {/* Task Card Header row */}
      <div
        onClick={(e) => toggleExpand(task.id, e)}
        className="flex items-center justify-between p-3 cursor-pointer group"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          {/* Drag Handle */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="p-1 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-colors mr-0.5 flex items-center justify-center shrink-0"
            title="Drag to prioritize"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Circle check trigger */}
          <button
            onClick={() => onToggleTask(task.id)}
            className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
              task.completed
                ? "bg-amber-400 border-amber-400 text-neutral-950 shadow-md shadow-amber-400/10"
                : "border-white/30 hover:border-amber-400 bg-black/20"
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
          </button>

          <div className="flex flex-col min-w-0 cursor-pointer" onClick={(e) => toggleExpand(task.id, e)}>
            <span
              className={`text-xs font-semibold text-gray-200 truncate pr-2 ${
                task.completed ? "line-through text-gray-500 font-normal" : ""
              }`}
            >
              {task.title}
            </span>
            
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {/* Priority Badge */}
              <span
                className={`text-[8px] px-1.5 py-0.2 rounded border uppercase font-bold shrink-0 ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>

              {/* Tag Indicator */}
              <span className="text-[8px] text-gray-400 flex items-center gap-0.5 px-1 bg-white/5 border border-white/5 rounded">
                <TagIcon className="w-2.5 h-2.5" />
                {categoryDetails.label}
              </span>

              {/* Sessions Count Indicator */}
              <span className="text-[8px] text-gray-500 font-mono flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5 shrink-0" />
                {task.actualSessions}/{task.estimateSessions} pomos
              </span>

              {/* Subtasks Count if any */}
              {task.subtasks && task.subtasks.length > 0 && (
                <span className="text-[8px] text-gray-400 font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/15 px-1 rounded flex items-center gap-0.5">
                  <CheckSquare className="w-2.5 h-2.5" />
                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                </span>
              )}
            </div>

            {/* Session Progress Bar */}
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2 max-w-[200px]">
              <div 
                className="h-full bg-amber-500/80 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (task.actualSessions / Math.max(1, task.estimateSessions)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions and expand button */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Set focus task button */}
          {!task.completed && (
            <button
              onClick={() => onSetActiveTaskId(isActive ? null : task.id)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-400 border-amber-400 text-neutral-950 shadow-md"
                  : "bg-white/5 border-white/5 text-gray-400 hover:text-amber-400 hover:border-amber-400/30"
              }`}
              title={isActive ? "Deactivate target" : "Set as current active target"}
            >
              <Target className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Expand toggle */}
          <button
            onClick={(e) => toggleExpand(task.id, e)}
            className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Toggle Subtasks & Notes"
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Delete task button */}
          <button
            onClick={() => onDeleteTask(task.id)}
            className="p-1.5 bg-rose-500/5 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-lg transition-all border border-transparent hover:border-rose-500/10 cursor-pointer"
            title="Delete Task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Accordion Expansion Panel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-t border-white/5 bg-black/40 p-4 space-y-4"
          >
            {/* Subtasks checklist section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" /> Subtasks Checklist
                </h5>
                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="text-[10px] font-mono text-gray-400">
                    {Math.round(
                      ((task.subtasks.filter((s) => s.completed).length) /
                        task.subtasks.length) *
                        100
                    ) || 0}
                    % Complete
                  </span>
                )}
              </div>

              {/* Mini progress bar */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((task.subtasks.filter((s) => s.completed).length) /
                          task.subtasks.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              )}

              {/* Subtasks listing */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                {task.subtasks?.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-2 bg-white/[0.02] border border-white/5 rounded-lg group/sub"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(task, st.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                          st.completed
                            ? "bg-purple-500 border-purple-500 text-white"
                            : "border-white/20 hover:border-purple-400 bg-black/10"
                        }`}
                      >
                        {st.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>
                      <span
                        className={`text-[11px] font-sans text-gray-300 truncate ${
                          st.completed ? "line-through text-gray-500" : ""
                        }`}
                      >
                        {st.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(task, st.id)}
                      className="opacity-0 group-hover/sub:opacity-100 p-1 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                      title="Delete Subtask"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick Add Subtask Form */}
              <form
                onSubmit={onAddSubtaskSubmit}
                className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1"
              >
                <input
                  type="text"
                  placeholder="New subtask..."
                  value={localSubtaskTitle}
                  onChange={(e) => setLocalSubtaskTitle(e.target.value)}
                  className="w-full bg-transparent text-[11px] text-gray-200 placeholder-gray-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1 hover:bg-white/10 text-purple-400 hover:text-purple-300 rounded-lg transition-colors cursor-pointer"
                  title="Add subtask"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Task specific notes section */}
            <div className="space-y-1.5">
              <h5 className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                <StickyNote className="w-3 h-3" /> Description & Notes
              </h5>
              <textarea
                value={task.notes || ""}
                onChange={(e) => handleUpdateNotes(task, e.target.value)}
                placeholder="Add reference links, specs, or task steps here..."
                className="w-full h-16 bg-white/5 border border-white/5 text-[11px] text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400/40 resize-none leading-relaxed transition-all placeholder:text-gray-600"
              />
            </div>

            {/* Adjust estimations section */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
              {/* Tag selector */}
              <div>
                <label className="block text-[8px] text-gray-500 uppercase tracking-wider mb-1">
                  Modify Tag:
                </label>
                <select
                  value={task.tag || "study"}
                  onChange={(e) => handleUpdateTag(task, e.target.value)}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-gray-300 focus:outline-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pomodoro sessions count adjustments */}
              <div>
                <label className="block text-[8px] text-gray-500 uppercase tracking-wider mb-1">
                  Estimated Pomos (🍅):
                </label>
                <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg px-2 py-0.5">
                  <button
                    type="button"
                    onClick={() => handleAdjustSessions(task, "est", "down")}
                    className="text-gray-400 hover:text-white text-xs w-4"
                  >
                    -
                  </button>
                  <span className="text-[10px] font-mono text-gray-200">
                    {task.estimateSessions}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustSessions(task, "est", "up")}
                    className="text-gray-400 hover:text-white text-xs w-4"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

export default function TodoListWidget({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onResetTasks,
  activeTaskId = null,
  onSetActiveTaskId = () => {},
  onUpdateTask = () => {},
  onAddCalendarEvent = () => {},
  onReorderTasks = () => {},
}: TodoListWidgetProps) {
  const [newTitle, setNewTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [estSessions, setEstSessions] = useState(2);
  const [selectedTag, setSelectedTag] = useState("study");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  
  // Track expanded task card IDs
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      completed: false,
      priority,
      estimateSessions: estSessions,
      actualSessions: 0,
      subtasks: [],
      notes: "",
      tag: selectedTag
    });

    onAddCalendarEvent(newTitle.trim(), selectedTag);

    setNewTitle("");
    setPriority("medium");
    setEstSessions(2);
  };

  const handleReset = () => {
    if (confirmReset) {
      onResetTasks();
      onSetActiveTaskId(null);
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  // --- SUBTASK ACTIONS ---
  const handleAddSubtask = (task: Task, title: string) => {
    if (!title.trim()) return;

    const currentSubtasks = task.subtasks || [];
    const newSubtask = {
      id: Math.random().toString(36).substring(2),
      title: title.trim(),
      completed: false
    };

    const updatedTask: Task = {
      ...task,
      subtasks: [...currentSubtasks, newSubtask]
    };

    onUpdateTask(updatedTask);
  };

  const handleToggleSubtask = (task: Task, subtaskId: string) => {
    const currentSubtasks = task.subtasks || [];
    const updatedSubtasks = currentSubtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks
    };

    onUpdateTask(updatedTask);
  };

  const handleDeleteSubtask = (task: Task, subtaskId: string) => {
    const currentSubtasks = task.subtasks || [];
    const updatedSubtasks = currentSubtasks.filter((st) => st.id !== subtaskId);

    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks
    };

    onUpdateTask(updatedTask);
  };

  // --- TASK METADATA ACTIONS ---
  const handleUpdateNotes = (task: Task, notes: string) => {
    onUpdateTask({ ...task, notes });
  };

  const handleUpdateTag = (task: Task, tag: string) => {
    onUpdateTask({ ...task, tag });
  };

  const handleUpdatePriority = (task: Task, priority: "low" | "medium" | "high") => {
    onUpdateTask({ ...task, priority });
  };

  const handleAdjustSessions = (task: Task, type: "est" | "act", dir: "up" | "down") => {
    let est = task.estimateSessions;
    let act = task.actualSessions;

    if (type === "est") {
      est = dir === "up" ? est + 1 : Math.max(1, est - 1);
    } else {
      act = dir === "up" ? act + 1 : Math.max(0, act - 1);
    }

    onUpdateTask({
      ...task,
      estimateSessions: est,
      actualSessions: act
    });
  };

  // --- FILTERS LOGIC ---
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "active" ? !t.completed : filter === "completed" ? t.completed : true;
    const matchesCategory =
      categoryFilter === "all" ? true : t.tag === categoryFilter;

    return matchesSearch && matchesFilter && matchesCategory;
  });

  const handleReorder = (newFilteredTasks: Task[]) => {
    if (!onReorderTasks) return;
    
    // If there's no active filter or search, just replace the whole task list
    if (filter === "all" && categoryFilter === "all" && !searchQuery) {
      onReorderTasks(newFilteredTasks);
      return;
    }

    // Replace the tasks in their exact slots
    let filteredIndex = 0;
    const updatedTasks = tasks.map((t) => {
      const isFiltered = filteredTasks.some((ft) => ft.id === t.id);
      if (isFiltered) {
        const nextTask = newFilteredTasks[filteredIndex];
        filteredIndex++;
        return nextTask;
      }
      return t;
    });

    onReorderTasks(updatedTasks);
  };

  const getPriorityColor = (lvl: string) => {
    switch (lvl) {
      case "high":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "medium":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  const getPriorityLabel = (lvl: string) => {
    switch (lvl) {
      case "high":
        return "High";
      case "medium":
        return "Medium";
      default:
        return "Low";
    }
  };

  // Get current active task details
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <div id="todo-widget" className="text-white flex flex-col h-full font-sans select-none">
      {/* Header section with Dual Title */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5 shrink-0">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="font-sans font-bold text-sm text-gray-100 tracking-tight">
              Focus Checklist
            </h3>
          </div>
          <p className="font-sans text-[11px] text-gray-400">
            Attach tasks to your deep work cycles
          </p>
        </div>
        <button
          onClick={handleReset}
          className={`px-3 py-1.5 border rounded-xl transition-all duration-300 flex items-center gap-1.5 text-xs ${
            confirmReset
              ? "bg-rose-500/20 text-rose-400 border-rose-500/30 font-semibold scale-95 animate-pulse"
              : "bg-white/5 border-white/5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 cursor-pointer"
          }`}
          title="Daily Task Reset"
        >
          {confirmReset ? (
            <span className="text-[10px] font-bold">Sure?</span>
          ) : (
            <>
              <RefreshCcw className="w-3.5 h-3.5" />
              <span className="text-[10px]">Reset</span>
            </>
          )}
        </button>
      </div>

      {/* ACTIVE FOCUS TASK HERO (TARGET BANNER) */}
      <AnimatePresence mode="popLayout">
        {activeTask && !activeTask.completed && (
          <motion.div
            key="active-task-hero"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 180 }}
            className="mb-4 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden"
          >
            {/* Ambient Background decoration */}
            <div className="absolute top-[-20%] right-[-10%] w-20 h-20 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-16 h-16 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 animate-pulse">
                    <Target className="w-2.5 h-2.5" /> CURRENT TARGET
                  </span>
                  {activeTask.tag && (
                    <span className="text-[9px] text-gray-400 px-1.5 py-0.2 rounded bg-white/5 border border-white/5 uppercase">
                      {activeTask.tag}
                    </span>
                  )}
                </div>
                
                <h4 className="text-sm font-bold text-white tracking-tight truncate leading-tight">
                  {activeTask.title}
                </h4>
                
                {/* Subtask micro status bar */}
                {activeTask.subtasks && activeTask.subtasks.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            ((activeTask.subtasks.filter((s) => s.completed).length) /
                              activeTask.subtasks.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono">
                      {activeTask.subtasks.filter((s) => s.completed).length}/{activeTask.subtasks.length} subtasks
                    </span>
                  </div>
                )}

                {/* Pomodoro Sessions checkmarks inside Target Card */}
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider">Sessions:</span>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.max(activeTask.estimateSessions, activeTask.actualSessions) }).map((_, i) => {
                        const isLogged = i < activeTask.actualSessions;
                        const isEst = i < activeTask.estimateSessions;
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              const newAct = isLogged ? i : i + 1;
                              onUpdateTask({ ...activeTask, actualSessions: newAct });
                            }}
                            className="transition-transform active:scale-95 text-xs hover:scale-110 shrink-0"
                            title={isLogged ? "Deduct completed session" : "Log completed session"}
                          >
                            {isLogged ? "🍅" : isEst ? "⚪" : "➕"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAdjustSessions(activeTask, "act", "down")}
                      className="w-5 h-5 bg-white/5 border border-white/5 rounded flex items-center justify-center text-xs hover:bg-white/10"
                      title="Subtract Session"
                    >
                      -
                    </button>
                    <span className="text-[10px] font-mono text-gray-300">
                      {activeTask.actualSessions}/{activeTask.estimateSessions}
                    </span>
                    <button
                      onClick={() => handleAdjustSessions(activeTask, "act", "up")}
                      className="w-5 h-5 bg-white/5 border border-white/5 rounded flex items-center justify-center text-xs hover:bg-white/10"
                      title="Add Completed Session"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete Active Task button */}
              <div className="flex flex-col items-end gap-2.5 shrink-0">
                <button
                  onClick={() => onToggleTask(activeTask.id)}
                  className="w-9 h-9 bg-amber-400 hover:bg-amber-500 text-neutral-950 rounded-xl flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer border border-amber-300"
                  title="Complete Focus Task"
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </button>
                <button
                  onClick={() => onSetActiveTaskId(null)}
                  className="text-[9px] text-gray-400 hover:text-white bg-white/5 border border-white/5 hover:bg-white/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Deselect Active Task"
                >
                  Release
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Creation Form with Categorization */}
      <form
        onSubmit={handleSubmit}
        className="mb-4 bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl p-3.5 border border-white/5 transition-all space-y-3 shrink-0"
      >
        <div className="relative">
          <input
            type="text"
            placeholder="What are we focusing on today?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none py-1 border-b border-white/10 focus:border-amber-400/60 pb-2 leading-relaxed"
          />
        </div>

        <div className="flex flex-col gap-2 pt-1 text-xs">
          {/* Tags / categories scroll */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-[10px] shrink-0 font-medium">Tag:</span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedTag === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedTag(cat.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 shrink-0 transition-all border ${
                      isSelected
                        ? "bg-[#7c3aed]/20 border-[#7c3aed] text-[#7c3aed] font-semibold"
                        : "bg-transparent border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-[10px] font-medium">Priority:</span>
              <div className="flex gap-1">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2.5 py-0.5 rounded text-[10px] capitalize transition-all border font-sans ${
                      priority === p
                        ? p === "high"
                          ? "bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold"
                          : p === "medium"
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold"
                          : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold"
                        : "bg-transparent border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-[10px] font-medium">Est. Pomodoros:</span>
              <select
                value={estSessions}
                onChange={(e) => setEstSessions(parseInt(e.target.value))}
                className="bg-neutral-800 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] text-gray-200 focus:outline-none focus:border-amber-400 shrink-0 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} pomo{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-sans font-bold text-xs py-2 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer border border-white/5"
        >
          <Plus className="w-4 h-4" /> Create Focus Task
        </button>
      </form>

      {/* FILTER & SEARCH TABS ROW */}
      <div className="space-y-2 mb-3 shrink-0">
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-1.5 border border-white/5">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none"
          />
        </div>

        {/* Filter categories tags and basic status */}
        <div className="flex items-center justify-between border-b border-white/5 text-xs">
          <div className="flex border-b border-transparent">
            {(["all", "active", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`py-2 px-3 text-center font-sans font-semibold capitalize border-b-2 transition-all cursor-pointer text-[11px] ${
                  filter === tab
                    ? "border-amber-400 text-amber-400 font-bold"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-gray-500 font-medium">Tag Filter:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-neutral-800/80 border border-white/10 rounded-md px-1.5 py-0.5 text-[9px] text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Tags</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DETAILED TASK LIST ACCORDION */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[150px]">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
            <Sparkles className="w-7 h-7 stroke-[1.2] mb-2 text-gray-600 animate-pulse" />
            <span className="text-xs font-sans text-gray-400">No tasks in this segment</span>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={filteredTasks}
            onReorder={handleReorder}
            className="space-y-2 pr-1 list-none"
            as="div"
          >
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((t) => {
                const isExpanded = expandedTaskId === t.id;
                const isActive = t.id === activeTaskId;
                const categoryDetails = CATEGORIES.find((cat) => cat.id === t.tag) || CATEGORIES[0];

                return (
                  <TaskItem
                    key={t.id}
                    task={t}
                    isExpanded={isExpanded}
                    isActive={isActive}
                    categoryDetails={categoryDetails}
                    onToggleTask={onToggleTask}
                    onSetActiveTaskId={onSetActiveTaskId}
                    onDeleteTask={onDeleteTask}
                    onUpdateTask={onUpdateTask}
                    toggleExpand={toggleExpand}
                    getPriorityColor={getPriorityColor}
                    handleAdjustSessions={handleAdjustSessions}
                    handleUpdateTag={handleUpdateTag}
                    handleUpdatePriority={handleUpdatePriority}
                    handleUpdateNotes={handleUpdateNotes}
                    handleAddSubtask={handleAddSubtask}
                    handleToggleSubtask={handleToggleSubtask}
                    handleDeleteSubtask={handleDeleteSubtask}
                  />
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}
