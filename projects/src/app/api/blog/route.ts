import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/storage/database/pg';

// 获取文章列表（只返回标题和摘要）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 如果指定了id，获取单篇文章详情
    if (id) {
      const postResult = await query(
        'SELECT * FROM blog_posts WHERE id = $1 LIMIT 1',
        [parseInt(id, 10)],
      );

      if (postResult.rows.length === 0) {
        return NextResponse.json({ error: '文章不存在' }, { status: 404 });
      }

      return NextResponse.json({ post: postResult.rows[0] });
    }

    // 获取文章列表
    const postsResult = await query(
      `
        SELECT id, title, summary, created_at
        FROM blog_posts
        ORDER BY created_at DESC
      `,
    );

    return NextResponse.json({ posts: postsResult.rows });
  } catch (error) {
    console.error('获取文章失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取文章失败' },
      { status: 500 }
    );
  }
}
