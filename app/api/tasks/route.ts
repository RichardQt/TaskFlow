import { NextResponse } from "next/server";
import {
	db,
	initDatabase,
	toBeijingISOString,
	toBeijingDateString,
	getBeijingTime,
} from "@/lib/db";

// 初始化数据库
let dbInitialized = false;

async function ensureDbInitialized() {
	if (!dbInitialized) {
		await initDatabase();
		dbInitialized = true;
	}
}

// 获取所有任务
export async function GET() {
	try {
		await ensureDbInitialized();

		const tasks = await db.execute(`
      SELECT 
        id,
        title,
        description,
        completed,
        priority,
        DATE_FORMAT(due_date, '%Y-%m-%d') as dueDate,
        project_id as projectId,
        recurring,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s+08:00') as createdAt,
        DATE_FORMAT(completed_at, '%Y-%m-%dT%H:%i:%s+08:00') as completedAt,
        bark_enabled as barkEnabled,
        bark_remind_time as barkRemindTime,
        bark_remind_before as barkRemindBefore,
        bark_critical as barkCritical,
        bark_sound as barkSound,
        bark_icon as barkIcon,
        bark_group as barkGroup,
        DATE_FORMAT(bark_last_reminded, '%Y-%m-%dT%H:%i:%s+08:00') as barkLastReminded
      FROM tasks 
      ORDER BY created_at DESC
    `);

		// 转换布尔值并构建 barkSettings 对象
		const formattedTasks = (tasks as any[]).map((task) => ({
			id: task.id,
			title: task.title,
			description: task.description,
			completed: Boolean(task.completed),
			priority: task.priority,
			dueDate: task.dueDate,
			projectId: task.projectId,
			recurring: task.recurring,
			createdAt: task.createdAt,
			completedAt: task.completedAt,
			barkSettings: {
				enabled: Boolean(task.barkEnabled),
				remindTime: task.barkRemindTime || undefined,
				remindBefore: task.barkRemindBefore ?? 0,
				critical: Boolean(task.barkCritical),
				sound: task.barkSound || undefined,
				icon: task.barkIcon || undefined,
				group: task.barkGroup || undefined,
				lastReminded: task.barkLastReminded || undefined,
			},
		}));

		return NextResponse.json(formattedTasks);
	} catch (error) {
		console.error("Failed to fetch tasks:", error);
		return NextResponse.json(
			{ error: "Failed to fetch tasks" },
			{ status: 500 },
		);
	}
}

// 创建新任务
export async function POST(request: Request) {
	try {
		await ensureDbInitialized();

		const body = await request.json();
		const {
			id,
			title,
			description,
			priority,
			dueDate,
			projectId,
			recurring,
			barkSettings,
		} = body;

		const createdAt = toBeijingISOString();

		await db.execute(
			`
      INSERT INTO tasks (id, title, description, priority, due_date, project_id, recurring, created_at, completed, bark_enabled, bark_remind_time, bark_remind_before, bark_critical, bark_sound, bark_icon, bark_group)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?, ?, ?, ?, ?, ?)
    `,
			[
				id,
				title,
				description || null,
				priority,
				dueDate || null,
				projectId,
				recurring,
				createdAt,
				barkSettings?.enabled || false,
				barkSettings?.remindTime || null,
				barkSettings?.remindBefore ?? 0,
				barkSettings?.critical || false,
				barkSettings?.sound || null,
				barkSettings?.icon || null,
				barkSettings?.group || null,
			],
		);

		const newTask = {
			id,
			title,
			description,
			completed: false,
			priority,
			dueDate,
			projectId,
			recurring,
			createdAt,
			completedAt: undefined,
			barkSettings: barkSettings || { enabled: false, critical: false },
		};

		return NextResponse.json(newTask);
	} catch (error) {
		console.error("Failed to create task:", error);
		return NextResponse.json(
			{ error: "Failed to create task" },
			{ status: 500 },
		);
	}
}
