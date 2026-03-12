# 账套数据源更新说明

## 更新内容

账套管理功能已更新为从 SDK 的 `getSysSettings` API 获取所有账套信息，确保显示完整的账套列表。

## 实现方式

### 1. 数据获取流程（优先级）

```
1. SDK API (推荐) → getSysSettings → 返回所有账套及维护时间信息
   ↓ (如果失败或无 token)
2. 配置文件 → z1clients.ts → 返回配置的账套
   ↓ (如果不存在)
3. 默认列表 → 21个预定义账套
```

### 2. SDK API 说明

使用 `@zsqk/z1-sdk/es/z1p/sys-setting` 中的 `getSysSettings` API：

```typescript
import { getSysSettings } from '@zsqk/z1-sdk/es/z1p/sys-setting';

// 获取所有账套的系统设置（包括维护时间）
const sysSettings = await getSysSettings({ auth: token });

// 返回格式：
// Array<{
//   clientName: string;  // 账套名称
//   remarks: string;     // 备注
//   value: Array<{      // 维护时间配置
//     name: '例行维护时间' | '特殊维护时间';
//     startTime: UnixTimestamp;
//     endTime: UnixTimestamp;
//   }>;
// }>
```

### 3. 核心文件

- **`app/api/tenants/route.ts`**: API 路由
  - 支持两种模式：SDK API（需要 token）和配置文件
  - GET `/api/tenants?token=xxx` 从 SDK 获取
  - GET `/api/tenants` 从配置文件获取
  - 自动过滤敏感信息

- **`app/tenant-manage/page.tsx`**: 账套管理页面
  - 使用 `useTokenContext` 获取用户 token
  - 优先使用 SDK API 获取完整账套列表
  - 失败时降级到配置文件或默认列表

- **`utils/tenantConfig.ts`**: 账套配置管理工具
  - 提供后备数据源
  - 包含 21 个默认账套配置

### 4. 数据源对比

| 数据源 | 优先级 | 数据完整性 | 实时性 | 需要条件 |
|--------|--------|-----------|--------|----------|
| SDK API | 1 | ⭐⭐⭐⭐⭐ | 实时 | 需要 token |
| z1clients.ts | 2 | ⭐⭐⭐⭐ | 静态 | 文件存在 |
| 默认列表 | 3 | ⭐⭐ | 静态 | 无 |

### 5. SDK API 优势

1. **数据完整**：获取所有已配置的账套，不会遗漏
2. **实时更新**：反映最新的账套状态
3. **包含维护时间**：可以显示每个账套的维护时间窗口
4. **与系统维护时间页面一致**：使用相同的数据源

## 使用方法

### 开发环境

1. 确保已登录并有有效的 token
2. 页面会自动从 SDK 获取所有账套
3. 如果未登录，会使用配置文件或默认列表

### 生产环境

确保用户已通过身份验证，系统会自动使用 SDK API 获取最新的账套列表。

## 问题排查

### 为什么只显示 1 个账套？

可能的原因：
1. **未登录**：没有 token，降级到配置文件模式
2. **z1clients.ts 只配置了 1 个**：检查配置文件
3. **SDK API 失败**：检查网络或 API 权限

解决方法：
- 确保已登录系统
- 检查浏览器控制台的日志输出
- 查看 API 返回的 `source` 字段（sdk/config）

### 如何验证数据源？

打开浏览器控制台，查看日志：
```
成功加载 21 个账套 (来源: sdk)
```

## 相关页面

- **系统维护时间** (`/system-maintenance-time`): 使用相同的 `getSysSettings` API
- **同步管理** (`/sync`): 使用账套名称映射

## 技术细节

### API 响应格式

```typescript
{
  success: true,
  data: Array<{
    id: string;
    name: string;
    domain: string;
    state: 'valid' | 'invalid' | 'maintenance' | 'testing';
    remarks: string;
    lastSyncAt: number;
    maintenanceInfo?: {  // 仅 SDK 模式
      routineStart?: number;
      routineEnd?: number;
      specialStart?: number;
      specialEnd?: number;
    }
  }>,
  total: number,
  source: 'sdk' | 'config'
}
```

## 相关文档

- `z1clients.example.ts`: 账套配置示例文件
- `app/sync/TENANT_NAME_MAPPING.md`: 账套名称映射说明
- `TENANT_MANAGEMENT_IMPLEMENTATION.md`: 账套管理功能实现文档
