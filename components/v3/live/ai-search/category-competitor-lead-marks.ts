import { headlineAside, type RoleGroupTally } from "@/lib/ai-search/question-role";
import { categoryLabel } from "@/lib/ai-search/run-metrics";

/** One category bar for unbranded discovery: Fender/Squier leads vs competitor leads. */
export type CategoryCompetitorLeadMark = {
  key: string;
  label: string;
  fenderLeads: number;
  competitorLeads: number;
};

/**
 * Categories where another brand leads on unbranded discovery.
 * Sorted by competitor leads (largest first). Uses the same tallies as the table.
 */
export function categoryCompetitorLeadMarks(
  groups: readonly RoleGroupTally[],
): CategoryCompetitorLeadMark[] {
  return groups
    .map((group) => {
      const unbranded = group.roles.unbranded_discovery;
      return {
        key: group.key,
        label: categoryLabel(group.key),
        fenderLeads: unbranded.fenderWins,
        competitorLeads: headlineAside(group).competitorWins,
      };
    })
    .filter((mark) => mark.competitorLeads > 0)
    .sort((a, b) => b.competitorLeads - a.competitorLeads || a.key.localeCompare(b.key));
}
