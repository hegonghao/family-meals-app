import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 定义受保护的路由路径
const protectedRoutes = [
  '/dashboard',
  '/menu',
  '/orders',
  '/users',
  '/profile',
  '/settings',
];

// 定义公开路由（不需要认证）
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 从cookie中获取token
  const token = request.cookies.get('accessToken')?.value;

  // 检查当前路径是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // 检查当前路径是否是公开路由
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // 如果是受保护的路由但没有token，重定向到登录页
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    // 保存原始请求路径，登录后可以重定向回来
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 如果已登录用户访问登录页，重定向到dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 其他情况正常继续
  return NextResponse.next();
}

// 配置matcher，指定middleware应用的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api路由
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
