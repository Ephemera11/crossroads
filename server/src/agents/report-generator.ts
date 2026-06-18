import { ILLMProvider, ChatMessage, DecisionReport, ExpertAnalysis, DebateResult } from '../llm';

const REPORT_PROMPT = `你是决策教练的助手，负责生成结构化的决策报告。请根据所有对话历史和专家分析，生成一份完整的决策报告。

报告必须包含以下四个部分，以JSON格式返回：

1. scoresJson: 专家加权对比数据，格式为数组，每个元素包含 expert(专家名), option(选项), score(分数)
2. coreConflict: 核心矛盾点（从对话中提炼用户真正的纠结和价值观冲突，150字以内）
3. strategy: 分阶段策略建议（不是"选A还是B"，而是"如果选A，接下来三步是什么；如果选B，接下来三步是什么"，300字以内）
4. actionItems: 下一步行动清单，格式为数组，每个元素包含 action(行动), priority(high/medium/low), timeframe(时间)

你必须以JSON格式返回，不要包含任何其他文字：
{
  "scoresJson": "[{\"expert\":\"专家名\",\"option\":\"选项\",\"score\":分数}]",
  "coreConflict": "核心矛盾点描述",
  "strategy": "分阶段策略描述",
  "actionItems": "[{\"action\":\"行动\",\"priority\":\"high\",\"timeframe\":\"本周\"}]"
}`;

export async function generateReport(
  llm: ILLMProvider,
  userContext: string,
  options: string[],
  expertAnalyses: ExpertAnalysis[],
  debateResult: DebateResult,
  fullHistory: string
): Promise<DecisionReport> {
  const expertsContext = expertAnalyses
    .map(e => `${e.name}：${e.summary} 评分：${JSON.stringify(e.score)}`)
    .join('\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: REPORT_PROMPT },
    {
      role: 'user',
      content: `用户决策背景：${userContext}\n\n选项：${options.join('、')}\n\n专家分析：\n${expertsContext}\n\n辩论结果：\n共识：${debateResult.consensus}\n分歧：${debateResult.divergence}\n\n完整对话历史：\n${fullHistory}`,
    },
  ];

  const response = await llm.chat(messages, {
    temperature: 0.3,
    maxTokens: 4096,
    responseFormat: 'json_object',
  });

  const cleaned = response.content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  return JSON.parse(cleaned);
}