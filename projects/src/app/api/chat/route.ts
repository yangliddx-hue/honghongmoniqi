import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { Gender, Message, Option } from '@/types/game';

// 生成唯一ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// 随机打乱数组
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 根据好感度获取情绪描述
function getEmotionDescription(affection: number): string {
  if (affection < 0) {
    return '非常生气，冷暴力或激烈质问，甚至开始说一些绝情的话';
  } else if (affection < 30) {
    return '还在生气，但愿意听你说，语气带刺';
  } else if (affection < 60) {
    return '开始软化，嘴上生气但语气缓和，偶尔流露委屈';
  } else if (affection < 80) {
    return '快被哄好了，可能撒娇或小声说"哼"，但明显没那么生气了';
  } else {
    return '虽然原谅了，但还要你保证不再犯，语气娇嗔';
  }
}

// 生成对话和选项的 Prompt
function buildPrompt(
  gender: Gender,
  scenario: string,
  messages: Message[],
  affection: number,
  step: number,
  isGameOver: boolean,
  won: boolean
): string {
  const genderText = gender === 'female' ? '女朋友' : '男朋友';
  const emotion = getEmotionDescription(affection);

  // 胜利或失败的结束语
  if (isGameOver) {
    if (won) {
      return `你是${genderText}的视角。你们刚刚经历了一场情感危机，但对方成功哄好了你。

请用${emotion}的语气，说一句甜蜜的原谅台词，20字以内。
要求：撒娇、娇嗔、甜蜜，让对方感到被原谅的温暖。`;
    } else {
      return `你是${genderText}的视角。你们刚刚经历了一场情感危机，对方的表现让你非常失望。

请用${emotion}的语气，说一句绝情的结束台词，20字以内。
要求：表现出彻底的失望和寒心，让对方意识到自己的错误。`;
    }
  }

  // 正常的对话回合
  const context = messages.length > 0
    ? `对话历史：\n${messages.map(m => `${m.role === 'partner' ? '对方' : '你'}: ${m.content}`).join('\n')}`
    : '这是对话的开始，对方发来了第一条消息。';

  return `你是${genderText}的视角。你们刚刚发生了冲突，场景是：${scenario}。

当前好感度：${affection}/100（范围-50到100，越高越喜欢你）
当前回合：第${step}轮（共10轮）
你的情绪状态：${emotion}

${context}

请回复一段符合你情绪状态的台词（30字以内），然后生成6个选项供对方选择。
要求：
1. 台词要自然、符合角色性格，不能重复之前的对话
2. 选项必须包含：
   - 2个加分选项：真诚道歉、具体弥补方案、提起共同回忆等（+5到+20分）
   - 4个减分选项：敷衍、转移话题、找借口、以及一些搞笑离谱的选项（-5到-30分）
3. 选项要多样化、有趣，减分选项要有一些离谱到好笑的
4. 不要在选项中提示好坏，让对方自己判断

请按以下JSON格式回复（不要有任何其他内容）：
{
  "partnerMessage": "你的台词",
  "options": [
    {"id": "1", "content": "选项内容1", "score": 15},
    {"id": "2", "content": "选项内容2", "score": -20},
    ...
  ]
}`;
}

// 默认回复（API失败时使用）
function getDefaultResponse(gender: Gender, isGameOver: boolean, won: boolean): { partnerMessage: string; options: Option[] } {
  if (isGameOver) {
    if (won) {
      return {
        partnerMessage: won ? '好吧...这次就原谅你了，下次不许再犯了！' : '我真的太失望了，我们先冷静一下吧。',
        options: [],
      };
    }
    return {
      partnerMessage: '我真的太失望了，我们先冷静一下吧。',
      options: [],
    };
  }

  const defaultMessages = gender === 'female' ? [
    { message: '你怎么又这样？我真的很难过...', options: [
      { id: '1', content: '对不起，我知道错了', score: 10 },
      { id: '2', content: '别生气了，我请你吃大餐', score: 15 },
      { id: '3', content: '我这也是为你好啊', score: -10 },
      { id: '4', content: '啊？什么？我没听清', score: -25 },
      { id: '5', content: '你是不是来例假了？', score: -30 },
      { id: '6', content: '那我们分手吧', score: -50 },
    ]},
    { message: '你还知道回来？我等了你一整晚...', options: [
      { id: '1', content: '下次一定早点回来陪你', score: 10 },
      { id: '2', content: '我给你带了礼物哦', score: 15 },
      { id: '3', content: '和朋友玩一下怎么了', score: -15 },
      { id: '4', content: '你是我妈吗，管这么多', score: -30 },
      { id: '5', content: '要不你也出去玩？', score: -20 },
      { id: '6', content: '哦', score: -35 },
    ]},
  ] : [
    { message: '你到底有没有把我放在心上？', options: [
      { id: '1', content: '当然有，你对我很重要', score: 10 },
      { id: '2', content: '我错了，以后会注意的', score: 15 },
      { id: '3', content: '你想太多了', score: -15 },
      { id: '4', content: '我工作忙嘛', score: -10 },
      { id: '5', content: '那你找个更关心你的？', score: -30 },
      { id: '6', content: '呵呵', score: -35 },
    ]},
  ];

  const selected = defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
  return {
    partnerMessage: selected.message,
    options: shuffleArray(selected.options),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gender, scenario, messages, affection, step, isGameOver, won } = body as {
      gender: Gender;
      scenario: string;
      messages: Message[];
      affection: number;
      step: number;
      isGameOver: boolean;
      won: boolean;
    };

    // 参数验证
    if (!gender || !scenario) {
      return NextResponse.json(
        { error: 'Missing required parameters: gender or scenario' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config({ timeout: 30000 });
    const client = new LLMClient(config, customHeaders);

    const prompt = buildPrompt(gender, scenario, messages, affection, step, isGameOver, won);

    // 构建对话历史（包含所有消息）
    const chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...messages.map(msg => ({
        role: (msg.role === 'partner' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: prompt },
    ];

    let responseContent = '';
    try {
      const stream = client.stream(chatHistory, {
        model: 'doubao-seed-1-8-251228',
        temperature: 0.8,
      });

      for await (const chunk of stream) {
        if (chunk.content) {
          responseContent += chunk.content.toString();
        }
      }
    } catch (apiError) {
      console.error('[Chat API] LLM调用失败:', apiError);
      // API失败时返回默认回复
      const defaultResp = getDefaultResponse(gender, isGameOver, won);
      return NextResponse.json(defaultResp);
    }

    // 解析JSON响应
    try {
      // 尝试提取JSON
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // 为选项生成ID
        const options = parsed.options.map((opt: { content: string; score: number }) => ({
          id: generateId(),
          content: opt.content,
          score: opt.score,
        }));

        return NextResponse.json({
          partnerMessage: parsed.partnerMessage,
          options: shuffleArray(options),
        });
      }
      
      // 如果无法解析JSON，返回默认回复
      console.error('[Chat API] 无法解析LLM响应:', responseContent);
      const defaultResp = getDefaultResponse(gender, isGameOver, won);
      return NextResponse.json(defaultResp);
    } catch (parseError) {
      console.error('[Chat API] JSON解析失败:', parseError);
      const defaultResp = getDefaultResponse(gender, isGameOver, won);
      return NextResponse.json(defaultResp);
    }
  } catch (error) {
    console.error('[Chat API] 请求处理失败:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
