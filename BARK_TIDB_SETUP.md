# TaskFlow - Bark 通知 & TiDB 数据库配置指南

## 功能概述

本次更新增加了以下功能：

1. **TiDB Cloud 数据库支持** - 数据持久化存储到云端数据库
2. **多设备 Bark 通知** - 支持添加多个 Bark 设备，同时推送通知到多台 iOS 设备
3. **自动清理** - 7天后自动删除已完成或过期的任务
4. **北京时间** - 所有时间均使用北京时间（+08:00）

## 配置步骤

### 1. 配置 TiDB Cloud 数据库

1. 访问 [TiDB Cloud](https://tidbcloud.com/) 并注册/登录账户
2. 创建一个 **Serverless** 集群（免费版）
3. 在集群详情页面，点击 **Connect** 按钮
4. 选择 **General** 连接方式，复制连接字符串
5. 在项目根目录创建 `.env.local` 文件：

```env
DATABASE_URL=mysql://username:password@gateway01.region.prod.aws.tidbcloud.com:4000/taskflow?ssl={"rejectUnauthorized":true}
```

**注意**：将连接字符串中的 `username`、`password`、`gateway01.region` 替换为你自己的信息。

### 2. 初始化数据库

数据库表会在首次访问 API 时自动创建，无需手动操作。

### 3. 配置 Bark 通知

1. 在 iPhone 上从 App Store 安装 **Bark** 应用
2. 打开 Bark 应用，复制你的推送 URL（格式如 `https://api.day.app/your_key`）
3. 在 TaskFlow 侧边栏点击 **Bark 通知设置**
4. 点击 **添加 Bark 设备**，输入设备名称和 URL
5. 点击 **测试** 按钮验证配置是否正确

### 4. 多设备通知

重复上述步骤 3，为每个 iOS 设备添加不同的 Bark URL，即可实现多设备同时推送。

## API 接口说明

### 任务相关

- `GET /api/tasks` - 获取所有任务
- `POST /api/tasks` - 创建新任务
- `PUT /api/tasks/[id]` - 更新任务
- `DELETE /api/tasks/[id]` - 删除任务

### 项目相关

- `GET /api/projects` - 获取所有项目
- `POST /api/projects` - 创建新项目
- `DELETE /api/projects/[id]` - 删除项目

### Bark 设备相关

- `GET /api/bark` - 获取所有 Bark 设备
- `POST /api/bark` - 添加 Bark 设备
- `PUT /api/bark/[id]` - 更新 Bark 设备
- `DELETE /api/bark/[id]` - 删除 Bark 设备
- `POST /api/bark/test` - 发送测试通知
- `POST /api/bark/notify` - 发送任务通知
- `POST /api/bark/remind` - 发送今日任务提醒

### 清理任务

- `POST /api/tasks/cleanup` - 清理7天前的已完成/过期任务
- `GET /api/tasks/cleanup` - 同上（便于 cron job 调用）

## 自动清理说明

应用会在每次加载时自动调用 `/api/tasks/cleanup` 接口，清理以下任务：

1. **已完成任务**：完成时间超过7天的任务
2. **过期任务**：截止日期超过7天且未完成的任务

如需定时清理，可以设置 cron job 定期调用 `GET /api/tasks/cleanup`。

## 注意事项

1. 确保 `.env.local` 文件不被提交到版本控制系统
2. TiDB Cloud 免费版有一定的连接数和存储限制
3. Bark 通知需要设备在线且网络通畅
4. 所有时间均为北京时间（UTC+8）
