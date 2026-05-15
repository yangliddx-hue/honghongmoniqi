import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { query } from '@/storage/database/pg';

// LLM生成文章的提示词
const generateArticlePrompt = (topic: string) => `你是一位恋爱心理学专家，擅长用轻松幽默的方式分享恋爱技巧。

请围绕主题"${topic}"写一篇恋爱攻略文章，要求：
1. 字数300-500字
2. 风格轻松幽默，像朋友聊天一样
3. 包含实用的建议和技巧
4. 可以适当使用emoji增加趣味性
5. 开头要吸引人，结尾要有总结或金句

请按以下格式输出：
标题：xxx
摘要：xxx（一句话概括，30字以内）
正文：xxx

现在开始创作：`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: '请提供文章主题' },
        { status: 400 }
      );
    }

    // 使用LLM生成文章
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new LLMClient(config, customHeaders);

    const messages = [
      {
        role: 'system' as const,
        content: '你是一位恋爱心理学专家，擅长用轻松幽默的方式分享恋爱技巧。你的文章总是引人入胜，既有深度又不失趣味。',
      },
      {
        role: 'user' as const,
        content: generateArticlePrompt(topic),
      },
    ];

    // 流式生成文章
    const stream = client.stream(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.9, // 更高的温度增加创意
    });

    let fullContent = '';
    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content.toString();
      }
    }

    // 解析生成的内容
    const titleMatch = fullContent.match(/标题[：:]\s*([\s\S]+?)(?:\n|摘要)/);
    const summaryMatch = fullContent.match(/摘要[：:]\s*([\s\S]+?)(?:\n|正文)/);
    const contentMatch = fullContent.match(/正文[：:]\s*([\s\S]+?)$/);

    const title = titleMatch?.[1]?.trim() || topic;
    const summary = summaryMatch?.[1]?.trim() || `关于${topic}的恋爱攻略`;
    const content = contentMatch?.[1]?.trim() || fullContent;

    // 保存到数据库
    const insertResult = await query(
      `
        INSERT INTO blog_posts (title, summary, content)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [title, summary, content],
    );

    const data = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      post: data,
    });
  } catch (error) {
    console.error('生成文章失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 }
    );
  }
}
