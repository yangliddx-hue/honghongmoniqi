// 性别
export type Gender = 'female' | 'male';

// 语音类型
export type VoiceType = 'gentle-female' | 'cool-female' | 'cute-female' | 'deep-male' | 'gentle-male';

// 场景
export interface Scenario {
  id: string;
  title: string;
  description: string;
}

// 消息
export interface Message {
  role: 'user' | 'partner';
  content: string;
}

// 选项
export interface Option {
  id: string;
  content: string;
  score: number; // 好感度变化值
}

// 游戏状态
export interface GameState {
  step: number;              // 当前轮次 (1-10)
  affection: number;         // 好感度 (-50 到 100)
  gender: Gender | null;     // 对方性别
  scenario: Scenario | null; // 当前场景
  voiceType: VoiceType | null; // 语音类型
  messages: Message[];       // 对话历史
  currentOptions: Option[];  // 当前选项
  gameOver: boolean;         // 游戏是否结束
  won: boolean;              // 是否获胜
  isLoading: boolean;        // 是否正在加载
}

// 预设场景列表
export const SCENARIOS: Scenario[] = [
  {
    id: 'anniversary',
    title: '忘记纪念日',
    description: '今天是你们在一起三周年，你完全忘了...',
  },
  {
    id: 'late-night',
    title: '深夜不回消息',
    description: '你昨晚打游戏到凌晨三点，对方发了十几条消息你都没回...',
  },
  {
    id: 'flirty-chat',
    title: '被发现和异性聊天',
    description: '对方看到你和异性朋友的暧昧聊天记录...',
  },
  {
    id: 'lost-cat',
    title: '把对方的猫弄丢了',
    description: '你帮对方照顾猫的时候，猫跑丢了...',
  },
  {
    id: 'public-joke',
    title: '当众让对方没面子',
    description: '你在朋友聚会上开了一个过分的玩笑...',
  },
];

// 语音配置映射
export const VOICE_CONFIG: Record<VoiceType, { speaker: string; label: string; gender: Gender }> = {
  'gentle-female': { speaker: 'zh_female_xiaohe_uranus_bigtts', label: '温柔女声', gender: 'female' },
  'cool-female': { speaker: 'zh_female_vv_uranus_bigtts', label: '霸道御姐', gender: 'female' },
  'cute-female': { speaker: 'saturn_zh_female_keainvsheng_tob', label: '可爱软妹', gender: 'female' },
  'deep-male': { speaker: 'zh_male_m191_uranus_bigtts', label: '低沉男声', gender: 'male' },
  'gentle-male': { speaker: 'zh_male_taocheng_uranus_bigtts', label: '温柔男声', gender: 'male' },
};

// 获取适用于某性别的语音列表
export const getVoicesByGender = (gender: Gender): VoiceType[] => {
  return (Object.keys(VOICE_CONFIG) as VoiceType[]).filter(
    (key) => VOICE_CONFIG[key].gender === gender
  );
};

// 常量
export const INITIAL_AFFECTION = 20;
export const MAX_AFFECTION = 100;
export const MIN_AFFECTION = -50;
export const WIN_AFFECTION = 80;
export const MAX_ROUNDS = 10;

// 默认游戏状态
export const INITIAL_GAME_STATE: GameState = {
  step: 0,
  affection: INITIAL_AFFECTION,
  gender: null,
  scenario: null,
  voiceType: null,
  messages: [],
  currentOptions: [],
  gameOver: false,
  won: false,
  isLoading: false,
};
