"use client";

import * as React from "react";
import {
	Plus,
	Calendar,
	Bell,
	AlertTriangle,
	Volume2,
	Image,
	FolderOpen,
	ChevronDown,
	ChevronUp,
	Clock,
} from "lucide-react";
import {
	Task,
	Priority,
	RecurringType,
	Project,
	PRIORITY_LABELS,
	RECURRING_LABELS,
	TaskBarkSettings,
	BARK_SOUNDS,
	REMIND_BEFORE_OPTIONS,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
	projects: Project[];
	editingTask?: Task | null;
	defaultProjectId?: string;
}

export function TaskForm({
	open,
	onOpenChange,
	onSubmit,
	projects,
	editingTask,
	defaultProjectId = "inbox",
}: TaskFormProps) {
	const [title, setTitle] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [priority, setPriority] = React.useState<Priority>("medium");
	const [dueDate, setDueDate] = React.useState("");
	const [projectId, setProjectId] = React.useState(defaultProjectId);
	const [recurring, setRecurring] = React.useState<RecurringType>("none");

	// Bark 提醒设置状态
	const [barkEnabled, setBarkEnabled] = React.useState(false);
	const [barkRemindTime, setBarkRemindTime] = React.useState("");
	const [barkRemindBefore, setBarkRemindBefore] = React.useState(0);
	const [barkCritical, setBarkCritical] = React.useState(false);
	const [barkSound, setBarkSound] = React.useState<string>("");
	const [barkIcon, setBarkIcon] = React.useState("");
	const [barkGroup, setBarkGroup] = React.useState("");
	const [showBarkSettings, setShowBarkSettings] = React.useState(false);

	const inputRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		if (editingTask) {
			setTitle(editingTask.title);
			setDescription(editingTask.description || "");
			setPriority(editingTask.priority);
			setDueDate(editingTask.dueDate || "");
			setProjectId(editingTask.projectId);
			setRecurring(editingTask.recurring);
			// 设置 Bark 设置
			setBarkEnabled(editingTask.barkSettings?.enabled || false);
			setBarkRemindTime(editingTask.barkSettings?.remindTime || "");
			setBarkRemindBefore(editingTask.barkSettings?.remindBefore ?? 0);
			setBarkCritical(editingTask.barkSettings?.critical || false);
			setBarkSound(editingTask.barkSettings?.sound || "");
			setBarkIcon(editingTask.barkSettings?.icon || "");
			setBarkGroup(editingTask.barkSettings?.group || "");
			setShowBarkSettings(editingTask.barkSettings?.enabled || false);
		} else {
			setTitle("");
			setDescription("");
			setPriority("medium");
			setDueDate("");
			setProjectId(defaultProjectId);
			setRecurring("none");
			// 重置 Bark 设置
			setBarkEnabled(false);
			setBarkRemindTime("");
			setBarkRemindBefore(0);
			setBarkCritical(false);
			setBarkSound("");
			setBarkIcon("");
			setBarkGroup("");
			setShowBarkSettings(false);
		}
	}, [editingTask, defaultProjectId, open]);

	React.useEffect(() => {
		if (open) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [open]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) return;

		// 构建 Bark 设置对象
		const barkSettings: TaskBarkSettings | undefined = barkEnabled
			? {
					enabled: true,
					remindTime: barkRemindTime || undefined,
					remindBefore: barkRemindBefore,
					critical: barkCritical,
					sound: barkSound || undefined,
					icon: barkIcon || undefined,
					group: barkGroup || undefined,
				}
			: { enabled: false, critical: false };

		onSubmit({
			title: title.trim(),
			description: description.trim() || undefined,
			priority,
			dueDate: dueDate || undefined,
			projectId,
			recurring,
			barkSettings,
		});

		onOpenChange(false);
	};

	const selectedProject = projects.find((p) => p.id === projectId);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				onClose={() => onOpenChange(false)}
				className="sm:max-w-md"
			>
				<DialogHeader>
					<DialogTitle>{editingTask ? "编辑任务" : "添加新任务"}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 mt-4">
					<div>
						<Input
							ref={inputRef}
							placeholder="任务名称"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="text-base"
						/>
					</div>

					<div>
						<textarea
							placeholder="描述（可选）"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-muted-foreground mb-1.5 block">
								优先级
							</label>
							<Select
								value={priority}
								onValueChange={(v) => setPriority(v as Priority)}
							>
								<SelectTrigger>
									<span className="flex items-center gap-2">
										<span
											className={cn(
												"w-2 h-2 rounded-full",
												priority === "high" && "bg-destructive",
												priority === "medium" && "bg-warning",
												priority === "low" && "bg-success",
											)}
										/>
										{PRIORITY_LABELS[priority]}
									</span>
								</SelectTrigger>
								<SelectContent>
									{(["high", "medium", "low"] as Priority[]).map((p) => (
										<SelectItem key={p} value={p}>
											<span className="flex items-center gap-2">
												<span
													className={cn(
														"w-2 h-2 rounded-full",
														p === "high" && "bg-destructive",
														p === "medium" && "bg-warning",
														p === "low" && "bg-success",
													)}
												/>
												{PRIORITY_LABELS[p]}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-xs text-muted-foreground mb-1.5 block">
								截止日期
							</label>
							<div className="relative">
								<Input
									type="date"
									value={dueDate}
									onChange={(e) => setDueDate(e.target.value)}
									className="pr-10"
								/>
								<Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-muted-foreground mb-1.5 block">
								项目
							</label>
							<Select value={projectId} onValueChange={setProjectId}>
								<SelectTrigger>
									<span className="flex items-center gap-2">
										<span
											className="w-2 h-2 rounded-full"
											style={{ backgroundColor: selectedProject?.color }}
										/>
										{selectedProject?.name || "收件箱"}
									</span>
								</SelectTrigger>
								<SelectContent>
									{projects.map((project) => (
										<SelectItem key={project.id} value={project.id}>
											<span className="flex items-center gap-2">
												<span
													className="w-2 h-2 rounded-full"
													style={{ backgroundColor: project.color }}
												/>
												{project.name}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-xs text-muted-foreground mb-1.5 block">
								重复
							</label>
							<Select
								value={recurring}
								onValueChange={(v) => setRecurring(v as RecurringType)}
							>
								<SelectTrigger>{RECURRING_LABELS[recurring]}</SelectTrigger>
								<SelectContent>
									{(
										["none", "daily", "weekly", "monthly"] as RecurringType[]
									).map((r) => (
										<SelectItem key={r} value={r}>
											{RECURRING_LABELS[r]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Bark 提醒设置 */}
					<div className="border rounded-lg p-3 space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Checkbox
									id="bark-enabled"
									checked={barkEnabled}
									onCheckedChange={(checked) => {
										setBarkEnabled(checked === true);
										if (checked) setShowBarkSettings(true);
									}}
									disabled={!dueDate}
								/>
								<label
									htmlFor="bark-enabled"
									className={cn(
										"text-sm font-medium flex items-center gap-2 cursor-pointer",
										!dueDate && "text-muted-foreground",
									)}
								>
									<Bell className="h-4 w-4" />
									Bark 提醒
									{!dueDate && (
										<span className="text-xs text-muted-foreground">
											（需先设置截止日期）
										</span>
									)}
								</label>
							</div>
							{barkEnabled && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-6 px-2"
									onClick={() => setShowBarkSettings(!showBarkSettings)}
								>
									{showBarkSettings ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</Button>
							)}
						</div>

						{barkEnabled && showBarkSettings && (
							<div className="space-y-3 pt-2 border-t">
								{/* 提醒时间 - 必填 */}
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
											<Clock className="h-3 w-3" />
											提醒时间 <span className="text-destructive">*</span>
										</label>
										<Input
											type="time"
											value={barkRemindTime}
											onChange={(e) => setBarkRemindTime(e.target.value)}
											className="w-full"
											required={barkEnabled}
										/>
									</div>
									<div>
										<label className="text-xs text-muted-foreground mb-1.5 block">
											提前提醒
										</label>
										<Select
											value={String(barkRemindBefore)}
											onValueChange={(v) => setBarkRemindBefore(Number(v))}
										>
											<SelectTrigger>
												<SelectValue placeholder="选择提前时间" />
											</SelectTrigger>
											<SelectContent>
												{REMIND_BEFORE_OPTIONS.map((option) => (
													<SelectItem
														key={option.value}
														value={String(option.value)}
													>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
								{!barkRemindTime && (
									<p className="text-xs text-destructive">
										请设置提醒时间，否则无法发送提醒
									</p>
								)}

								{/* 重要警告 */}
								<div className="flex items-center gap-2">
									<Checkbox
										id="bark-critical"
										checked={barkCritical}
										onCheckedChange={(checked) =>
											setBarkCritical(checked === true)
										}
									/>
									<label
										htmlFor="bark-critical"
										className="text-sm flex items-center gap-2 cursor-pointer"
									>
										<AlertTriangle className="h-4 w-4 text-destructive" />
										重要警告
										<span className="text-xs text-muted-foreground">
											（忽略静音和勿扰模式）
										</span>
									</label>
								</div>

								{/* 铃声选择 */}
								<div>
									<label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
										<Volume2 className="h-3 w-3" />
										铃声
									</label>
									<Select value={barkSound} onValueChange={setBarkSound}>
										<SelectTrigger>
											<SelectValue placeholder="选择铃声（默认）" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="">默认铃声</SelectItem>
											{BARK_SOUNDS.map((sound) => (
												<SelectItem key={sound.value} value={sound.value}>
													{sound.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* 自定义图标 */}
								<div>
									<label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
										<Image className="h-3 w-3" />
										自定义图标
									</label>
									<Input
										placeholder="输入图标 URL（可选）"
										value={barkIcon}
										onChange={(e) => setBarkIcon(e.target.value)}
									/>
								</div>

								{/* 消息分组 */}
								<div>
									<label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
										<FolderOpen className="h-3 w-3" />
										消息分组
									</label>
									<Input
										placeholder="输入分组名称（默认: TaskFlow）"
										value={barkGroup}
										onChange={(e) => setBarkGroup(e.target.value)}
									/>
								</div>
							</div>
						)}
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							取消
						</Button>
						<Button type="submit" disabled={!title.trim()}>
							<Plus className="h-4 w-4 mr-1" />
							{editingTask ? "保存" : "添加"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
