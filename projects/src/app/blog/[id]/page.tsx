'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 文章类型
interface BlogPost {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/blog?id=${postId}`);
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setPost(data.post);
        }
      } catch (err) {
        setError('获取文章失败');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [postId]);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 计算阅读时间
  const calculateReadTime = (content: string) => {
    const wordCount = content.length;
    return Math.max(1, Math.ceil(wordCount / 300));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        <span className="ml-2 text-gray-500">加载中...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center pt-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {error || '文章不存在'}
          </h1>
          <Link href="/blog">
            <Button variant="outline">返回文章列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 pt-16">
      {/* 文章内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          {/* 文章标题 */}
          <header className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <Link href="/blog">
                <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-gray-700 -ml-2">
                  <ArrowLeft className="w-4 h-4" />
                  返回
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: post.title,
                      text: post.summary,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('链接已复制到剪贴板！');
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                分享
              </Button>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {calculateReadTime(post.content)} 分钟阅读
              </span>
              <span>{formatDate(post.created_at)}</span>
            </div>
          </header>

          {/* 文章正文 */}
          <div className="prose prose-pink max-w-none">
            {post.content.split('\n').map((paragraph, index) => {
              // 处理标题（**text**）
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <h3
                    key={index}
                    className="text-lg font-semibold text-gray-800 mt-6 mb-3"
                  >
                    {paragraph.replace(/\*\*/g, '')}
                  </h3>
                );
              }

              // 处理列表项（- text 或 - ✅/❌）
              if (paragraph.trim().startsWith('- ')) {
                const isEmoji = paragraph.includes('✅') || paragraph.includes('❌');
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2 my-2 ${
                      isEmoji ? '' : 'ml-4'
                    }`}
                  >
                    <span className="text-pink-400 mt-1">•</span>
                    <span className="text-gray-600 leading-relaxed">
                      {paragraph.trim().replace('- ', '')}
                    </span>
                  </div>
                );
              }

              // 处理空行
              if (!paragraph.trim()) {
                return <div key={index} className="h-4" />;
              }

              // 普通段落
              return (
                <p key={index} className="text-gray-600 leading-relaxed mb-4">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </article>

        {/* 底部导航 */}
        <div className="mt-8 flex justify-center">
          <Link href="/blog">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              查看更多攻略
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
