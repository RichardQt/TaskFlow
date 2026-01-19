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

// 获取所有项目
export async function GET() {
	try {
		await ensureDbInitialized();

		const projects = await db.execute(`
      SELECT 
        id,
        name,
        color,
        icon
      FROM projects 
      ORDER BY is_default DESC, created_at ASC
    `);

		return NextResponse.json(projects);
	} catch (error) {
		console.error("Failed to fetch projects:", error);
		return NextResponse.json(
			{ error: "Failed to fetch projects" },
			{ status: 500 },
		);
	}
}

// 创建新项目
export async function POST(request: Request) {
	try {
		await ensureDbInitialized();

		const body = await request.json();
		const { id, name, color, icon } = body;

		const createdAt = toBeijingISOString();

		await db.execute(
			`
      INSERT INTO projects (id, name, color, icon, is_default, created_at)
      VALUES (?, ?, ?, ?, FALSE, ?)
    `,
			[id, name, color, icon || null, createdAt],
		);

		const newProject = {
			id,
			name,
			color,
			icon,
		};

		return NextResponse.json(newProject);
	} catch (error) {
		console.error("Failed to create project:", error);
		return NextResponse.json(
			{ error: "Failed to create project" },
			{ status: 500 },
		);
	}
}
