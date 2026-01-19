import { NextResponse } from "next/server";
import { db, toBeijingDateString, getBeijingTime } from "@/lib/db";

// 清理7天前的已完成或过期任务
export async function POST() {
	try {
		const beijingNow = getBeijingTime();
		// 计算7天前的日期
		const sevenDaysAgo = new Date(beijingNow);
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		const cutoffDate = toBeijingDateString(sevenDaysAgo);

		// 删除7天前已完成的任务
		const completedResult = await db.execute(
			`
      DELETE FROM tasks 
      WHERE completed = TRUE 
      AND DATE(completed_at) < ?
    `,
			[cutoffDate],
		);

		// 删除7天前过期且未完成的任务
		const overdueResult = await db.execute(
			`
      DELETE FROM tasks 
      WHERE completed = FALSE 
      AND due_date IS NOT NULL 
      AND due_date < ?
    `,
			[cutoffDate],
		);

		// 获取删除数量（TiDB Serverless 返回的结果格式）
		const completedCount = (completedResult as any)?.affectedRows || 0;
		const overdueCount = (overdueResult as any)?.affectedRows || 0;

		return NextResponse.json({
			success: true,
			message: `已清理 ${completedCount} 个已完成任务和 ${overdueCount} 个过期任务`,
			deletedCompleted: completedCount,
			deletedOverdue: overdueCount,
			cutoffDate,
		});
	} catch (error) {
		console.error("Failed to cleanup tasks:", error);
		return NextResponse.json(
			{ error: "Failed to cleanup tasks" },
			{ status: 500 },
		);
	}
}

// 也支持 GET 方法，便于通过 URL 触发（比如 cron job）
export async function GET() {
	return POST();
}
