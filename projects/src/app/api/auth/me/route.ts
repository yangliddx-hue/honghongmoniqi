import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  
  // 使用console.error确保日志输出到app.log
  console.error('[ME] ========== 开始 ==========');
  console.error('[ME] 收到获取用户信息请求');
  console.error('[ME] Cookie存在:', !!token);
  console.error('[ME] Cookie长度:', token?.length || 0);
  console.error('[ME] Cookie值前缀:', token?.substring(0, 20) || 'null');
  
  // 打印所有cookies
  const allCookies = request.cookies.getAll();
  console.error('[ME] 所有cookies数量:', allCookies.length);
  allCookies.forEach(c => console.error('[ME] Cookie:', c.name, '=', c.value.substring(0, 20)));
  
  const user = getUserFromRequest(request);
  console.error('[ME] 解析用户结果:', user);

  if (!user) {
    console.error('[ME] 用户未登录');
    console.error('[ME] ========== 结束 ==========');
    return NextResponse.json({ user: null });
  }

  console.error('[ME] 用户已登录:', user.username);
  console.error('[ME] ========== 结束 ==========');
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
    },
  });
}
