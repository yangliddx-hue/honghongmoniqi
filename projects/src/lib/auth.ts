import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// JWT密钥（生产环境应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'honghong-simulator-secret-key-2024';
const COOKIE_NAME = 'auth_token';
const TOKEN_EXPIRES_IN = '7d'; // 7天过期

// 用户信息类型
export interface UserPayload {
  id: number;
  username: string;
}

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// 验证密码
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 生成JWT Token
export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

// 验证JWT Token
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

// 从请求中获取用户信息
export function getUserFromRequest(request: NextRequest): UserPayload | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Cookie配置
// 扣子编程环境（DEV/PROD）都是HTTPS代理，需要 secure: true 和 sameSite: 'none'
// 这样浏览器才能在跨域/iframe场景下正确发送cookie
const cozeEnv = process.env.COZE_PROJECT_ENV; // 'DEV' 或 'PROD'
const isProduction = process.env.NODE_ENV === 'production';
const forceSecureCookie = process.env.AUTH_COOKIE_SECURE === 'true';
// 扣子编程环境（DEV或PROD）都使用secure cookie，因为都是HTTPS
const useSecureCookie = isProduction || forceSecureCookie || cozeEnv === 'DEV' || cozeEnv === 'PROD';

console.log('[AUTH] Cookie配置: cozeEnv=', cozeEnv, 'useSecureCookie=', useSecureCookie);

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: useSecureCookie,
  sameSite: useSecureCookie ? 'none' as const : 'lax' as const,
  maxAge: 7 * 24 * 60 * 60, // 7天
  path: '/',
  // CHIPS: 允许在第三方上下文（iframe）中设置cookie
  // 这是解决现代浏览器阻止第三方cookie的关键
  partitioned: useSecureCookie,
};

function serializeCookieValue(token: string, maxAge: number): string {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    `Path=${COOKIE_OPTIONS.path}`,
    `Max-Age=${maxAge}`,
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

export function createAuthCookieHeader(token: string): string {
  return serializeCookieValue(token, COOKIE_OPTIONS.maxAge);
}

export function createExpiredAuthCookieHeader(): string {
  return serializeCookieValue('', 0);
}

export { COOKIE_NAME };
