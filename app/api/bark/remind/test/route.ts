import { NextResponse } from "next/server";
import { db, toBeijingDateString, getBeijingTime } from "@/lib/db";
import { sendBarkNotifications } from "@/lib/bark";

// 测试接口：立即发送指定任务的提醒（忽略时间检查）
export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => ({}));
		const { taskId } = body;

		const now = getBeijingTime();
		const today = toBeijingDateString();

		// 获取所有启用的 Bark 设备
		const devices = (await db.execute(
			"SELECT url FROM bark_devices WHERE enabled = TRUE",
		)) as any[];

		if (devices.length === 0) {
			return NextResponse.json({
				success: false,
				message: "没有可用的 Bark 设备，请先在设置中添加 Bark 设备",
			});
		}

		const barkUrls = devices.map((d: { url: string }) => d.url);

		// 如果指定了任务 ID，只提醒该任务；否则提醒所有启用了提醒的任务
		let query = `
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
				bark_group as \`group\`
			FROM tasks 
			WHERE bark_enabled = TRUE 
				AND completed = FALSE
		`;

		const params: any[] = [];
		if (taskId) {
			query += " AND id = ?";
			params.push(taskId);
		}

		const tasks = (await db.execute(query, params)) as any[];

		if (tasks.length === 0) {
			return NextResponse.json({
				success: false,
				message: taskId
					? "未找到指定任务或任务未启用 Bark 提醒"
					: "没有启用 Bark 提醒的任务",
			});
		}

		const results = [];

		for (const task of tasks) {
			const priorityEmoji: Record<string, string> = {
				high: "🔴",
				medium: "🟡",
				low: "🟢",
			};
			const emoji = task.priority ? priorityEmoji[task.priority] || "" : "";
			const title = `${emoji} 任务提醒（测试）`;
			let body = task.title;
			if (task.dueDate) {
				body += `\n📅 截止日期: ${task.dueDate}`;
			}
			if (task.remindTime) {
				body += `\n⏰ 提醒时间: ${task.remindTime}`;
			}

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
				const result = await sendBarkNotifications(barkUrls, title, body, options);
				results.push({
					taskId: task.id,
					title: task.title,
					success: true,
					results: result,
				});
			} catch (err) {
				results.push({
					taskId: task.id,
					title: task.title,
					success: false,
					error: String(err),
				});
			}
		}

		const successCount = results.filter((r) => r.success).length;

		return NextResponse.json({
			success: true,
			message: `测试提醒已发送 ${successCount}/${tasks.length} 个任务到 ${devices.length} 个设备`,
			results,
		});
	} catch (error) {
		console.error("Test remind failed:", error);
		return NextResponse.json(
			{ error: "测试提醒失败: " + String(error) },
			{ status: 500 },
		);
	}
}
