import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 更新 Bark 设备
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { name, url, enabled } = body;

		const updates: string[] = [];
		const values: any[] = [];

		if (name !== undefined) {
			updates.push("name = ?");
			values.push(name);
		}
		if (url !== undefined) {
			updates.push("url = ?");
			values.push(url);
		}
		if (enabled !== undefined) {
			updates.push("enabled = ?");
			values.push(enabled);
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
      UPDATE bark_devices SET ${updates.join(", ")} WHERE id = ?
    `,
			values,
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to update bark device:", error);
		return NextResponse.json(
			{ error: "Failed to update bark device" },
			{ status: 500 },
		);
	}
}

// 删除 Bark 设备
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		await db.execute("DELETE FROM bark_devices WHERE id = ?", [id]);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete bark device:", error);
		return NextResponse.json(
			{ error: "Failed to delete bark device" },
			{ status: 500 },
		);
	}
}
