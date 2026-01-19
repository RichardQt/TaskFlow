"use client";

import * as React from "react";
import {
	Plus,
	Folder,
	MoreHorizontal,
	Trash2,
	Settings,
	Bell,
} from "lucide-react";
import { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface SidebarProps {
	projects: Project[];
	activeView: string;
	onViewChange: (view: string) => void;
	onAddProject: (project: Omit<Project, "id">) => void;
	onDeleteProject: (id: string) => void;
	taskCounts: Record<string, number>;
	todayCount: number;
	barkDeviceCount?: number;
	onOpenBarkSettings?: () => void;
	className?: string;
	onClose?: () => void;
}

const COLORS = [
	"#6366f1",
	"#8b5cf6",
	"#a855f7",
	"#d946ef",
	"#ec4899",
	"#f43f5e",
	"#ef4444",
	"#f97316",
	"#f59e0b",
	"#eab308",
	"#84cc16",
	"#22c55e",
	"#10b981",
	"#14b8a6",
	"#06b6d4",
	"#0ea5e9",
];

export function Sidebar({
	projects,
	activeView,
	onViewChange,
	onAddProject,
	onDeleteProject,
	taskCounts,
	todayCount,
	barkDeviceCount = 0,
	onOpenBarkSettings,
	className,
	onClose,
}: SidebarProps) {
	const [showAddProject, setShowAddProject] = React.useState(false);
	const [newProjectName, setNewProjectName] = React.useState("");
	const [newProjectColor, setNewProjectColor] = React.useState(COLORS[0]);
	const [contextMenu, setContextMenu] = React.useState<string | null>(null);

	const handleAddProject = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newProjectName.trim()) return;

		onAddProject({
			name: newProjectName.trim(),
			color: newProjectColor,
		});

		setNewProjectName("");
		setNewProjectColor(COLORS[0]);
		setShowAddProject(false);
	};

	const handleViewClick = (view: string) => {
		onViewChange(view);
		onClose?.();
	};

	return (
		<aside className={cn("flex flex-col h-full", className)}>
			<div className="p-4">
				<h1 className="text-xl font-bold text-foreground">TaskFlow</h1>
				<p className="text-sm text-muted-foreground">智能待办管理</p>
			</div>

			<nav className="flex-1 px-2 space-y-1 overflow-y-auto scrollbar-thin">
				<button
					onClick={() => handleViewClick("today")}
					className={cn(
						"w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
						activeView === "today"
							? "bg-primary text-primary-foreground"
							: "text-foreground hover:bg-secondary",
					)}
				>
					<span className="flex items-center gap-2">
						<span className="text-lg">📅</span>
						今天
					</span>
					{todayCount > 0 && (
						<span
							className={cn(
								"px-2 py-0.5 rounded-full text-xs",
								activeView === "today"
									? "bg-primary-foreground/20 text-primary-foreground"
									: "bg-primary/10 text-primary",
							)}
						>
							{todayCount}
						</span>
					)}
				</button>

				<button
					onClick={() => handleViewClick("all")}
					className={cn(
						"w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
						activeView === "all"
							? "bg-primary text-primary-foreground"
							: "text-foreground hover:bg-secondary",
					)}
				>
					<span className="flex items-center gap-2">
						<span className="text-lg">📋</span>
						全部任务
					</span>
				</button>

				<div className="pt-4 pb-2">
					<div className="flex items-center justify-between px-3">
						<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							项目
						</span>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={() => setShowAddProject(true)}
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{projects.map((project) => (
					<div key={project.id} className="relative group">
						<button
							onClick={() => handleViewClick(project.id)}
							className={cn(
								"w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
								activeView === project.id
									? "bg-primary text-primary-foreground"
									: "text-foreground hover:bg-secondary",
							)}
						>
							<span className="flex items-center gap-2">
								<Folder
									className="h-4 w-4"
									style={{
										color:
											activeView === project.id
												? "currentColor"
												: project.color,
									}}
								/>
								{project.name}
							</span>
							{(taskCounts[project.id] || 0) > 0 && (
								<span
									className={cn(
										"px-2 py-0.5 rounded-full text-xs",
										activeView === project.id
											? "bg-primary-foreground/20 text-primary-foreground"
											: "bg-muted text-muted-foreground",
									)}
								>
									{taskCounts[project.id]}
								</span>
							)}
						</button>

						{!["inbox", "work", "personal"].includes(project.id) && (
							<button
								onClick={() =>
									setContextMenu(contextMenu === project.id ? null : project.id)
								}
								className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-all"
							>
								<MoreHorizontal className="h-4 w-4" />
							</button>
						)}

						{contextMenu === project.id && (
							<div className="absolute right-0 top-full mt-1 z-10 bg-popover border rounded-lg shadow-lg p-1 min-w-[120px]">
								<button
									onClick={() => {
										onDeleteProject(project.id);
										setContextMenu(null);
									}}
									className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded"
								>
									<Trash2 className="h-4 w-4" />
									删除项目
								</button>
							</div>
						)}
					</div>
				))}
			</nav>

			<Dialog open={showAddProject} onOpenChange={setShowAddProject}>
				<DialogContent
					onClose={() => setShowAddProject(false)}
					className="sm:max-w-sm"
				>
					<DialogHeader>
						<DialogTitle>新建项目</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleAddProject} className="space-y-4 mt-4">
						<Input
							placeholder="项目名称"
							value={newProjectName}
							onChange={(e) => setNewProjectName(e.target.value)}
							autoFocus
						/>
						<div>
							<label className="text-xs text-muted-foreground mb-2 block">
								选择颜色
							</label>
							<div className="flex flex-wrap gap-2">
								{COLORS.map((color) => (
									<button
										key={color}
										type="button"
										onClick={() => setNewProjectColor(color)}
										className={cn(
											"w-6 h-6 rounded-full transition-transform",
											newProjectColor === color &&
												"ring-2 ring-offset-2 ring-primary scale-110",
										)}
										style={{ backgroundColor: color }}
									/>
								))}
							</div>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowAddProject(false)}
							>
								取消
							</Button>
							<Button type="submit" disabled={!newProjectName.trim()}>
								创建
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Bark 设置按钮 */}
			{onOpenBarkSettings && (
				<div className="p-3 border-t">
					<button
						onClick={onOpenBarkSettings}
						className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
					>
						<span className="flex items-center gap-2">
							<Bell className="h-4 w-4" />
							Bark 通知设置
						</span>
						{barkDeviceCount > 0 && (
							<span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
								{barkDeviceCount} 设备
							</span>
						)}
					</button>
				</div>
			)}
		</aside>
	);
}
