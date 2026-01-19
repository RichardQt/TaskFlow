import { NextResponse } from "next/server";
import { db, initDatabase, toBeijingISOString } from "@/lib/db";

// 初始化数据库
let dbInitialized = false;

async function ensureDbInitialized() {
	if (!dbInitialized) {
		await initDatabase();
		dbInitialized = true;
	}
}

// 获取所有 Bark 设备
export async function GET() {
	try {
		await ensureDbInitialized();

		const devices = await db.execute(`
      SELECT 
        id,
        name,
        url,
        enabled,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s+08:00') as createdAt
      FROM bark_devices 
      ORDER BY created_at ASC
    `);

		// 转换布尔值
		const formattedDevices = (devices as any[]).map((device) => ({
			...device,
			enabled: Boolean(device.enabled),
		}));

		return NextResponse.json(formattedDevices);
	} catch (error) {
		console.error("Failed to fetch bark devices:", error);
		return NextResponse.json(
			{ error: "Failed to fetch bark devices" },
			{ status: 500 },
		);
	}
}

// 添加新 Bark 设备
export async function POST(request: Request) {
	try {
		await ensureDbInitialized();

		const body = await request.json();
		const { id, name, url } = body;

		const createdAt = toBeijingISOString();

		await db.execute(
			`
      INSERT INTO bark_devices (id, name, url, enabled, created_at)
      VALUES (?, ?, ?, TRUE, ?)
    `,
			[id, name, url, createdAt],
		);

		const newDevice = {
			id,
			name,
			url,
			enabled: true,
			createdAt,
		};

		return NextResponse.json(newDevice);
	} catch (error) {
		console.error("Failed to create bark device:", error);
		return NextResponse.json(
			{ error: "Failed to create bark device" },
			{ status: 500 },
		);
	}
}
