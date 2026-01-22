import { NextResponse } from "next/server";
import { db, toBeijingISOString } from "@/lib/db";

// 更新任务
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const {
			title,
			description,
			completed,
			priority,
			dueDate,
			projectId,
			recurring,
			completedAt,
			barkSettings,
		} = body;

		// 构建动态更新语句
		const updates: string[] = [];
		const values: any[] = [];

		if (title !== undefined) {
			updates.push("title = ?");
			values.push(title);
		}
		if (description !== undefined) {
			updates.push("description = ?");
			values.push(description || null);
		}
		if (completed !== undefined) {
			updates.push("completed = ?");
			values.push(completed);
		}
		if (priority !== undefined) {
			updates.push("priority = ?");
			values.push(priority);
		}
		if (dueDate !== undefined) {
			updates.push("due_date = ?");
			values.push(dueDate || null);
		}
		if (projectId !== undefined) {
			updates.push("project_id = ?");
			values.push(projectId);
		}
		if (recurring !== undefined) {
			updates.push("recurring = ?");
			values.push(recurring);
		}
		if (completedAt !== undefined) {
			updates.push("completed_at = ?");
			values.push(
				completedAt ? toBeijingISOString(new Date(completedAt)) : null,
			);
		}
		// Bark 设置更新
		if (barkSettings !== undefined) {
			updates.push("bark_enabled = ?");
			values.push(barkSettings.enabled || false);
			updates.push("bark_remind_time = ?");
			values.push(barkSettings.remindTime || null);
			updates.push("bark_remind_before = ?");
			values.push(barkSettings.remindBefore ?? 0);
			updates.push("bark_repeat_interval = ?");
			values.push(barkSettings.remindRepeatInterval ?? 0);
			updates.push("bark_critical = ?");
			values.push(barkSettings.critical || false);
			updates.push("bark_sound = ?");
			values.push(barkSettings.sound || null);
			updates.push("bark_icon = ?");
			values.push(barkSettings.icon || null);
			updates.push("bark_group = ?");
			values.push(barkSettings.group || null);
		}

		if (updates.length === 0) {
			return NextResponse.json(
				{ error: "No fields to update" },
				{ status: 400 },
			);
		}

		values.push(id);

		await db.execute(
			`
      UPDATE tasks SET ${updates.join(", ")} WHERE id = ?
    `,
			values,
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to update task:", error);
		return NextResponse.json(
			{ error: "Failed to update task" },
			{ status: 500 },
		);
	}
}

// 删除任务
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		await db.execute("DELETE FROM tasks WHERE id = ?", [id]);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete task:", error);
		return NextResponse.json(
			{ error: "Failed to delete task" },
			{ status: 500 },
		);
	}
}
