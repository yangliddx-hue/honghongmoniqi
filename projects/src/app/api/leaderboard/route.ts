import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/storage/database/pg';
import { verifyToken } from '@/lib/auth';

// 获取排行榜
export async function GET(request: NextRequest) {
  try {
    // 获取当前登录用户（可能为空）
    const token = request.cookies.get('auth_token')?.value;
    let currentUserId: number | null = null;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded?.id) {
        currentUserId = decoded.id;
        console.log('[leaderboard] 当前用户ID:', currentUserId);
      }
    }

    const leaderboardRows = await query<{
      user_id: number;
      username: string | null;
      best_score: number;
      achieved_at: string;
    }>(
      `
        SELECT DISTINCT ON (gr.user_id)
          gr.user_id,
          u.username,
          gr.final_score::int AS best_score,
          gr.played_at AS achieved_at
        FROM game_records gr
        LEFT JOIN users u ON u.id = gr.user_id
        WHERE gr.result = $1
        ORDER BY gr.user_id, gr.final_score::int DESC, gr.played_at DESC
      `,
      ['通关'],
    );

    if (leaderboardRows.rows.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    const leaderboard = leaderboardRows.rows
      .sort((a, b) => b.best_score - a.best_score)
      .slice(0, 20);

    // 标记当前用户
    const responseData = leaderboard.map((item, index) => ({
      rank: index + 1,
      user_id: item.user_id,
      username: item.username,
      best_score: item.best_score,
      achieved_at: item.achieved_at,
      is_current_user: item.user_id === currentUserId,
    }));

    console.log('[leaderboard] 返回排行榜:', responseData.length, '条记录');

    return NextResponse.json({ leaderboard: responseData });
  } catch (error) {
    console.error('[leaderboard] 错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
