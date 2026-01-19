import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendBarkNotifications, BarkNotificationResult } from "@/lib/bark";

// 发送测试通知
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { deviceId } = body;

		let devices: any[];

		if (deviceId) {
			// 发送到指定设备
			const result = await db.execute(
				"SELECT id, name, url, enabled FROM bark_devices WHERE id = ? AND enabled = TRUE",
				[deviceId],
			);
			devices = result as any[];
		} else {
			// 发送到所有启用的设备
			const result = await db.execute(
				"SELECT id, name, url, enabled FROM bark_devices WHERE enabled = TRUE",
			);
			devices = result as any[];
		}

		if (devices.length === 0) {
			return NextResponse.json(
				{ error: "没有可用的 Bark 设备" },
				{ status: 400 },
			);
		}

		const results = await sendBarkNotifications(
			devices.map((d: { url: string }) => d.url),
			"测试通知",
			"TaskFlow 通知测试成功！🎉",
			{
				group: "TaskFlow",
				sound: "bell",
			},
		);

		const successCount = results.filter(
			(r: BarkNotificationResult) => r.success,
		).length;

		return NextResponse.json({
			success: true,
			message: `成功发送到 ${successCount}/${devices.length} 个设备`,
			results,
		});
	} catch (error) {
		console.error("Failed to send test notification:", error);
		return NextResponse.json(
			{ error: "Failed to send test notification" },
			{ status: 500 },
		);
	}
}
