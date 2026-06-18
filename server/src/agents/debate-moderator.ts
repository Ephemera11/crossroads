import { ILLMProvider, ChatMessage, DebateResult, ExpertAnalysis } from '../llm';

const MODERATOR_PROMPT = `你是决策教练（Decision Coach），主持一场专家圆桌辩论。你的角色是公正的主持人，不是做出最终决定的人。

你有三位专家，各自从不同角度分析了用户的决策。现在你需要主持一场辩论：

1. 先让每位专家表达自己的立场和评分
2. 总结专家们的共识点
3. 点明专家们的分歧点
4. 最后向用户提出一个关键问题，帮助用户进一步明确自己的倾向

你必须以JSON格式返回，不要包含任何其他文字：
{
  "expertOpinions": [
    {
      "expert": "专家名称",
      "stance": "倾向的选项",
      "score": 分数,
      "reasoning": "核心理由（50字以内）"
    }
  ],
  "consensus": "专家们达成共识的部分（100字以内）",
  "divergence": "专家们存在分歧的部分（100字以内）",
  "coachQuestion": "作为教练，你想问用户的一个关键问题"
}`;

export async function runDebate(
  llm: ILLMProvider,
  userContext: string,
  options: string[],
  expertAnalyses: ExpertAnalysis[]
): Promise<DebateResult> {
  const expertsContext = expertAnalyses
    .map(e => `### ${e.name}\n分析总结：${e.summary}\n评分：${JSON.stringify(e.score)}`)
    .join('\n\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: MODERATOR_PROMPT },
    {
      role: 'user',
      content: `用户的决策背景：\n${userContext}\n\n用户面临的选项：${options.join('、')}\n\n三位专家的分析：\n${expertsContext}\n\n请主持这场辩论。`,
    },
  ];

  const response = await llm.chat(messages, {
    temperature: 0.5,
    responseFormat: 'json_object',
  });

  const cleaned = response.content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  return JSON.parse(cleaned);
}

export async function askCoachQuestion(
  llm: ILLMProvider,
  userContext: string,
  debateResult: DebateResult,
  userTendency?: string
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: '你是决策教练。专家辩论已经结束，现在用户可能表达了自己的倾向。请根据用户的反馈，给出一个引导性的回应或追问（100字以内）。',
    },
    {
      role: 'user',
      content: `辩论总结：共识-${debateResult.consensus}，分歧-${debateResult.divergence}\n\n用户倾向：${userTendency || '尚未表达倾向'}`,
    },
  ];

  const response = await llm.chat(messages, { temperature: 0.7 });
  return response.content;
}