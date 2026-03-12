'use client';

import Link from 'next/link';
import { useNavigation } from '../../datahooks/navigation';

export function Sidebar() {
  const { parentMenu, currentMenu } = useNavigation();

  // 如果没有父级菜单（一级菜单），不显示侧边栏
  if (!parentMenu || !parentMenu.children || parentMenu.children.length === 0) {
    return null;
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        {/* 二级菜单标题 */}
        <div className="mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">{parentMenu.label}</h2>
        </div>

        {/* 二级菜单列表 */}
        <nav className="space-y-1">
          {parentMenu.children.map((item) => {
            const isActive = currentMenu?.id === item.id;
            
            return (
              <Link
                key={item.id}
                href={item.href || '#'}
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium border-r-3 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}