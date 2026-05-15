import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { AuthWrapper } from '@/components/AuthWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '哄哄模拟器',
    template: '%s | 哄哄模拟器',
  },
  description:
    '情侣互动游戏：AI扮演生气的对象，用户通过选择题的方式在10轮内把对方哄好。',
  keywords: [
    '哄哄模拟器',
    '情侣游戏',
    '互动游戏',
    'AI对话',
  ],
  authors: [{ name: 'Coze Code Team', url: 'https://code.coze.cn' }],
  generator: 'Coze Code',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '扣子编程 | 你的 AI 工程师已就位',
    description:
      '我正在使用扣子编程 Vibe Coding，让创意瞬间上线。告别拖拽，拥抱心流。',
    url: 'https://code.coze.cn',
    siteName: '扣子编程',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '扣子编程 - 你的 AI 工程师',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        <AuthWrapper>
          {isDev && <Inspector />}
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
