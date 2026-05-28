import fs from "node:fs";
import path from "node:path";

/* eslint-disable @typescript-eslint/no-explicit-any -- Demo data is normalized from heterogeneous benchmark JSON files. */

const DATA_ROOT = path.resolve(process.cwd(), "data_demo");
const SOURCES = [
  "human",
  "sea",
  "tree",
  "reviewer2",
  "deepreview",
  "cyclereview",
] as const;
const DIMENSIONS = [
  "depth",
  "novelty",
  "flaws",
  "constructiveness",
] as const;

export type DemoSource = (typeof SOURCES)[number];
export type DemoDimension = (typeof DIMENSIONS)[number];

type JsonValue = Record<string, any>;

export type DemoDataset = {
  conferences: string[];
  sources: DemoSource[];
  dimensions: DemoDimension[];
  paperIds: Record<string, string>;
  records: Record<string, Record<string, Partial<Record<DemoDimension, any>>>>;
  availability: Record<string, Record<DemoSource, DemoDimension[]>>;
};

function readJson(filePath: string): JsonValue | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as JsonValue;
}

function readJsonlFirst(filePath: string, paperId: string): JsonValue | null {
  if (!fs.existsSync(filePath)) return null;
  const rows = fs
    .readFileSync(filePath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as JsonValue);
  return rows.find((row) => row.paper_id === paperId) ?? rows[0] ?? null;
}

