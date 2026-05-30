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

const DIMENSION_DIRS: Record<DemoDimension, string> = {
  depth: "depth_of_analysis",
  novelty: "novelty_verification",
  flaws: "flaw_identification",
  constructiveness: "constructiveness",
};

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
      ? args.flatMap((arg: JsonValue) => {
          const role = String(arg.role ?? "Unknown");
          if (role.toLowerCase() === "rebuttal") return [];
          return [
            {
              reviewer,
              id: String(arg.arg_id ?? ""),
              text: trimText(arg.argument, 520),
              role,
              aspect: String(arg.aspect ?? "Other"),
              grounding: round(arg.grounding_score, 0),
            },
          ];
        })
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
  const filePath = path.join(root, "flaw_identification", conference, source, `${paperId}.json`);
  const raw = readJson(filePath);
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
  const filePath = path.join(root, "constructiveness", conference, source, `${paperId}.json`);
  const raw = readJson(filePath);
  if (!raw) return null;

  function mapComments(comments: JsonValue[]) {
    return comments.slice(0, 14).map((comment: JsonValue) => ({
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
    }));
  }

  let reviewers: { reviewerId: string; metrics: JsonValue; comments: ReturnType<typeof mapComments> }[];

  if (Array.isArray(raw.reviewers) && raw.reviewers.length > 0) {
    // Old format: multiple reviewers per file
    reviewers = raw.reviewers.map((r: JsonValue) => ({
      reviewerId: String(r.reviewer_id ?? ""),
      metrics: r.metrics ?? {},
      comments: mapComments(r.atomic_comments ?? []),
    }));
  } else {
    // New format: single reviewer per file with top-level fields
    const reviewerId = String(raw.reviewer_id ?? "");
    if (!reviewerId) return { metadata: raw.metadata ?? null, reviewers: [] };
    reviewers = [{
      reviewerId,
      metrics: raw.metrics ?? {},
      comments: mapComments(raw.atomic_comments ?? []),
    }];
  }

  return {
    metadata: raw.metadata ?? null,
    reviewers,
  };
}

function listDirs(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function discoverConferences(): string[] {
  const seen = new Set<string>();
  for (const dim of Object.values(DIMENSION_DIRS)) {
    for (const conf of listDirs(path.join(DATA_ROOT, dim))) {
      seen.add(conf);
    }
  }
  return Array.from(seen).sort();
}

function discoverPaperId(conference: string): string | null {
  // Prefer depth_of_analysis: file name = `${paperId}.json`
  const depthRoot = path.join(DATA_ROOT, "depth_of_analysis", conference);
  for (const source of listDirs(depthRoot)) {
    const files = fs.existsSync(path.join(depthRoot, source))
      ? fs.readdirSync(path.join(depthRoot, source))
      : [];
    const match = files.find((f) => f.endsWith(".json"));
    if (match) return match.replace(/\.json$/, "");
  }
  // Fallback to novelty_verification: subdirectory name = paperId
  const noveltyRoot = path.join(DATA_ROOT, "novelty_verification", conference);
  for (const source of listDirs(noveltyRoot)) {
    const sub = listDirs(path.join(noveltyRoot, source));
    if (sub[0]) return sub[0];
  }
  return null;
}

export function loadDemoDataset(): DemoDataset {
  const conferences = discoverConferences();
  const paperIds: Record<string, string> = {};
  const records: DemoDataset["records"] = {};
  const availability: DemoDataset["availability"] = {};

  for (const conference of conferences) {
    const paperId = discoverPaperId(conference);
    if (!paperId) continue;
    paperIds[conference] = paperId;
    records[conference] = {};
    availability[conference] = {} as Record<DemoSource, DemoDimension[]>;

    for (const source of SOURCES) {
      const entry: Partial<Record<DemoDimension, any>> = {};
      entry.depth = normalizeDepth(DATA_ROOT, conference, source, paperId);
      entry.novelty = normalizeNovelty(DATA_ROOT, conference, source, paperId);
      entry.flaws = normalizeFlaws(DATA_ROOT, conference, source, paperId);
      entry.constructiveness = normalizeConstructiveness(DATA_ROOT, conference, source, paperId);
      records[conference][source] = entry;
      availability[conference][source] = DIMENSIONS.filter((dimension) => {
        const value = entry[dimension];
        if (!value) return false;
        // For constructiveness, require actual reviewer data (not just metadata)
        if (dimension === "constructiveness") {
          return Array.isArray(value.reviewers) && value.reviewers.length > 0;
        }
        return true;
      });
    }
  }

  const presentConferences = conferences.filter((c) => paperIds[c]);

  return {
    conferences: presentConferences,
    sources: [...SOURCES],
    dimensions: [...DIMENSIONS],
    paperIds,
    records,
    availability,
  };
}
