import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/storage/database/pg';
import { verifyPassword, generateToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';

function buildAuthCookieHeader(token: string): string {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    `Path=${COOKIE_OPTIONS.path}`,
    `Max-Age=${COOKIE_OPTIONS.maxAge}`,
    'HttpOnly',
    `SameSite=${COOKIE_OPTIONS.sameSite === 'none' ? 'None' : 'Lax'}`,
  ];

  if (COOKIE_OPTIONS.secure) {
    parts.push('Secure');
  }

  if (COOKIE_OPTIONS.partitioned) {
    parts.push('Partitioned');
  }

  return parts.join('; ');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 统一处理username：去除前后空格
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    console.log('[LOGIN] 收到登录请求, username:', username, 'password长度:', password?.length);

    // 参数验证
    if (!username || !password) {
      console.log('[LOGIN] 参数验证失败: 用户名或密码为空');
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    console.log('[LOGIN] 查询用户:', username);
    const queryResult = await query<{
      id: number;
      username: string;
      password: string;
    }>(
      'SELECT id, username, password FROM users WHERE username = $1 LIMIT 1',
      [username],
    );

    const user = queryResult.rows[0] ?? null;

    console.log('[LOGIN] 查询结果:', user ? `找到用户 id=${user.id}` : '未找到用户');

    if (!user) {
      console.log('[LOGIN] 用户不存在');
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 400 }
      );
    }

    // 验证密码 - 添加详细日志
    console.log('[LOGIN] 开始验证密码, 数据库密码前缀:', user.password?.substring(0, 10));
    console.log('[LOGIN] 密码看起来像bcrypt:', user.password?.startsWith('$2'));
    const isValid = await verifyPassword(password, user.password);
    console.log('[LOGIN] 密码验证结果:', isValid);

    if (!isValid) {
      console.log('[LOGIN] 密码错误');
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 400 }
      );
    }

    // 生成JWT Token
    const token = generateToken({
      id: user.id,
      username: user.username,
    });
    console.log('[LOGIN] 生成Token成功, 长度:', token.length);

    // 创建响应
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    // 手动设置Set-Cookie header以支持partitioned属性
    // 这是解决iframe中第三方cookie问题的关键
    const cookieValue = buildAuthCookieHeader(token);
    response.headers.set('Set-Cookie', cookieValue);
    console.log('[LOGIN] Cookie设置成功');

    return response;
  } catch (error) {
    console.error('[LOGIN] 登录异常:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
