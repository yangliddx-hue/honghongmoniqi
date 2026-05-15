import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/storage/database/pg';

// 博客文章类型
interface BlogPostInput {
  title: string;
  summary: string;
  content: string;
}

// 预设文章数据
const PRESET_POSTS: BlogPostInput[] = [
  {
    title: '吵架之后的黄金30分钟',
    summary: '吵架后怎么做才能化危机为转机？掌握这30分钟，让感情升温！',
    content: `吵架后的30分钟，是决定感情走向的关键时刻。很多人选择冷战、摔门而出，或者疯狂刷手机装作若无其事——这些都是错过"黄金窗口期"的典型操作。

心理学研究表明，人在争吵后的30分钟内，情绪处于高度激活状态，此时也是最容易打破僵局、实现情感连接的时刻。错过了这个窗口，双方都可能陷入"自尊防御模式"，后续和解难度翻倍。

那么，这30分钟应该怎么用？

**第一步：冷静但不逃避。** 给彼此3-5分钟的物理空间，但不要离开现场太远。可以说"我需要冷静一下，5分钟后我们继续谈"，而不是摔门就走。

**第二步：主动示弱。** 这里的示弱不是认输，而是表达在乎。一句"我不想和你吵"比任何辩解都有用。

**第三步：肢体接触。** 如果对方没有抗拒，一个拥抱胜过千言万语。心理学发现，拥抱会促进催产素分泌，这是天然的"和解激素"。

记住，吵架不可怕，可怕的是吵完之后的处理方式。掌握黄金30分钟，让每次冲突都成为感情升温的契机！`,
  },
  {
    title: '为什么"你说的对"是最烂的回复',
    summary: '看似在认错，实则在敷衍——揭秘这句话背后的心理陷阱。',
    content: `当你的伴侣在认真表达不满时，你回了一句"好好好，你说的对"——恭喜你，你刚刚成功点燃了第二波战火。

这句话为什么这么惹人愤怒？表面上看，你是在承认错误、认同对方。但实际上，它传递的信息是："我不想再听你说下去了，你闭嘴吧。"

**这是一种被动攻击。**

心理学家称这种行为为"假性认同"。说这句话的人，往往有两种心理：
1. **敷衍了事型**：觉得对方太麻烦，想快速结束对话
2. **消极抵抗型**：内心并不认同，但懒得解释，用"认错"来逃避沟通

无论哪种，对方都能感受到你的不真诚。真正的沟通不是说出"你说的对"，而是说出"我理解你的感受"。

**那应该怎么回复？**

试试这些替代方案：
- "我明白你为什么生气，我们来聊聊怎么解决。"
- "你说得有道理，我之前没考虑到这一点。"
- "我需要时间想想你说的话，一会儿再聊好吗？"

记住，伴侣要的不是你认输，而是你真正在意TA的想法。别用"你说的对"来结束对话，用它来开启真正的理解。`,
  },
  {
    title: '道歉的正确打开方式',
    summary: '一句"对不起"为什么不够？学会道歉的完整公式，让每次道歉都有效！',
    content: `你以为道歉就是说一句"对不起"？难怪每次道歉都被怼"你根本不知道错在哪"！

一个真正有效的道歉，需要包含四个关键要素：

**1. 承认具体错误**
"对不起"太笼统了，对方会觉得你在敷衍。要说出自己到底做错了什么。
- ❌ "对不起，我不该那样。"
- ✅ "对不起，我不应该在朋友面前说你的糗事，这让你很难堪。"

**2. 认同对方的感受**
道歉不只是认错，更是要让对方感受到被理解。
- ❌ "对不起，别生气了好吧。"
- ✅ "我知道这件事让你很受伤，换做是我也会很难过。"

**3. 解释原因（不是找借口）**
解释 ≠ 辩解。可以说"我当时太冲动了"，但别说"是你先惹我的"。
- ❌ "我发脾气是因为你总是唠叨。"
- ✅ "我当时工作压力大，情绪没控制好，但这不是对你的理由。"

**4. 提出改变方案**
最有诚意的道歉，是让对方看到你不会重蹈覆辙。
- ❌ "我下次注意。"
- ✅ "以后遇到类似情况，我会先冷静5分钟再说话，不让你再受委屈。"

记住，道歉的目的是修复关系，而不是让你快点解脱。用心道歉，对方会感受到的。`,
  },
];

export async function POST(request: NextRequest) {
  try {
    // 检查是否已有文章
    const existingPosts = await query<{ id: number }>('SELECT id FROM blog_posts LIMIT 1');

    // 如果已有文章，不重复迁移
    if (existingPosts.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: '文章已存在，跳过迁移',
        count: 0
      });
    }

    // 批量插入文章
    const values: unknown[] = [];
    const placeholders = PRESET_POSTS.map((post, index) => {
      const offset = index * 3;
      values.push(post.title, post.summary, post.content);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
    }).join(', ');

    const insertResult = await query(
      `
        INSERT INTO blog_posts (title, summary, content)
        VALUES ${placeholders}
        RETURNING id
      `,
      values,
    );

    return NextResponse.json({
      success: true,
      message: '文章迁移成功',
      count: insertResult.rows.length || 0
    });
  } catch (error) {
    console.error('迁移文章失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '迁移失败' },
      { status: 500 }
    );
  }
}
