import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 删除项目
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		// 将该项目下的任务移到收件箱
		await db.execute(
			`UPDATE tasks SET project_id = 'inbox' WHERE project_id = ?`,
			[id],
		);

		// 删除项目
		await db.execute(
			"DELETE FROM projects WHERE id = ? AND is_default = FALSE",
			[id],
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete project:", error);
		return NextResponse.json(
			{ error: "Failed to delete project" },
			{ status: 500 },
		);
	}
}
