'use client';

import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { MatchProvider, useMatch } from './MatchContext';
import { StatsCards } from './StatsCards';
import { InputArea } from './InputArea';
import { ResultTable } from './ResultTable';
import { useState, useEffect } from 'react';

function SmartMatchContent() {
  const { state, initialize, isInitialized } = useMatch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 初始化匹配器
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // 服务端渲染或未挂载时，显示加载状态
  if (!mounted || state.status === 'idle' || state.status === 'initializing') {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} tip="加载中..." />
      </div>
    );
  }

  return (
    <>
      {/* 全局蒙版 - 匹配中时阻止用户操作 */}
      {state.status === 'matching' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="匹配中，请稍候..." />
        </div>
      )}
      <div className="space-y-4">
        <StatsCards />
        <InputArea />
        {state.results.length > 0 && <ResultTable />}
      </div>
    </>
  );
}

export function SmartMatchV2() {
  return (
    <MatchProvider>
      <SmartMatchContent />
    </MatchProvider>
  );
}
