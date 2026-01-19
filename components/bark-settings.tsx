"use client";

import * as React from "react";
import { Plus, Trash2, Bell, BellOff, Send, Smartphone } from "lucide-react";
import { BarkDevice } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface BarkSettingsProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	devices: BarkDevice[];
	onAddDevice: (device: Omit<BarkDevice, "id" | "createdAt">) => void;
	onUpdateDevice: (id: string, updates: Partial<BarkDevice>) => void;
	onDeleteDevice: (id: string) => void;
	onTestDevice: (
		id?: string,
	) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export function BarkSettings({
	open,
	onOpenChange,
	devices,
	onAddDevice,
	onUpdateDevice,
	onDeleteDevice,
	onTestDevice,
}: BarkSettingsProps) {
	const [showAddForm, setShowAddForm] = React.useState(false);
	const [newDeviceName, setNewDeviceName] = React.useState("");
	const [newDeviceUrl, setNewDeviceUrl] = React.useState("");
	const [testingDeviceId, setTestingDeviceId] = React.useState<string | null>(
		null,
	);
	const [testResult, setTestResult] = React.useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const handleAddDevice = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newDeviceName.trim() || !newDeviceUrl.trim()) return;

		onAddDevice({
			name: newDeviceName.trim(),
			url: newDeviceUrl.trim(),
			enabled: true,
		});

		setNewDeviceName("");
		setNewDeviceUrl("");
		setShowAddForm(false);
	};

	const handleTestDevice = async (id?: string) => {
		setTestingDeviceId(id || "all");
		setTestResult(null);

		try {
			const result = await onTestDevice(id);
			if (result.success) {
				setTestResult({
					type: "success",
					message: result.message || "测试通知发送成功！",
				});
			} else {
				setTestResult({ type: "error", message: result.error || "发送失败" });
			}
		} catch (error) {
			setTestResult({ type: "error", message: "发送测试通知时出错" });
		} finally {
			setTestingDeviceId(null);
		}
	};

	const handleToggleEnabled = (device: BarkDevice) => {
		onUpdateDevice(device.id, { enabled: !device.enabled });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				onClose={() => onOpenChange(false)}
				className="sm:max-w-lg"
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Smartphone className="h-5 w-5" />
						Bark 通知设置
					</DialogTitle>
				</DialogHeader>

				<div className="mt-4 space-y-4">
					{/* 说明 */}
					<div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
						<p className="mb-2">
							<strong>Bark</strong> 是一款 iOS
							推送通知应用，可以让你在手机上及时收到任务提醒。
						</p>
						<p className="text-xs">
							请在 iPhone 上安装 Bark 应用，获取你的推送
							URL，然后添加到下方列表中。 支持多设备，添加多个 URL
							即可同时推送到多台设备。
						</p>
					</div>

					{/* 设备列表 */}
					<div className="space-y-2">
						{devices.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
								<p>还没有添加任何设备</p>
								<p className="text-xs">点击下方按钮添加你的第一个 Bark 设备</p>
							</div>
						) : (
							devices.map((device) => (
								<div
									key={device.id}
									className={cn(
										"flex items-center gap-3 p-3 rounded-lg border transition-colors",
										device.enabled ? "bg-card" : "bg-muted/30 opacity-60",
									)}
								>
									<button
										onClick={() => handleToggleEnabled(device)}
										className={cn(
											"p-1.5 rounded-lg transition-colors",
											device.enabled
												? "text-primary hover:bg-primary/10"
												: "text-muted-foreground hover:bg-muted",
										)}
										title={device.enabled ? "点击禁用" : "点击启用"}
									>
										{device.enabled ? (
											<Bell className="h-4 w-4" />
										) : (
											<BellOff className="h-4 w-4" />
										)}
									</button>

									<div className="flex-1 min-w-0">
										<div className="font-medium text-sm truncate">
											{device.name}
										</div>
										<div className="text-xs text-muted-foreground truncate">
											{device.url}
										</div>
									</div>

									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() => handleTestDevice(device.id)}
											disabled={testingDeviceId !== null || !device.enabled}
											title="发送测试通知"
										>
											{testingDeviceId === device.id ? (
												<div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
											) : (
												<Send className="h-4 w-4" />
											)}
										</Button>

										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
											onClick={() => onDeleteDevice(device.id)}
											title="删除设备"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))
						)}
					</div>

					{/* 测试结果提示 */}
					{testResult && (
						<div
							className={cn(
								"p-3 rounded-lg text-sm",
								testResult.type === "success"
									? "bg-green-500/10 text-green-600 dark:text-green-400"
									: "bg-destructive/10 text-destructive",
							)}
						>
							{testResult.message}
						</div>
					)}

					{/* 添加设备表单 */}
					{showAddForm ? (
						<form
							onSubmit={handleAddDevice}
							className="space-y-3 p-4 bg-muted/30 rounded-lg"
						>
							<div>
								<label className="text-xs text-muted-foreground mb-1.5 block">
									设备名称
								</label>
								<Input
									placeholder="例如: 我的 iPhone"
									value={newDeviceName}
									onChange={(e) => setNewDeviceName(e.target.value)}
									autoFocus
								/>
							</div>
							<div>
								<label className="text-xs text-muted-foreground mb-1.5 block">
									Bark URL
								</label>
								<Input
									placeholder="https://api.day.app/your_key"
									value={newDeviceUrl}
									onChange={(e) => setNewDeviceUrl(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									打开 Bark 应用，点击右上角复制服务器地址
								</p>
							</div>
							<div className="flex justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										setShowAddForm(false);
										setNewDeviceName("");
										setNewDeviceUrl("");
									}}
								>
									取消
								</Button>
								<Button
									type="submit"
									size="sm"
									disabled={!newDeviceName.trim() || !newDeviceUrl.trim()}
								>
									添加
								</Button>
							</div>
						</form>
					) : (
						<Button
							variant="outline"
							className="w-full"
							onClick={() => setShowAddForm(true)}
						>
							<Plus className="h-4 w-4 mr-2" />
							添加 Bark 设备
						</Button>
					)}

					{/* 测试所有设备 */}
					{devices.filter((d) => d.enabled).length > 0 && (
						<Button
							variant="secondary"
							className="w-full"
							onClick={() => handleTestDevice()}
							disabled={testingDeviceId !== null}
						>
							{testingDeviceId === "all" ? (
								<>
									<div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
									发送中...
								</>
							) : (
								<>
									<Send className="h-4 w-4 mr-2" />
									测试所有设备
								</>
							)}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
