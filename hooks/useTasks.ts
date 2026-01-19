"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, Project, BarkDevice, DEFAULT_PROJECTS } from "@/lib/types";
import { generateId } from "@/lib/utils";

export function useTasks() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
	const [barkDevices, setBarkDevices] = useState<BarkDevice[]>([]);
	const [isLoaded, setIsLoaded] = useState(false);

	// 获取北京时间的 ISO 字符串
	const getBeijingISOString = () => {
		const now = new Date();
		const beijingOffset = 8 * 60 * 60 * 1000;
		const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
		const beijingTime = new Date(utcTime + beijingOffset);

		const year = beijingTime.getFullYear();
		const month = String(beijingTime.getMonth() + 1).padStart(2, "0");
		const day = String(beijingTime.getDate()).padStart(2, "0");
		const hours = String(beijingTime.getHours()).padStart(2, "0");
		const minutes = String(beijingTime.getMinutes()).padStart(2, "0");
		const seconds = String(beijingTime.getSeconds()).padStart(2, "0");
		return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
	};

	// 获取北京时间的日期字符串
	const getBeijingDateString = () => {
		const now = new Date();
		const beijingOffset = 8 * 60 * 60 * 1000;
		const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
		const beijingTime = new Date(utcTime + beijingOffset);

		const year = beijingTime.getFullYear();
		const month = String(beijingTime.getMonth() + 1).padStart(2, "0");
		const day = String(beijingTime.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	// Load data from API
	useEffect(() => {
		const loadData = async () => {
			try {
				// 并行加载所有数据
				const [tasksRes, projectsRes, devicesRes] = await Promise.all([
					fetch("/api/tasks"),
					fetch("/api/projects"),
					fetch("/api/bark"),
				]);

				if (tasksRes.ok) {
					const tasksData = await tasksRes.json();
					setTasks(tasksData);
				}

				if (projectsRes.ok) {
					const projectsData = await projectsRes.json();
					if (projectsData.length > 0) {
						setProjects(projectsData);
					}
				}

				if (devicesRes.ok) {
					const devicesData = await devicesRes.json();
					setBarkDevices(devicesData);
				}
			} catch (error) {
				console.error("Failed to load data:", error);
			} finally {
				setIsLoaded(true);
			}
		};

		loadData();

		// 每次加载时执行一次清理
		fetch("/api/tasks/cleanup", { method: "POST" }).catch(console.error);
	}, []);

	// 发送 Bark 通知
	const sendBarkNotification = useCallback(
		async (task: Task) => {
			if (barkDevices.length === 0) return;

			try {
				const enabledDevices = barkDevices.filter((d) => d.enabled);
				if (enabledDevices.length === 0) return;

				// 通过 API 发送通知，传递任务级别的 Bark 设置
				await fetch("/api/bark/notify", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						title: task.title,
						dueDate: task.dueDate,
						priority: task.priority,
						barkSettings: task.barkSettings,
					}),
				});
			} catch (error) {
				console.error("Failed to send bark notification:", error);
			}
		},
		[barkDevices],
	);

	const addTask = useCallback(
		async (task: Omit<Task, "id" | "createdAt" | "completed">) => {
			const newTask: Task = {
				...task,
				id: generateId(),
				createdAt: getBeijingISOString(),
				completed: false,
			};

			// 乐观更新
			setTasks((prev) => [newTask, ...prev]);

			try {
				await fetch("/api/tasks", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(newTask),
				});

				// 如果有截止日期且启用了 Bark 提醒或任务级别的 Bark 设置，发送 Bark 通知
				if (
					task.dueDate &&
					(task.barkSettings?.enabled || barkDevices.length > 0)
				) {
					sendBarkNotification(newTask);
				}
			} catch (error) {
				console.error("Failed to create task:", error);
				// 回滚
				setTasks((prev) => prev.filter((t) => t.id !== newTask.id));
			}

			return newTask;
		},
		[sendBarkNotification, barkDevices.length],
	);

	const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
		// 乐观更新
		setTasks((prev) =>
			prev.map((task) => (task.id === id ? { ...task, ...updates } : task)),
		);

		try {
			await fetch(`/api/tasks/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			});
		} catch (error) {
			console.error("Failed to update task:", error);
			// 重新加载数据
			const res = await fetch("/api/tasks");
			if (res.ok) {
				setTasks(await res.json());
			}
		}
	}, []);

	const deleteTask = useCallback(
		async (id: string) => {
			const taskToDelete = tasks.find((t) => t.id === id);

			// 乐观更新
			setTasks((prev) => prev.filter((task) => task.id !== id));

			try {
				await fetch(`/api/tasks/${id}`, { method: "DELETE" });
			} catch (error) {
				console.error("Failed to delete task:", error);
				// 回滚
				if (taskToDelete) {
					setTasks((prev) => [...prev, taskToDelete]);
				}
			}
		},
		[tasks],
	);

	const toggleTask = useCallback(
		async (id: string) => {
			const task = tasks.find((t) => t.id === id);
			if (!task) return;

			const completed = !task.completed;
			const completedAt = completed ? getBeijingISOString() : undefined;

			// 乐观更新
			setTasks((prev) =>
				prev.map((t) => {
					if (t.id !== id) return t;
					return { ...t, completed, completedAt };
				}),
			);

			try {
				await fetch(`/api/tasks/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ completed, completedAt }),
				});

				// Handle recurring tasks
				if (completed && task.recurring !== "none" && task.dueDate) {
					const dueDate = new Date(task.dueDate);
					let nextDate: Date;

					switch (task.recurring) {
						case "daily":
							nextDate = new Date(dueDate.setDate(dueDate.getDate() + 1));
							break;
						case "weekly":
							nextDate = new Date(dueDate.setDate(dueDate.getDate() + 7));
							break;
						case "monthly":
							nextDate = new Date(dueDate.setMonth(dueDate.getMonth() + 1));
							break;
						default:
							nextDate = dueDate;
					}

					// Create a new recurring task
					setTimeout(() => {
						addTask({
							title: task.title,
							description: task.description,
							priority: task.priority,
							dueDate: nextDate.toISOString().split("T")[0],
							projectId: task.projectId,
							recurring: task.recurring,
						});
					}, 500);
				}
			} catch (error) {
				console.error("Failed to toggle task:", error);
				// 回滚
				setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
			}
		},
		[tasks, addTask],
	);

	const addProject = useCallback(async (project: Omit<Project, "id">) => {
		const newProject: Project = {
			...project,
			id: generateId(),
		};

		// 乐观更新
		setProjects((prev) => [...prev, newProject]);

		try {
			await fetch("/api/projects", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newProject),
			});
		} catch (error) {
			console.error("Failed to create project:", error);
			// 回滚
			setProjects((prev) => prev.filter((p) => p.id !== newProject.id));
		}

		return newProject;
	}, []);

	const deleteProject = useCallback(
		async (id: string) => {
			const projectToDelete = projects.find((p) => p.id === id);

			// 乐观更新
			setProjects((prev) => prev.filter((p) => p.id !== id));
			setTasks((prev) =>
				prev.map((task) =>
					task.projectId === id ? { ...task, projectId: "inbox" } : task,
				),
			);

			try {
				await fetch(`/api/projects/${id}`, { method: "DELETE" });
			} catch (error) {
				console.error("Failed to delete project:", error);
				// 回滚
				if (projectToDelete) {
					setProjects((prev) => [...prev, projectToDelete]);
				}
			}
		},
		[projects],
	);

	// Bark 设备管理
	const addBarkDevice = useCallback(
		async (device: Omit<BarkDevice, "id" | "createdAt">) => {
			const newDevice: BarkDevice = {
				...device,
				id: generateId(),
				createdAt: getBeijingISOString(),
			};

			// 乐观更新
			setBarkDevices((prev) => [...prev, newDevice]);

			try {
				await fetch("/api/bark", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(newDevice),
				});
			} catch (error) {
				console.error("Failed to add bark device:", error);
				// 回滚
				setBarkDevices((prev) => prev.filter((d) => d.id !== newDevice.id));
			}

			return newDevice;
		},
		[],
	);

	const updateBarkDevice = useCallback(
		async (id: string, updates: Partial<BarkDevice>) => {
			// 乐观更新
			setBarkDevices((prev) =>
				prev.map((device) =>
					device.id === id ? { ...device, ...updates } : device,
				),
			);

			try {
				await fetch(`/api/bark/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updates),
				});
			} catch (error) {
				console.error("Failed to update bark device:", error);
				// 重新加载
				const res = await fetch("/api/bark");
				if (res.ok) {
					setBarkDevices(await res.json());
				}
			}
		},
		[],
	);

	const deleteBarkDevice = useCallback(
		async (id: string) => {
			const deviceToDelete = barkDevices.find((d) => d.id === id);

			// 乐观更新
			setBarkDevices((prev) => prev.filter((device) => device.id !== id));

			try {
				await fetch(`/api/bark/${id}`, { method: "DELETE" });
			} catch (error) {
				console.error("Failed to delete bark device:", error);
				// 回滚
				if (deviceToDelete) {
					setBarkDevices((prev) => [...prev, deviceToDelete]);
				}
			}
		},
		[barkDevices],
	);

	const testBarkDevice = useCallback(async (id?: string) => {
		try {
			const res = await fetch("/api/bark/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ deviceId: id }),
			});

			const result = await res.json();
			return result;
		} catch (error) {
			console.error("Failed to test bark device:", error);
			return { success: false, error: "Failed to send test notification" };
		}
	}, []);

	return {
		tasks,
		projects,
		barkDevices,
		isLoaded,
		addTask,
		updateTask,
		deleteTask,
		toggleTask,
		addProject,
		deleteProject,
		addBarkDevice,
		updateBarkDevice,
		deleteBarkDevice,
		testBarkDevice,
	};
}
