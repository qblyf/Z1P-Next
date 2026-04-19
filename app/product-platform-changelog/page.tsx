'use client';

import { useEffect, useState } from 'react';
import { Tag, Card, Spin, Empty, Pagination, Tooltip } from 'antd';
import { GitCommit, User, Calendar, Rocket, BookOpen } from 'lucide-react';
import PageWrap from '../../components/PageWrap';
import './changelog.css';

interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  version?: string;
  humanReadable: string;
}

interface ChangelogResponse {
  commits: CommitInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

interface CommitTypeStyle {
  bg: string;
  text: string;
  label: string;
}

const COMMIT_TYPE_COLORS: Record<string, CommitTypeStyle> = {
  feat: { bg: '#e6f7ff', text: '#1890ff', label: '新功能' },
  fix: { bg: '#fff2e8', text: '#fa541c', label: '修复' },
  perf: { bg: '#f6ffed', text: '#52c41a', label: '性能优化' },
  refactor: { bg: '#f9f0ff', text: '#722ed1', label: '重构' },
  docs: { bg: '#fafafa', text: '#8c8c8c', label: '文档' },
  chore: { bg: '#fff7e6', text: '#faad14', label: '构建/工具' },
  style: { bg: '#f5f5f5', text: '#595959', label: '样式调整' },
  test: { bg: '#f0f5ff', text: '#2f54eb', label: '测试' },
  default: { bg: '#f0f5ff', text: '#1890ff', label: '更新' },
};

function getCommitType(message: string): CommitTypeStyle {
  const lowerMsg = message.toLowerCase();
  for (const [key, value] of Object.entries(COMMIT_TYPE_COLORS)) {
    if (key !== 'default' && lowerMsg.startsWith(key)) {
      return value;
    }
  }
  return COMMIT_TYPE_COLORS.default;
}

function getCommitIcon(type: typeof COMMIT_TYPE_COLORS['default']) {
  return <span className="commit-type-dot" style={{ background: type.text }} />;
}

export default function ProductPlatformChangelog() {
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCommits = (page: number) => {
    setLoading(true);
    fetch(`/api/changelog?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data: ChangelogResponse) => {
        setCommits(data.commits || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCommits(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <PageWrap ppKey="product-manage">
        <div className="changelog-hero">
          <div className="changelog-hero-inner">
            <div className="changelog-hero-icon">
              <Rocket size={40} />
            </div>
            <h1 className="changelog-hero-title">商品平台更新日志</h1>
            <p className="changelog-hero-subtitle">记录每一次迭代，持续优化体验</p>
          </div>
        </div>
        <div className="changelog-loading">
          <Spin size="large" />
          <span>加载中...</span>
        </div>
      </PageWrap>
    );
  }

  if (commits.length === 0) {
    return (
      <PageWrap ppKey="product-manage">
        <div className="changelog-hero">
          <div className="changelog-hero-inner">
            <div className="changelog-hero-icon">
              <Rocket size={40} />
            </div>
            <h1 className="changelog-hero-title">商品平台更新日志</h1>
            <p className="changelog-hero-subtitle">记录每一次迭代，持续优化体验</p>
          </div>
        </div>
        <div className="changelog-empty">
          <Empty description="暂无更新日志" />
        </div>
      </PageWrap>
    );
  }

  // 按版本分组
  const versionGroups: { version: string; commits: CommitInfo[] }[] = [];
  let currentVersion = '';
  let currentGroup: CommitInfo[] = [];

  commits.forEach((commit) => {
    if (commit.version && commit.version !== currentVersion) {
      if (currentGroup.length > 0) {
        versionGroups.push({ version: currentVersion, commits: currentGroup });
      }
      currentVersion = commit.version;
      currentGroup = [commit];
    } else {
      currentGroup.push(commit);
    }
  });

  if (currentGroup.length > 0) {
    versionGroups.push({ version: currentVersion, commits: currentGroup });
  }

  return (
    <PageWrap ppKey="product-manage">
      {/* 顶部英雄区 */}
      <div className="changelog-hero">
        <div className="changelog-hero-inner">
          <div className="changelog-hero-icon">
            <Rocket size={40} />
          </div>
          <h1 className="changelog-hero-title">商品平台更新日志</h1>
          <p className="changelog-hero-subtitle">记录每一次迭代，持续优化体验</p>
          <div className="changelog-hero-stats">
            <div className="changelog-stat">
              <span className="changelog-stat-value">{total}</span>
              <span className="changelog-stat-label">个版本</span>
            </div>
            <div className="changelog-stat-divider" />
            <div className="changelog-stat">
              <span className="changelog-stat-value">{versionGroups.length}</span>
              <span className="changelog-stat-label">个迭代</span>
            </div>
          </div>
        </div>
      </div>

      {/* 更新日志列表 */}
      <div className="changelog-list">
        {versionGroups.map((group, groupIdx) => {
          const commitType = getCommitType(group.commits[0]?.humanReadable || '');
          return (
            <div key={group.version} className="version-group">
              {/* 版本头 */}
              <div className="version-header">
                <div className="version-badge-wrapper">
                  <span className="version-badge">v{group.version}</span>
                  <span
                    className="version-type-tag"
                    style={{ background: commitType.bg, color: commitType.text }}
                  >
                    {commitType.label}
                  </span>
                </div>
                <div className="version-meta">
                  <BookOpen size={14} />
                  <span>{group.commits.length} 项更新</span>
                </div>
              </div>

              {/* 时间线 */}
              <div className="commit-timeline">
                {group.commits.map((commit, idx) => {
                  const type = getCommitType(commit.humanReadable);
                  const isLast = idx === group.commits.length - 1;
                  return (
                    <div key={commit.hash} className={`commit-item ${isLast ? 'commit-item-last' : ''}`}>
                      {/* 连接线 */}
                      {!isLast && <div className="commit-connector" />}

                      {/* 节点 */}
                      <div className="commit-node">
                        {getCommitIcon(type)}
                      </div>

                      {/* 内容 */}
                      <div className="commit-content">
                        <div className="commit-message">{commit.humanReadable}</div>
                        <div className="commit-meta">
                          <Tooltip title={`完整 commit: ${commit.hash}`}>
                            <a
                              className="commit-hash"
                              href={`https://github.com/qblyf/Z1P-Rnew/commit/${commit.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <GitCommit size={12} />
                              {commit.shortHash}
                            </a>
                          </Tooltip>
                          <span className="commit-author">
                            <User size={12} />
                            {commit.author}
                          </span>
                          <span className="commit-date">
                            <Calendar size={12} />
                            {formatDate(commit.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 分页 */}
      <div className="changelog-pagination">
        <Pagination
          current={currentPage}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={handlePageChange}
          showSizeChanger={false}
          showQuickJumper
          size="small"
        />
      </div>
    </PageWrap>
  );
}
