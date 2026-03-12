import { NextResponse } from 'next/server';
import { getTenantConfigs } from '../../../utils/tenantConfig';

/**
 * GET /api/tenants
 * 获取所有账套配置信息
 * 
 * 支持两种模式：
 * 1. 从 z1clients.ts 配置文件读取（如果存在）
 * 2. 从 SDK getSysSettings API 获取（需要提供 token）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // 如果提供了 token，尝试从 SDK 获取
    if (token) {
      try {
        const { getSysSettings } = await import('@zsqk/z1-sdk/es/z1p/sys-setting');
        const sysSettings = await getSysSettings({ auth: token });
        
        // 将 SDK 返回的数据转换为统一格式
        const tenants = sysSettings.map((setting, index) => ({
          id: setting.clientName.toLowerCase().replace(/\s+/g, ''),
          name: setting.clientName,
          domain: `${setting.clientName.toLowerCase()}.example.com`,
          state: 'valid' as const,
          remarks: setting.remarks || '',
          lastSyncAt: 0,
          // 可以添加维护时间信息
          maintenanceInfo: {
            routineStart: setting.value.find(v => v.name === '例行维护时间')?.startTime,
            routineEnd: setting.value.find(v => v.name === '例行维护时间')?.endTime,
            specialStart: setting.value.find(v => v.name === '特殊维护时间')?.startTime,
            specialEnd: setting.value.find(v => v.name === '特殊维护时间')?.endTime,
          }
        }));
        
        return NextResponse.json({
          success: true,
          data: tenants,
          total: tenants.length,
          source: 'sdk'
        });
      } catch (sdkError) {
        console.error('从 SDK 获取账套失败:', sdkError);
        // SDK 失败时继续使用配置文件
      }
    }
    
    // 从配置文件获取
    const tenants = await getTenantConfigs();
    
    // 过滤敏感信息，只返回必要的字段
    const safeTenants = tenants.map(tenant => ({
      id: tenant.id,
      s1ClientID: tenant.s1ClientID,
      name: tenant.name,
      domain: tenant.domain,
      state: tenant.state,
      remarks: tenant.remarks,
      lastSyncAt: tenant.lastSyncAt,
      // 不返回敏感信息如 dbURI, key, jwtKey 等
    }));
    
    return NextResponse.json({
      success: true,
      data: safeTenants,
      total: safeTenants.length,
      source: 'config'
    });
  } catch (error) {
    console.error('获取账套列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取账套列表失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
