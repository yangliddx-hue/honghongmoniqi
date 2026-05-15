'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, BookOpen, Loader2, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 文章类型
interface BlogPost {
  id: number;
  title: string;
  summary: string;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  // 获取文章列表
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog');
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPosts(data.posts || []);
      }
    } catch (err) {
      setError('获取文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 生成新文章
  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('请输入文章主题');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const data = await response.json();
      if (data.error) {
        alert(`生成失败: ${data.error}`);
      } else {
        alert('文章生成成功！');
        setShowGenerator(false);
        setTopic('');
        // 刷新文章列表
        setLoading(true);
        await fetchPosts();
      }
    } catch (err) {
      alert('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 计算阅读时间（大约300字/分钟）
  const calculateReadTime = (summary: string) => {
    const wordCount = summary.length;
    return Math.max(1, Math.ceil(wordCount / 300));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 pt-16">
      {/* 主内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 mb-4">
            <BookOpen className="w-8 h-8 text-pink-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">恋爱攻略</h2>
          <p className="text-gray-500">掌握恋爱技巧，成为哄人高手！</p>
        </div>

        {/* AI生成文章入口 */}
        <div className="mb-6">
          <Button
            onClick={() => setShowGenerator(!showGenerator)}
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Sparkles className="w-4 h-4" />
            AI 生成新文章
          </Button>

          {showGenerator && (
            <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                输入文章主题
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：如何处理异地恋的信任问题"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      开始生成
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGenerator(false);
                    setTopic('');
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            <span className="ml-2 text-gray-500">加载中...</span>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              重试
            </Button>
          </div>
        )}

        {/* 文章列表 */}
        {!loading && !error && (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <article className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-100 hover:border-pink-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-pink-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                        {post.summary}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {calculateReadTime(post.summary)} 分钟阅读
                    </span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </article>
              </Link>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                暂无文章，点击上方按钮生成一篇吧！
              </div>
            )}
          </div>
        )}

        {/* 底部提示 */}
        {!loading && !error && posts.length > 0 && (
          <div className="text-center mt-8 text-sm text-gray-400">
            更多攻略正在编写中...
          </div>
        )}
      </main>
    </div>
  );
}
