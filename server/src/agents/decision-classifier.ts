import { ILLMProvider, DecisionClassification, ChatMessage } from '../llm';

const SYSTEM_PROMPT = `你是一位资深的决策教练（Decision Coach）。用户会向你描述一个让他们纠结的人生决策。

你的任务：
1. 识别决策类型（career/lifestyle/relationship/education/consumption/general）
2. 提取用户面临的具体选项（至少2个）
3. 为该决策推荐3位最合适的专家顾问

你必须以JSON格式返回，不要包含任何其他文字：
{
  "decisionType": "决策类型",
  "title": "简短标题（10字以内）",
  "options": ["选项1", "选项2"],
  "recommendedExperts": [
    {"role": "career_advisor", "name": "职业发展顾问", "priority": 1},
    {"role": "lifestyle_coach", "name": "生活方式教练", "priority": 2},
    {"role": "financial_planner", "name": "财务规划师", "priority": 3}
  ]
}

可选的专家角色及其中文名：
- career_advisor: 职业发展顾问
- lifestyle_coach: 生活方式教练
- financial_planner: 财务规划师
- relationship_coach: 情感关系教练
- education_planner: 教育规划师

根据用户的具体情况，选择最合适的3位专家组合。`;

export async function classifyDecision(
  llm: ILLMProvider,
  userInput: string
): Promise<DecisionClassification> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userInput },
  ];

  const response = await llm.chat(messages, {
    temperature: 0.3,
    responseFormat: 'json_object',
  });

  const cleaned = response.content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  return JSON.parse(cleaned);
}