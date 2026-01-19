import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 检查数据库连接状态
export async function GET() {
	try {
		// 执行简单查询来验证数据库连接
		const result = await db.execute("SELECT 1 as status");

		if (result && Array.isArray(result) && result.length > 0) {
			return NextResponse.json({
				status: "connected",
				message: "数据库连接正常",
				timestamp: new Date().toISOString(),
			});
		}

		return NextResponse.json(
			{
				status: "error",
				message: "数据库响应异常",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	} catch (error) {
		console.error("Database health check failed:", error);
		return NextResponse.json(
			{
				status: "disconnected",
				message: "数据库连接失败",
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
