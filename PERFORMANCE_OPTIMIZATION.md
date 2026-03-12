# 性能优化记录

## 已完成的优化

### 1. 水印组件优化 (CanvasWatermark)
- 使用 `useMemo` 缓存配置对象
- 避免每次渲染都重新生成 canvas
- 移除不必要的 console.log

### 2. 标签页系统优化 (Tabs)
- Context 值使用 `useMemo` 缓存
- 修复 useEffect 依赖，防止无限循环
- 添加 activeKey 检查，避免重复设置

### 3. 布局组件优化 (AdminLayout)
- 使用 `React.memo` 包装组件
- 减少不必要的重渲染

### 4. 标签栏优化 (TabBar)
- 使用 `React.memo` 包装组件
- 事件处理器使用 `useCallback` 缓存
- `hasClosableTabs` 使用 `useMemo` 缓存
- 右键菜单生成函数使用 `useCallback`

### 5. 菜单状态优化 (MenuState)
- Context 值使用 `useMemo` 缓存
- 查找函数使用 `useCallback` 缓存
- 防止重复设置相同状态

### 6. 导航系统优化 (Navigation)
- TopNavbar 使用 `React.memo` 包装
- Sidebar 使用 `React.memo` 包装
- 导航 hook 的查找函数使用 `useCallback`
- 返回值使用 `useMemo` 缓存
- 菜单点击处理器使用 `useCallback`

## 性能优化建议

### 如果仍有卡顿，可以检查：

1. **网络请求优化**
   - 检查 API 响应时间
   - 考虑添加请求缓存
   - 使用 SWR 或 React Query 管理数据

2. **数据渲染优化**
   - 大列表使用虚拟滚动 (react-window)
   - 表格数据分页加载
   - 图片懒加载

3. **代码分割**
   - 使用 dynamic import 延迟加载组件
   - 路由级别的代码分割

4. **浏览器性能分析**
   - 使用 Chrome DevTools Performance 面板
   - 检查长任务和重排/重绘
   - 分析内存泄漏

5. **Next.js 优化**
   - 启用 Image 组件优化
   - 使用 font optimization
   - 配置合适的缓存策略