function trimText(value: unknown, max = 420): string {
  if (typeof value !== "string") return "";
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max - 1)}...` : compact;
}

function round(value: unknown, digits = 3): number | null {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function normalizeDepth(root: string, conference: string, source: DemoSource, paperId: string) {
  const raw = readJson(
    path.join(root, "depth_of_analysis", conference, source, `${paperId}.json`),
  );
  const reviewGroups = raw?.reviews_analysis ?? {};
  const argumentsList = Object.entries(reviewGroups).flatMap(([reviewer, args]) =>
    Array.isArray(args)
      ? args.map((arg: JsonValue) => ({
          reviewer,
          id: String(arg.arg_id ?? ""),
          text: trimText(arg.argument, 520),
          role: String(arg.role ?? "Unknown"),
          aspect: String(arg.aspect ?? "Other"),
          grounding: round(arg.grounding_score, 0),
        }))
      : [],
  );

  if (!argumentsList.length) return null;

  const premises = argumentsList.filter((item) => item.role.toLowerCase() === "premise");
  const groundingCounts = premises.reduce<Record<string, number>>((acc, item) => {
    const key = item.grounding === null ? "unscored" : String(item.grounding);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    premiseRatio: round(premises.length / argumentsList.length),
    argumentCount: argumentsList.length,
    premiseCount: premises.length,
    groundingCounts,
    arguments: argumentsList,
  };
}

function normalizeNovelty(root: string, conference: string, source: DemoSource, paperId: string) {
  const base = path.join(root, "novelty_verification", conference, source, paperId);
  const task1 = readJson(path.join(base, "task1_result.json"));
  const task2 = readJson(path.join(base, "task2_result.json"));
  const task3 = readJson(path.join(base, "task3_result.json"));
  if (!task1 && !task2 && !task3) return null;

  const paper = task1?.paper ?? {};
  const claims = (task1?.review?.novelty_claims ?? []).map((claim: JsonValue) => {
    const aggregate = (task3?.aggregated ?? []).find(
      (item: JsonValue) => item.review_sentence_id === claim.claim_id,
    );
    const evidenceResults = (aggregate?.evidence_results ?? []) as JsonValue[];
    const labels = evidenceResults.reduce<Record<string, number>>(
      (acc: Record<string, number>, evidence: JsonValue) => {
        const label = String(evidence.label ?? "UNKNOWN");
        acc[label] = (acc[label] ?? 0) + 1;
        return acc;
      },
      {},
    );
    return {
      id: String(claim.claim_id ?? ""),
      text: trimText(claim.text, 520),
      stance: String(claim.stance ?? "unknown"),
      expectedEvidence: String(claim.evidence_expected ?? "unknown"),
      finalScore: round(aggregate?.final_score),
      labels,
      evidence: evidenceResults.slice(0, 4).map((item: JsonValue) => ({
        label: String(item.label ?? "UNKNOWN"),
        score: round(item.score),
        explanation: trimText(item.explanation, 260),
      })),
    };
  });

  return {
    task: trimText(paper.core_task, 260),
    contributions: (paper.contributions ?? []).slice(0, 4).map((item: JsonValue) => ({
      name: trimText(item.name, 140),
      description: trimText(item.description, 360),
      sourceHint: trimText(item.source_hint, 120),
    })),
    claims,
    priorWorks: (task2?.candidate_pool_top30 ?? []).slice(0, 8).map((item: JsonValue) => ({
      title: trimText(item.title, 170),
      year: item.year ?? null,
      venue: trimText(item.venue, 100),
      abstract: trimText(item.abstract, 280),
      url: typeof item.url === "string" ? item.url : "",
    })),
  };
}

function normalizeFlaws(root: string, conference: string, source: DemoSource, paperId: string) {
  const raw = readJsonlFirst(
    path.join(root, "flaw_identification", conference, source, "all_papers_results.jsonl"),
    paperId,
  );
  if (!raw) return null;
  const issues = raw.metrics_report?.cps?.Canonical_Issue_Bank?.issues ?? [];
  const evaluations = raw.evaluations?.evaluations ?? {};
  const validIssues = issues
    .filter((issue: JsonValue) => evaluations[issue.issue_id]?.is_valid !== false)
    .map((issue: JsonValue) => ({
      id: String(issue.issue_id ?? ""),
      severity: String(issue.shared_severity ?? evaluations[issue.issue_id]?.severity ?? "None"),
      topic: trimText(issue.macro_topic, 130),
      summary: trimText(issue.canonical_summary, 420),
    }));

  return {
    summary: raw.metrics_report?.cfi?.Ground_Truth_Summary ?? null,
    issues: validIssues,
    rankings: (raw.metrics_report?.cfi?.Reviewer_Rankings ?? [])
      .slice(0, 8)
      .map((row: JsonValue) => ({
        reviewer: String(row.Reviewer_ID ?? ""),
        criticalRecall: round(row.Critical_Recall),
        minorRecall: round(row.Minor_Recall),
        totalFound: round(row.Total_Valid_Flaws_Found, 0),
      })),
  };
}

function normalizeConstructiveness(
  root: string,
  conference: string,
  source: DemoSource,
  paperId: string,
) {
  const raw = readJsonlFirst(
    path.join(root, "constructiveness", conference, source, "all_results_lite.jsonl"),
    paperId,
  );
  if (!raw) return null;
  return {
    metadata: raw.metadata ?? null,
    reviewers: (raw.reviewers ?? []).map((reviewer: JsonValue) => ({
      reviewerId: String(reviewer.reviewer_id ?? ""),
      metrics: reviewer.metrics ?? {},
      comments: (reviewer.atomic_comments ?? []).slice(0, 14).map((comment: JsonValue) => ({
        id: String(comment.arc_id ?? ""),
        section: String(comment.section ?? ""),
        type: String(comment.comment_type ?? ""),
        content: trimText(comment.content, 420),
        scores: [
          round(comment.D1_actionability, 0),
          round(comment.D2_specificity, 0),
          round(comment.D3_justification, 0),
          round(comment.D4_solution, 0),
          round(comment.D5_tone, 0),
        ],
      })),
    })),
  };
}

export function loadDemoDataset(): DemoDataset {
  const manifest = readJson(path.join(DATA_ROOT, "MANIFEST.json"));
  const conferences = manifest?.conferences ?? [];
  const paperIds = manifest?.paper_ids ?? {};
  const records: DemoDataset["records"] = {};
  const availability: DemoDataset["availability"] = {};

  for (const conference of conferences) {
    const paperId = paperIds[conference];
    records[conference] = {};
    availability[conference] = {} as Record<DemoSource, DemoDimension[]>;

    for (const source of SOURCES) {
      const entry: Partial<Record<DemoDimension, any>> = {};
      entry.depth = normalizeDepth(DATA_ROOT, conference, source, paperId);
      entry.novelty = normalizeNovelty(DATA_ROOT, conference, source, paperId);
      entry.flaws = normalizeFlaws(DATA_ROOT, conference, source, paperId);
      entry.constructiveness = normalizeConstructiveness(DATA_ROOT, conference, source, paperId);
      records[conference][source] = entry;
      availability[conference][source] = DIMENSIONS.filter((dimension) => Boolean(entry[dimension]));
    }
  }

  return {
    conferences,
    sources: [...SOURCES],
    dimensions: [...DIMENSIONS],
    paperIds,
    records,
    availability,
  };
}
