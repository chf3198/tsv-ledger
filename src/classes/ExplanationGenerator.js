/**
 * ExplanationGenerator class
 * Extracted from human-ai-collaboration-system.js
 */

class ExplanationGenerator {
  generate(decision, level) {
    const explanations = {
      basic: `Decision made: ${decision.decision}`,
      intermediate: `Decision: ${decision.decision}. Based on ${decision.factors?.length || 0} factors with ${(decision.confidence_score * 100).toFixed(0)}% confidence.`,
      advanced: `Decision: ${decision.decision}. Considered ${decision.alternatives_considered?.length || 0} alternatives. Factors: ${decision.factors?.map(f => f.description).join(', ') || 'none'}.`,
      expert: `Decision: ${decision.decision}. Full analysis: ${JSON.stringify(decision, null, 2)}`
    };

    return explanations[level] || explanations.intermediate;
  }
}
