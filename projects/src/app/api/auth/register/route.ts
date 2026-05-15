import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/storage/database/pg';
import { hashPassword, generateToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';

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

    // 参数验证
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    if (username.length < 2 || username.length > 50) {
      return NextResponse.json(
        { error: '用户名长度需要在2-50个字符之间' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6个字符' },
        { status: 400 }
      );
    }

    console.log('[REGISTER] 注册请求, username:', username);

    const existingUserResult = await query<{ id: number }>(
      'SELECT id FROM users WHERE username = $1 LIMIT 1',
      [username],
    );

    const existingUser = existingUserResult.rows[0] ?? null;

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const insertResult = await query<{
      id: number;
      username: string;
      created_at: string;
    }>(
      `
        INSERT INTO users (username, password)
        VALUES ($1, $2)
        RETURNING id, username, created_at
      `,
      [username, hashedPassword],
    );

    const newUser = insertResult.rows[0];

    // 生成JWT Token
    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
    });

    // 创建响应
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
      },
    });

    // 手动设置Set-Cookie header以支持partitioned属性
    const cookieValue = buildAuthCookieHeader(token);
    response.headers.set('Set-Cookie', cookieValue);

    return response;
  } catch (error) {
    console.error('注册异常:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
