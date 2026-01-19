import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTaskReminder } from "@/lib/bark";

// 发送任务通知到所有启用的 Bark 设备
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { title, dueDate, priority, barkSettings } = body;

		// 如果任务有独立的 Bark 设置且未启用，则不发送通知
		if (barkSettings && !barkSettings.enabled) {
			return NextResponse.json({
				success: true,
				message: "任务 Bark 提醒未启用",
			});
		}

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

		// 发送通知，传递任务级别的 Bark 设置
		const results = await sendTaskReminder(
			barkUrls,
			title,
			dueDate,
			priority,
			barkSettings,
		);

		const successCount = results.filter((r) => r.success).length;

		return NextResponse.json({
			success: true,
			message: `成功发送到 ${successCount}/${devices.length} 个设备`,
			results,
		});
	} catch (error) {
		console.error("Failed to send notification:", error);
		return NextResponse.json(
			{ error: "Failed to send notification" },
			{ status: 500 },
		);
	}
}
