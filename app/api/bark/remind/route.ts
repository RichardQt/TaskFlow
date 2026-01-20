import { NextResponse } from "next/server";
import {
	db,
	toBeijingISOString,
	toBeijingDateString,
	getBeijingTime,
} from "@/lib/db";
import { sendBarkNotifications } from "@/lib/bark";

// 发送任务提醒（定时调用此接口）
export async function POST() {
	try {
		const now = getBeijingTime();
		const today = toBeijingDateString();
		const currentHour = now.getHours();
		const currentMinute = now.getMinutes();
		const currentTotalMinutes = currentHour * 60 + currentMinute;

		console.log(
			`[Bark Remind] 当前北京时间: ${today} ${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`,
		);

		// 获取所有启用的 Bark 设备
		const devices = (await db.execute(
			"SELECT url FROM bark_devices WHERE enabled = TRUE",
		)) as any[];

		if (devices.length === 0) {
			return NextResponse.json({
				success: true,
				message: "没有可用的 Bark 设备",
			});
		}

		const barkUrls = devices.map((d: { url: string }) => d.url);

		// 获取需要提醒的任务
		const tasks = (await db.execute(
			`
      SELECT 
        id, 
        title, 
        priority,
        DATE_FORMAT(due_date, '%Y-%m-%d') as dueDate,
        bark_remind_time as remindTime,
        bark_remind_before as remindBefore,
        bark_critical as critical,
        bark_sound as sound,
        bark_icon as icon,
        bark_group as \`group\`,
        bark_last_reminded as lastReminded
      FROM tasks 
      WHERE bark_enabled = TRUE 
        AND completed = FALSE 
        AND bark_remind_time IS NOT NULL
        AND due_date IS NOT NULL
    `,
		)) as any[];

		console.log(`[Bark Remind] 找到 ${tasks.length} 个启用了提醒的任务`);

		if (tasks.length === 0) {
			return NextResponse.json({
				success: true,
				message: "没有需要提醒的任务",
			});
		}

		const remindedTasks: string[] = [];
		const results = [];

		for (const task of tasks) {
			// 解析提醒时间
			const [remindHour, remindMinute] = task.remindTime.split(":").map(Number);
			const remindTotalMinutes = remindHour * 60 + remindMinute;

			// 检查是否在10分钟内已经提醒过（避免重复提醒）
			if (task.lastReminded) {
				// 将数据库时间字符串转换为北京时间对象进行比较
				// task.lastReminded 格式如 "2026-01-20 07:20:07" 或 "2026-01-20T07:20:07+08:00"
				let lastRemindedTime: Date;
				if (task.lastReminded.includes('+08:00') || task.lastReminded.includes('T')) {
					// 如果已经包含时区信息或ISO格式，直接解析
					lastRemindedTime = new Date(task.lastReminded);
				} else {
					// 如果是普通格式，手动添加北京时区
					lastRemindedTime = new Date(task.lastReminded.replace(' ', 'T') + '+08:00');
				}
				
				const timeDiff = now.getTime() - lastRemindedTime.getTime();
				const minutesDiff = timeDiff / (1000 * 60);

				// 如果距离上次提醒不到10分钟，跳过
				if (minutesDiff < 10) {
					console.log(
						`[Bark Remind] 任务 "${task.title}" 在 ${minutesDiff.toFixed(1)} 分钟前已提醒过，跳过`,
					);
					continue;
				}
			}

			// 解析任务到期日期（使用北京时区）
			const taskDueDate = new Date(task.dueDate + "T00:00:00+08:00");
			const todayDate = new Date(today + "T00:00:00+08:00");
			const daysDiff = Math.round(
				(taskDueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
			);
			const remindBefore = task.remindBefore || 0;

			// 计算实际应该提醒的时间（考虑提前提醒）
			// 例如：任务截止明天 09:00，提前1天提醒，则今天 09:00 提醒
			// 例如：任务截止今天 14:00，提前30分钟提醒，则今天 13:30 提醒

			let shouldRemind = false;
			let actualRemindMinutes = remindTotalMinutes;

			if (daysDiff === 0) {
				// 今天到期的任务
				// 计算实际提醒时间（减去提前分钟数，但不能小于0）
				actualRemindMinutes = Math.max(
					0,
					remindTotalMinutes - (remindBefore % 1440),
				);

				// 当前时间是否已经到达或超过提醒时间
				if (currentTotalMinutes >= actualRemindMinutes) {
					shouldRemind = true;
					console.log(
						`[Bark Remind] 任务 "${task.title}" 今天到期，提醒时间 ${task.remindTime}，当前已到提醒时间`,
					);
				}
			} else if (daysDiff === 1) {
				// 明天到期的任务
				if (remindBefore >= 1440) {
					// 提前1天或更多提醒
					actualRemindMinutes = remindTotalMinutes;
					if (currentTotalMinutes >= actualRemindMinutes) {
						shouldRemind = true;
						console.log(
							`[Bark Remind] 任务 "${task.title}" 明天到期，提前1天提醒`,
						);
					}
				} else if (remindBefore > 0) {
					// 提前不足1天，但跨天了（例如任务明天00:30到期，提前1小时提醒，则今天23:30提醒）
					const crossDayMinutes = 1440 - remindBefore + remindTotalMinutes;
					if (
						crossDayMinutes < 1440 &&
						currentTotalMinutes >= crossDayMinutes
					) {
						shouldRemind = true;
						console.log(
							`[Bark Remind] 任务 "${task.title}" 明天到期，今天跨天提醒`,
						);
					}
				}
			} else if (daysDiff > 1) {
				// 多天后到期，检查是否需要提前多天提醒
				const daysInMinutes = daysDiff * 1440;
				if (remindBefore >= daysInMinutes - (1440 - remindTotalMinutes)) {
					if (currentTotalMinutes >= remindTotalMinutes) {
						shouldRemind = true;
						console.log(
							`[Bark Remind] 任务 "${task.title}" ${daysDiff}天后到期，提前提醒`,
						);
					}
				}
			}

			if (shouldRemind) {
				// 构建通知
				const priorityEmoji: Record<string, string> = {
					high: "🔴",
					medium: "🟡",
					low: "🟢",
				};
				const emoji = task.priority ? priorityEmoji[task.priority] || "" : "";
				const title = `${emoji} 任务提醒`;
				let body = task.title;
				body += `\n📅 截止日期: ${task.dueDate}`;
				body += `\n⏰ 提醒时间: ${task.remindTime}`;

				const options: any = {
					group: task.group || "TaskFlow",
					sound: task.sound || "bell",
					level: task.critical
						? "critical"
						: task.priority === "high"
							? "timeSensitive"
							: "active",
				};

				if (task.icon) {
					options.icon = task.icon;
				}

				try {
					const result = await sendBarkNotifications(
						barkUrls,
						title,
						body,
						options,
					);
					results.push({
						taskId: task.id,
						title: task.title,
						success: true,
						results: result,
					});
					remindedTasks.push(task.id);
					console.log(`[Bark Remind] 成功发送任务 "${task.title}" 的提醒`);
				} catch (err) {
					console.error(
						`[Bark Remind] 发送任务 "${task.title}" 提醒失败:`,
						err,
					);
					results.push({
						taskId: task.id,
						title: task.title,
						success: false,
						error: String(err),
					});
				}
			}
		}

		// 更新已提醒任务的 last_reminded 时间
		if (remindedTasks.length > 0) {
			const nowStr = toBeijingISOString();
			for (const taskId of remindedTasks) {
				await db.execute(
					"UPDATE tasks SET bark_last_reminded = ? WHERE id = ?",
					[nowStr, taskId],
				);
			}
		}

		return NextResponse.json({
			success: true,
			message: `已发送 ${remindedTasks.length} 个任务提醒到 ${devices.length} 个设备`,
			remindedCount: remindedTasks.length,
			currentTime: `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`,
			tasksChecked: tasks.length,
			results,
		});
	} catch (error) {
		console.error("Failed to send reminders:", error);
		return NextResponse.json(
			{ error: "Failed to send reminders" },
			{ status: 500 },
		);
	}
}

// GET 方法支持 Vercel Cron Jobs 调用
export async function GET(request: Request) {
	// 验证是否来自 Vercel Cron（可选，增加安全性）
	const authHeader = request.headers.get("authorization");
	if (
		process.env.CRON_SECRET &&
		authHeader !== `Bearer ${process.env.CRON_SECRET}`
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// 复用 POST 的逻辑
	return POST();
}
