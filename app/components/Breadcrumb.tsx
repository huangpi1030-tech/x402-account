/**
 * 面包屑导航组件
 * 对应 PRD 第 13 节：Web App 页面规格
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb() {
  const pathname = usePathname();

  // 根据路径生成面包屑
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: "首页", href: "/" }];

    if (pathname === "/") {
      return [{ label: "交易记录", href: "/" }];
    }

    const paths = pathname.split("/").filter(Boolean);

    paths.forEach((path, index) => {
      const href = "/" + paths.slice(0, index + 1).join("/");
      let label = path;

      // 映射路径到中文标签
      const labelMap: Record<string, string> = {
        onboarding: "初始化",
        transactions: "交易详情",
        rules: "规则管理",
        reports: "报表",
        settings: "设置",
      };

      label = labelMap[path] || path;

      // 如果是动态路由（如 [id]），显示实际 ID 或特殊标签
      if (path.match(/^\[.*\]$/)) {
        // 动态路由，不显示在面包屑中
        return;
      }

      items.push({
        label,
        href: index === paths.length - 1 ? undefined : href,
      });
    });

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index === 0 ? (
            <Link
              href={item.href || "#"}
              className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ) : item.href ? (
            <Link
              href={item.href}
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      ))}
    </nav>
  );
}
