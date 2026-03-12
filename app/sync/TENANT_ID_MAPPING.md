# 账套 ID 映射说明

## 问题背景

`getSysSettings` API 返回的数据中只包含 `clientName`（中文名称），但 `syncProductSingle` API 需要的是 `tenantID`（英文标识符）。

## 当前解决方案

在代码中维护了一个 `clientName` 到 `tenantID` 的映射表：

```typescript
const clientNameToTenantID: Record<string, string> = {
  '高远控股': 'newgy',
  'ZSQK test': 'zsqk-test',
  '桂讯': 'guixun',
  '高远': 'gaoyuan',
  '好目标': 'haomubiao',
  '掌上乾坤正式版': 'zsqk',
  '晋城小米': 'jincheng-xiaomi',
  '吕梁小米': 'lvliang-xiaomi',
  '佰成': 'baicheng',
  '济源迪信通': 'jiyuan-dixintong',
  '长发数码': 'changfa-shuma',
  '平诺': 'pingnuo',
};
```

## 界面显示

- 账套列表显示：`tenantID`（英文标识符）
- 同步状态显示：`tenantID`
- 同步日志显示：`tenantID`

这样确保了：
1. 用户看到的是实际的 tenantID
2. 传递给后端 API 的也是正确的 tenantID
3. 同步功能可以正常工作

## 添加新账套

如果需要添加新账套，请在映射表中添加对应的配置：

```typescript
'新账套中文名': 'new-tenant-id',
```

## 未来改进

理想的解决方案是让后端 API 直接返回 `tenantID` 字段，避免维护映射表。
