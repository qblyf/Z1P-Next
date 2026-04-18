'use client';

import { Download, Search } from 'lucide-react';
import { Button, Card, Space, Tag, Progress } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { ResultTable } from './ResultTable';
import { ColumnSelector } from './ColumnSelector';

interface BrandData {
  name: string;
  color: string;
}

// 兼容的匹配结果类型（用于UI显示）
interface UIMatchResult {
  inputName: string;
  matchedSKU: string | null;
  matchedSPU: string | null;
  matchedBrand: string | null;
  matchedVersion: string | null;
  matchedMemory: string | null;
  matchedColor: string | null;
  matchedGtins: string[];
  similarity: number;
  status: 'matched' | 'unmatched' | 'spu-matched';
}

interface MatchProgress {
  current: number;
  total: number;
  currentItem: string;
  results: UIMatchResult[] | null;
}

interface ResultPanelProps {
  results: UIMatchResult[];
  brandList: BrandData[];
  visibleColumns: string[];
  onVisibleColumnsChange: (columns: string[]) => void;
  onExport: () => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, size: number) => void;
  matchProgress?: MatchProgress | null;
}

export function ResultPanel({
  results,
  brandList,
  visibleColumns,
  onVisibleColumnsChange,
  onExport,
  currentPage,
  pageSize,
  onPageChange,
  matchProgress,
}: ResultPanelProps) {
  // 匹配中状态
  if (matchProgress) {
    return (
      <Card
        className="flex-1 flex flex-col"
        styles={{ body: { padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' } }}
      >
        <MatchingProgressUI total={matchProgress.total} />
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card
        className="flex-1 flex items-center justify-center"
        styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } }}
      >
        <div className="text-center text-slate-400">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">请在左侧输入商品名称并点击"开始匹配"</p>
        </div>
      </Card>
    );
  }

  const matchedCount = results.filter(r => r.status === 'matched').length;
  const unmatchedCount = results.filter(r => r.status === 'unmatched').length;

  return (
    <Card
      className="flex-1 flex flex-col"
      styles={{ body: { padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' } }}
      title={
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span>匹配结果</span>
            <div className="flex gap-2">
              <Tag color="blue">
                总计：{results.length} 条
              </Tag>
              <Tag color="success">
                已匹配：{matchedCount} 条
              </Tag>
              <Tag color="error">
                未匹配：{unmatchedCount} 条
              </Tag>
            </div>
          </div>
          <Space>
            <ColumnSelector
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={onVisibleColumnsChange}
            />
            <Button
              icon={<Download size={16} />}
              onClick={onExport}
              size="small"
            >
              导出CSV
            </Button>
          </Space>
        </div>
      }
    >
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <ResultTable
            results={results}
            brandList={brandList}
            visibleColumns={visibleColumns}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </Card>
  );
}

// 匹配进度展示组件
function MatchingProgressUI({ total }: { total: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      {/* 中心动画区域 */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full border-4 border-slate-200 flex items-center justify-center">
          <SyncOutlined className="animate-spin text-4xl text-blue-500" />
        </div>
      </div>

      {/* 状态文字 */}
      <h3 className="text-xl font-medium text-slate-700 mb-2">正在匹配中...</h3>
      <p className="text-slate-500 mb-6">共 {total} 条数据</p>

      {/* 进度条 */}
      <div className="w-full max-w-md mb-6">
        <Progress
          percent={100}
          status="active"
          strokeColor={{
            '0%': '#3b82f6',
            '100%': '#10b981',
          }}
          trailColor="#e2e8f0"
        />
      </div>

      {/* 提示 */}
      <div className="mt-6 text-xs text-slate-400 text-center max-w-sm">
        匹配过程中请勿关闭页面<br/>
        数据量越大，匹配时间越长
      </div>
    </div>
  );
}
