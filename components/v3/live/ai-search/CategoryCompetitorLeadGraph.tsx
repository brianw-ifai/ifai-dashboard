"use client";

import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import {
  categoryCompetitorLeadMarks,
} from "@/components/v3/live/ai-search/category-competitor-lead-marks";
import { sumRoleTallies, type RoleGroupTally } from "@/lib/ai-search/question-role";

/** Graph of categories another brand leads on unbranded discovery. Hidden when there is nothing to plot. */
export function CategoryCompetitorLeadGraph({ groups }: { groups: readonly RoleGroupTally[] }) {
  const unbrandedResolved = sumRoleTallies(groups, "unbranded_discovery").resolved;
  if (unbrandedResolved <= 0) return null;

  const marks = categoryCompetitorLeadMarks(groups);
  if (marks.length === 0) return null;

  const maxTotal = Math.max(...marks.map((mark) => mark.fenderLeads + mark.competitorLeads), 1);

  return (
    <div className="ai-battle-lead-graph" data-ai-battle-lead-graph="">
      <div className="content-box-title" style={{ marginTop: 12 }}>
        Categories where another brand leads on <AiTerm term="unbranded discovery">unbranded discovery</AiTerm>
      </div>
      <ul className="ai-battle-lead-list">
        {marks.map((mark) => {
          const total = mark.fenderLeads + mark.competitorLeads;
          const widthPct = (100 * total) / maxTotal;
          const fenderPct = total > 0 ? (100 * mark.fenderLeads) / total : 0;
          const competitorPct = total > 0 ? (100 * mark.competitorLeads) / total : 0;
          return (
            <li key={mark.key} className="ai-battle-lead-row" data-ai-battle-lead-category={mark.key}>
              <div className="ai-battle-lead-label">{mark.label}</div>
              <div
                className="ai-battle-lead-track"
                role="img"
                aria-label={`${mark.label}. Fender/Squier leads ${mark.fenderLeads}. Competitor leads ${mark.competitorLeads}.`}
              >
                <div className="ai-battle-lead-bar" style={{ width: `${widthPct}%` }}>
                  {mark.fenderLeads > 0 ? (
                    <span
                      className="ai-battle-lead-fender"
                      style={{ width: `${fenderPct}%` }}
                      data-ai-battle-lead-fender={mark.fenderLeads}
                    />
                  ) : null}
                  {mark.competitorLeads > 0 ? (
                    <span
                      className="ai-battle-lead-competitor"
                      style={{ width: `${competitorPct}%` }}
                      data-ai-battle-lead-competitor={mark.competitorLeads}
                    />
                  ) : null}
                </div>
              </div>
              <div className="ai-battle-lead-counts">
                <span data-ai-battle-lead-fender-count={mark.key}>Fender/Squier leads {mark.fenderLeads}</span>
                <span aria-hidden="true"> · </span>
                <span data-ai-battle-lead-competitor-count={mark.key}>Competitor leads {mark.competitorLeads}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
