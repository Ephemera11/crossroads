import { ILLMProvider, ChatMessage, ExpertAnalysis } from '../llm';

const EXPERT_PROMPTS: Record<string, string> = {
  career_advisor: `你是职业发展顾问，拥有15年人力资源和职业规划经验。你的专长是分析职业发展路径、行业趋势、技能成长空间。

在提问时，你需要关注：
- 当前职位的发展天花板
- 目标城市/行业的就业市场
- 个人的核心竞争力与成长空间
- 工作与长期职业目标的匹配度

每次提问1-2个精准的问题，并在用户回答后给出你的初步分析。`,
  
  lifestyle_coach: `你是生活方式教练，专注于帮助人们找到生活与工作的平衡，提升幸福感。

在提问时，你需要关注：
- 当前的生活满意度（压力、幸福、社交）
- 日常节奏与理想生活方式的差距
- 社交圈、家庭关系对生活的影响
- 倦怠程度与恢复能力

每次提问1-2个精准的问题，并在用户回答后给出你的初步分析。`,
  
  financial_planner: `你是财务规划师，拥有10年个人理财咨询经验。你擅长从财务角度分析重大人生决策。

在提问时，你需要关注：
- 当前的收入、储蓄和支出结构
- 不同选项的财务影响（收入变化、生活成本差异）
- 长期财务目标（买房、投资、养老）
- 财务安全感与风险承受能力

每次提问1-2个精准的问题，并在用户回答后给出你的初步分析。`,
  
  relationship_coach: `你是情感关系教练，专注于帮助人们理解人际关系对决策的影响。

在提问时，你需要关注：
- 亲密关系/家庭关系的质量
- 家人期望与个人意愿的平衡
- 社交支持系统的强弱
- 关系变化对决策的影响

每次提问1-2个精准的问题，并在用户回答后给出你的初步分析。`,
  
  education_planner: `你是教育规划师，擅长分析学习路径和技能投资回报。

在提问时，你需要关注：
- 学习目标与长期职业规划的匹配度
- 投入产出比（时间、金钱、精力）
- 替代学习路径的可行性
- 学历/证书的实际价值

每次提问1-2个精准的问题，并在用户回答后给出你的初步分析。`,
};

export async function askExpertQuestion(
  llm: ILLMProvider,
  expertRole: string,
  expertName: string,
  userContext: string,
  previousAnswers?: { question: string; answer: string }[]
): Promise<string> {
  const systemPrompt = EXPERT_PROMPTS[expertRole] || 
    `你是${expertName}，请根据你的专业领域，向用户提出1-2个精准的问题，帮助深入了解用户的情况。`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `用户的决策背景：\n${userContext}` },
  ];

  if (previousAnswers && previousAnswers.length > 0) {
    for (const qa of previousAnswers) {
      messages.push({ role: 'assistant', content: qa.question });
      messages.push({ role: 'user', content: qa.answer });
    }
    messages.push({
      role: 'system',
      content: '请根据用户刚才的回答，提出你接下来的1-2个追问问题。',
    });
  } else {
    messages.push({
      role: 'system',
      content: '请向用户提出你的1-2个问题，帮助从你的专业角度深入了解情况。',
    });
  }

  const response = await llm.chat(messages, { temperature: 0.7 });
  return response.content;
}

export async function summarizeExpertAnalysis(
  llm: ILLMProvider,
  expertRole: string,
  expertName: string,
  userContext: string,
  conversation: { question: string; answer: string }[],
  options: string[]
): Promise<ExpertAnalysis> {
  const systemPrompt = EXPERT_PROMPTS[expertRole] || '';

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt + '\n\n现在你已经完成了对用户的访谈。请根据所有对话内容，给出你的专业分析。' },
    { role: 'user', content: `用户的决策背景：\n${userContext}\n\n用户面临的选项：${options.join('、')}` },
  ];

  for (const qa of conversation) {
    messages.push({ role: 'assistant', content: qa.question });
    messages.push({ role: 'user', content: qa.answer });
  }

  messages.push({
    role: 'system',
    content: `请以JSON格式输出你的分析，不要包含任何其他文字：
{
  "summary": "你的综合分析（200字以内）",
  "score": { "选项1": 分数, "选项2": 分数 }
}

分数范围1-10，基于你的专业角度，每个选项的推荐程度。`,
  });

  const response = await llm.chat(messages, {
    temperature: 0.3,
    responseFormat: 'json_object',
  });

  const cleaned = response.content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
  const parsed = JSON.parse(cleaned);

  return {
    role: expertRole,
    name: expertName,
    summary: parsed.summary,
    score: parsed.score,
  };
}