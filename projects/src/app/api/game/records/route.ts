import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/storage/database/pg';
import { verifyToken } from '@/lib/auth';

// 保存游戏记录
export async function POST(request: NextRequest) {
  try {
    // 从cookie获取用户信息
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    const body = await request.json();
    const { scenario, final_score, result } = body;

    // 调试日志 - 详细记录用户信息
    console.log('[game-records][WRITE]', {
      source: 'ONLY_GAME_RECORDS_API',
      authUserId: decoded.id,
      authUsername: decoded.username,
      body: { scenario, final_score, result },
      timestamp: new Date().toISOString(),
    });

    if (!scenario || final_score === undefined || !result) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const insertResult = await query<{
      id: number;
      user_id: number;
    }>(
      `
        INSERT INTO game_records (user_id, scenario, final_score, result)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id
      `,
      [decoded.id, String(scenario), String(final_score), result === 'win' ? '通关' : '失败'],
    );

    const savedRecord = insertResult.rows[0];

    console.log('[game-records][SAVED]', {
      recordId: savedRecord.id,
      savedUserId: savedRecord.user_id,
      authUserId: decoded.id,
      authUsername: decoded.username,
    });

    return NextResponse.json({ 
      success: true, 
      message: '游戏记录已保存' 
    });
  } catch (error) {
    console.error('[GAME_RECORD] 保存失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

// 获取用户游戏记录
export async function GET(request: NextRequest) {
  try {
    // 从cookie获取用户信息
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ records: [] });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ records: [] });
    }

    const recordsResult = await query(
      `
        SELECT *
        FROM game_records
        WHERE user_id = $1
        ORDER BY played_at DESC
        LIMIT 50
      `,
      [decoded.id],
    );

    return NextResponse.json({ records: recordsResult.rows });
  } catch (error) {
    console.error('[GAME_RECORD] 获取失败:', error);
    return NextResponse.json({ records: [] });
  }
}
