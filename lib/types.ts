export type Priority = "high" | "medium" | "low";

export type RecurringType = "none" | "daily" | "weekly" | "monthly";

// Bark 提醒相关设置
export interface TaskBarkSettings {
	enabled: boolean; // 是否启用 Bark 提醒
	remindTime?: string; // 提醒时间 (HH:mm 格式)
	remindBefore?: number; // 提前多少分钟提醒 (0, 5, 10, 15, 30, 60)
	remindRepeatInterval?: number; // 每隔多少分钟重复提醒（0=不重复）
	critical: boolean; // 是否开启重要警告（忽略静音和勿扰模式）
	sound?: string; // 铃声选择
	icon?: string; // 自定义图标
	group?: string; // 推送消息分组
	lastReminded?: string; // 上次提醒时间（用于避免重复提醒）
}

// 提前提醒选项
export const REMIND_BEFORE_OPTIONS = [
	{ value: 0, label: "准时提醒" },
	{ value: 5, label: "提前5分钟" },
	{ value: 10, label: "提前10分钟" },
	{ value: 15, label: "提前15分钟" },
	{ value: 30, label: "提前30分钟" },
	{ value: 60, label: "提前1小时" },
	{ value: 120, label: "提前2小时" },
	{ value: 1440, label: "提前1天" },
];

// 重复提醒间隔选项
export const REMIND_REPEAT_OPTIONS = [
	{ value: 0, label: "不重复" },
	{ value: 5, label: "每5分钟" },
	{ value: 10, label: "每10分钟" },
	{ value: 15, label: "每15分钟" },
	{ value: 30, label: "每30分钟" },
	{ value: 60, label: "每1小时" },
	{ value: 120, label: "每2小时" },
];

// Bark 可用铃声列表
export const BARK_SOUNDS = [
	{ value: "alarm", label: "闹钟" },
	{ value: "bell", label: "铃声" },
	{ value: "birdsong", label: "鸟鸣" },
	{ value: "bloom", label: "绽放" },
	{ value: "chime", label: "风铃" },
	{ value: "choo", label: "嘟嘟" },
	{ value: "descent", label: "下降" },
	{ value: "electronic", label: "电子" },
];

export interface Task {
	id: string;
	title: string;
	description?: string;
	completed: boolean;
	priority: Priority;
	dueDate?: string;
	projectId: string;
	recurring: RecurringType;
	createdAt: string;
	completedAt?: string;
	// Bark 提醒设置
	barkSettings?: TaskBarkSettings;
}

export interface Project {
	id: string;
	name: string;
	color: string;
	icon?: string;
}

export interface BarkDevice {
	id: string;
	name: string;
	url: string;
	enabled: boolean;
	createdAt: string;
}

export const DEFAULT_PROJECTS: Project[] = [
	{ id: "inbox", name: "收件箱", color: "#6366f1" },
	{ id: "work", name: "工作", color: "#f59e0b" },
	{ id: "personal", name: "个人", color: "#10b981" },
];

export const PRIORITY_LABELS: Record<Priority, string> = {
	high: "高优先级",
	medium: "中优先级",
	low: "低优先级",
};

export const RECURRING_LABELS: Record<RecurringType, string> = {
	none: "不重复",
	daily: "每天",
	weekly: "每周",
	monthly: "每月",
};
