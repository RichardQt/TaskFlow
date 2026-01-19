import { connect } from "@tidbcloud/serverless";

// TiDB Cloud Serverless 连接配置
// 请在 .env.local 文件中配置以下环境变量
const DATABASE_URL = process.env.DATABASE_URL || "";

// 创建数据库连接
export const db = connect({
	url: DATABASE_URL,
});

// 北京时间工具函数
export function getBeijingTime(): Date {
	const now = new Date();
	// 获取本地时间的毫秒数，然后加上北京时区偏移（+8小时）
	const beijingOffset = 8 * 60 * 60 * 1000;
	const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
	return new Date(utcTime + beijingOffset);
}

// 格式化为北京时间的 ISO 字符串（用于数据库存储）
export function toBeijingISOString(date?: Date): string {
	const d = date || getBeijingTime();
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	const hours = String(d.getHours()).padStart(2, "0");
	const minutes = String(d.getMinutes()).padStart(2, "0");
	const seconds = String(d.getSeconds()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
}

// 格式化为北京时间的日期字符串 YYYY-MM-DD
export function toBeijingDateString(date?: Date): string {
	const d = date || getBeijingTime();
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

// 初始化数据库表
export async function initDatabase() {
	try {
		// 创建任务表
		await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
        due_date DATE,
        project_id VARCHAR(36) NOT NULL,
        recurring ENUM('none', 'daily', 'weekly', 'monthly') DEFAULT 'none',
        created_at DATETIME NOT NULL,
        completed_at DATETIME,
        bark_enabled BOOLEAN DEFAULT FALSE,
        bark_remind_time VARCHAR(10),
        bark_remind_before INT DEFAULT 0,
        bark_critical BOOLEAN DEFAULT FALSE,
        bark_sound VARCHAR(50),
        bark_icon VARCHAR(500),
        bark_group VARCHAR(100),
        bark_last_reminded DATETIME,
        INDEX idx_project_id (project_id),
        INDEX idx_due_date (due_date),
        INDEX idx_completed (completed),
        INDEX idx_created_at (created_at),
        INDEX idx_bark_remind (bark_enabled, due_date, bark_remind_time)
      )
    `);

		// 为已存在的表添加 bark 相关字段（如果不存在）
		try {
			await db.execute(
				`ALTER TABLE tasks ADD COLUMN bark_enabled BOOLEAN DEFAULT FALSE`,
			);
		} catch (e) {
			/* 字段可能已存在 */
		}
		try {
			await db.execute(
				`ALTER TABLE tasks ADD COLUMN bark_remind_time VARCHAR(10)`,
			);
		} catch (e) {
			/* 字段可能已存在 */
		}
		try {
			await db.execute(
				`ALTER TABLE tasks ADD COLUMN bark_remind_before INT DEFAULT 0`,
			);
		} catch (e) {
			/* 字段可能已存在 */
		}
		try {
			await db.execute(
				`ALTER TABLE tasks ADD COLUMN bark_critical BOOLEAN DEFAULT FALSE`,
			);
		} catch (e) {
			/* 字段可能已存在 */
		}
		try {
			await db.execute(`ALTER TABLE tasks ADD COLUMN bark_sound VARCHAR(50)`);
		} catch (e) {
			/* 字段可能已存在 */
		}
		try {
			await db.execute(`ALTER TABLE tasks ADD COLUMN bark_icon VARCHAR(500)`);
		} catch (e) {
			/* 字段可能已存在 */
		}
		try {
			await db.execute(`ALTER TABLE tasks ADD COLUMN bark_group VARCHAR(100)`);
		} catch (e) {
			/* 字段可能已存在 */
		}
		try {
			await db.execute(
				`ALTER TABLE tasks ADD COLUMN bark_last_reminded DATETIME`,
			);
		} catch (e) {
			/* 字段可能已存在 */
		}

		// 创建项目表
		await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) NOT NULL,
        icon VARCHAR(50),
        is_default BOOLEAN DEFAULT FALSE,
        created_at DATETIME NOT NULL
      )
    `);

		// 创建 Bark 设备表
		await db.execute(`
      CREATE TABLE IF NOT EXISTS bark_devices (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        url VARCHAR(500) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        created_at DATETIME NOT NULL
      )
    `);

		// 插入默认项目（如果不存在）
		const existingProjects = await db.execute(
			"SELECT id FROM projects WHERE is_default = TRUE",
		);
		if (!existingProjects || (existingProjects as any[]).length === 0) {
			const now = toBeijingISOString();
			await db.execute(
				`
        INSERT IGNORE INTO projects (id, name, color, is_default, created_at) VALUES
        ('inbox', '收件箱', '#6366f1', TRUE, ?),
        ('work', '工作', '#f59e0b', TRUE, ?),
        ('personal', '个人', '#10b981', TRUE, ?)
      `,
				[now, now, now],
			);
		}

		console.log("Database initialized successfully");
		return true;
	} catch (error) {
		console.error("Failed to initialize database:", error);
		return false;
	}
}
