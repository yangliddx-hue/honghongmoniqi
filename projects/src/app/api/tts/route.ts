import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// 清理文本中的括号内容（用于语音合成）
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/（[^）]*）/g, '') // 去掉中文括号
    .replace(/\([^)]*\)/g, '')  // 去掉英文括号
    .replace(/\[[^\]]*\]/g, '')  // 去掉中括号
    .replace(/[「」『』]/g, '')   // 去掉其他标点
    .replace(/[?!。！？]/g, '')   // 去掉标点符号
    .trim();
}

// 语音配置映射
const VOICE_SPEAKERS: Record<string, string> = {
  'gentle-female': 'zh_female_xiaohe_uranus_bigtts',
  'cool-female': 'zh_female_vv_uranus_bigtts',
  'cute-female': 'saturn_zh_female_keainvsheng_tob',
  'deep-male': 'zh_male_m191_uranus_bigtts',
  'gentle-male': 'zh_male_taocheng_uranus_bigtts',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, speaker, uid } = body as {
      text: string;
      speaker?: string;
      uid: string;
    };

    // 参数验证
    if (!text || !uid) {
      return NextResponse.json(
        { error: 'Missing required parameters: text or uid' },
        { status: 400 }
      );
    }

    // 清理文本
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) {
      return NextResponse.json(
        { error: 'Text is empty after cleaning' },
        { status: 400 }
      );
    }

    // 获取speaker（如果未提供，使用默认）
    const speakerId = speaker || VOICE_SPEAKERS['gentle-female'];

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config({ timeout: 15000 });
    const client = new TTSClient(config, customHeaders);

    const response = await client.synthesize({
      uid,
      text: cleanText,
      speaker: speakerId,
      audioFormat: 'mp3',
    });

    return NextResponse.json({
      audioUri: response.audioUri,
      audioSize: response.audioSize,
    });
  } catch (error) {
    console.error('[TTS API] 请求处理失败:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
