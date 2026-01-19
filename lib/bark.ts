// Bark 通知服务
// Bark 是一个 iOS 推送通知 App

export interface BarkNotificationOptions {
	group?: string; // 通知分组
	sound?: string; // 通知声音
	icon?: string; // 自定义图标
	url?: string; // 点击通知跳转的 URL
	isArchive?: boolean; // 是否保存通知
	level?: "active" | "timeSensitive" | "passive" | "critical"; // 通知级别，critical 为重要警告
	call?: boolean; // 是否重复播放铃声30s
}

export interface BarkNotificationResult {
	url: string;
	success: boolean;
	error?: string;
}

/**
 * 发送 Bark 通知到单个设备
 */
export async function sendBarkNotification(
	barkUrl: string,
	title: string,
	body: string,
	options?: BarkNotificationOptions,
): Promise<BarkNotificationResult> {
	try {
		// 确保 URL 格式正确
		let url = barkUrl.trim();
		if (!url.endsWith("/")) {
			url += "/";
		}

		// 构建请求参数
		const params: Record<string, string> = {
			title,
			body,
		};

		if (options?.group) params.group = options.group;
		if (options?.sound) params.sound = options.sound;
		if (options?.icon) params.icon = options.icon;
		if (options?.url) params.url = options.url;
		if (options?.isArchive !== undefined)
			params.isArchive = options.isArchive ? "1" : "0";
		if (options?.level) params.level = options.level;
		if (options?.call) params.call = "1";

		// 使用 POST 请求发送
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
			body: JSON.stringify(params),
		});

		if (!response.ok) {
			return {
				url: barkUrl,
				success: false,
				error: `HTTP ${response.status}: ${response.statusText}`,
			};
		}

		const result = await response.json();

		if (result.code === 200) {
			return { url: barkUrl, success: true };
		} else {
			return {
				url: barkUrl,
				success: false,
				error: result.message || "Unknown error",
			};
		}
	} catch (error) {
		return {
			url: barkUrl,
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * 发送 Bark 通知到多个设备
 */
export async function sendBarkNotifications(
	barkUrls: string[],
	title: string,
	body: string,
	options?: BarkNotificationOptions,
): Promise<BarkNotificationResult[]> {
	const promises = barkUrls.map((url) =>
		sendBarkNotification(url, title, body, options),
	);

	return Promise.all(promises);
}

/**
 * 发送任务提醒通知
 */
export async function sendTaskReminder(
	barkUrls: string[],
	taskTitle: string,
	dueDate?: string,
	priority?: string,
	barkSettings?: {
		enabled?: boolean;
		critical?: boolean;
		sound?: string;
		icon?: string;
		group?: string;
	},
): Promise<BarkNotificationResult[]> {
	const priorityEmoji: Record<string, string> = {
		high: "🔴",
		medium: "🟡",
		low: "🟢",
	};

	const emoji = priority ? priorityEmoji[priority] || "" : "";
	const title = `${emoji} 任务提醒`;

	let body = taskTitle;
	if (dueDate) {
		body += `\n截止日期: ${dueDate}`;
	}

	// 使用任务级别的 Bark 设置，如果没有则使用默认值
	const options: BarkNotificationOptions = {
		group: barkSettings?.group || "TaskFlow",
		sound: barkSettings?.sound || "bell",
		level: barkSettings?.critical
			? "critical"
			: priority === "high"
				? "timeSensitive"
				: "active",
	};

	if (barkSettings?.icon) {
		options.icon = barkSettings.icon;
	}

	return sendBarkNotifications(barkUrls, title, body, options);
}

/**
 * 发送任务到期通知
 */
export async function sendTaskDueNotification(
	barkUrls: string[],
	taskTitle: string,
	isOverdue: boolean = false,
): Promise<BarkNotificationResult[]> {
	const title = isOverdue ? "⚠️ 任务已过期" : "📅 任务即将到期";
	const body = taskTitle;

	return sendBarkNotifications(barkUrls, title, body, {
		group: "TaskFlow",
		sound: isOverdue ? "alarm" : "bell",
		level: "timeSensitive",
	});
}
