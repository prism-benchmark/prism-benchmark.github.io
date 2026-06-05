---
title: "PRISM: A Multi-Dimensional Benchmark for Evaluating LLM Peer Reviewers"
description: "PRISM - A multi-dimensional benchmark for evaluating LLM peer reviewers across depth, novelty, flaw detection, and constructiveness."
image: "/screenshot-light.png"
---

# PRISM: A Multi-Dimensional Benchmark for Evaluating LLM Peer Reviewers

**Authors:** Ngoc Phan Phuoc Loc, Toan Huynh La Viet, Thanh Tran Khanh, Duy A Nguyen, Tuan Anh Nguyen Pham, Thanh Nguyen, Nitesh V. Chawla, Wray Buntine, Kok-Seng Wong, Khoa D. Doan, Binh T. Nguyen

**Affiliations:** VinUniversity; University of Illinois, Urbana-Champaign; University of Notre Dame; Monash University

**Contact (co-corresponding):** khoa.dd@vinuni.edu.vn, binh.nt2@vinuni.edu.vn

**arXiv:** https://arxiv.org/abs/2605.26730

**Resources:** [Agent card](https://prism-benchmark.github.io/prism-page/.well-known/agent-card.json) · [API catalog](https://prism-benchmark.github.io/prism-page/.well-known/api-catalog) · [Skills index](https://prism-benchmark.github.io/prism-page/.well-known/agent-skills/index.json) · [Interactive demo](https://prism-benchmark.github.io/prism-page/demo)

## Abstract

Scientific peer review is under mounting strain as major machine learning venues face rapidly growing submission volumes, heavier reviewer workloads, and increasingly difficult paper-to-reviewer matching. At the same time, Large Language Models (LLMs) have moved from proofreading aids to automated reviewer agents capable of drafting full scientific critiques. This raises a central question: are LLMs sufficient reviewers for evaluating scientific work, especially when human reviewers themselves operate under severe time pressure?

We introduce **PRISM** (**P**eer **R**eview **I**ntelligence via **S**tructured **M**ulti-dimensional assessment), a benchmark for evaluating both LLM-generated and human reviews across four core duties: depth of analysis, novelty assessment, flaw identification and prioritization, and multi-dimensional constructiveness. Each duty is measured through a dedicated pipeline grounded in argument mining, retrieval-augmented verification, and consensus-based scoring. Across 1,000 papers from ICLR, ICML, and NeurIPS, PRISM shows that LLM reviewers can be strong task-matched specialists, but no single system matches the balanced performance of human reviewers. LLM reviewers are therefore best used as deliberate, human-assisted supplements rather than general-purpose replacements.

## Insights

1. No single LLM reviewer is best at everything. Strong systems specialize in depth, novelty, flaw scanning, or constructiveness.
2. LLMs are strong specialists, not full replacements for human reviewers. They excel at exhaustive scanning and systematic verification.
3. The best workflow is human-led and LLM-assisted. Humans remain the most balanced and calibrated judges.

## Introducing PRISM

Major ML venues now receive tens of thousands of submissions, which makes reviewer assignment, workload, and review quality increasingly difficult to manage. LLM reviewers offer scale, but common evaluation methods often rely on surface similarity metrics or broad LLM-as-a-judge scores. These approaches can blur together fluency, factuality, and scientific rigor.

PRISM asks a stricter question:

> Does a review provide grounded analysis, calibrated novelty judgment, valid flaw detection, and actionable feedback?

To answer it, PRISM evaluates each manuscript-review pair through **four independent and interpretable pipelines**. Each pipeline extracts small review units, verifies them against the manuscript or prior literature, and computes metrics from those structured decisions instead of relying on a single opaque judge rating.

_PRISM overview._ Each review is decomposed into evidence units, novelty claims, flaw arguments, and atomic comments, then scored by modular evaluator pipelines.

## What PRISM Measures

| Dimension               | What it checks                                                                           | Metric output                                    |
| ----------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Depth of Analysis**   | Whether reviews are detailed and grounded in manuscript or literature evidence           | Premise Ratio, Grounding Score, DoA              |
| **Novelty Assessment**  | Whether novelty claims are supported by retrieved prior work                             | Novelty Score, Support Rate, Strict Support Rate |
| **Flaw Identification** | Whether reviews identify and prioritize critical vs. minor scientific issues             | Critical Recall, Minor Recall, nCPS              |
| **Constructiveness**    | Whether feedback is actionable, specific, justified, solution-oriented, and professional | Mean Constructiveness Score                      |

PRISM uses constrained LLM judging for extraction and labeling. The final scores are computed analytically from structured labels, retrieval evidence, and consensus verification — not from a single opaque judge rating.

## Methods

### Method 1: Depth of Analysis (DoA)

A strong review does more than state opinions. It supports its judgments with evidence that can be traced to the manuscript or to the surrounding literature. PRISM splits each review into **Argumentative Discourse Units (ADUs)**, labels each unit as a claim or premise, and checks whether the premises are properly grounded.

The pipeline focuses on core review sections such as Summary, Strengths, and Weaknesses. Each ADU receives an argumentative role, an aspect label such as novelty, methodology, experiments, or clarity, and a grounding level:

| Grounding Level            | Meaning                                       |
| -------------------------- | --------------------------------------------- |
| **0: Vague or generic**    | The premise is not tied to specific evidence. |
| **1: Manuscript-grounded** | The premise refers to concrete paper content. |
| **2: Literature-grounded** | The premise uses external scientific context. |

**Main score:** DoA combines evidence coverage (**Premise Ratio**) and evidence quality (**Grounding Score**) with a harmonic mean. A review must therefore be both detailed and well supported.

### Method 2: Novelty Assessment

Novelty judgments are most useful when they are anchored in prior work rather than broad impressions. PRISM extracts verbatim novelty claims from the review, retrieves related papers from Semantic Scholar, and verifies whether the retrieved literature supports or contradicts each claim.

The pipeline has three stages: extract the paper's core task, contribution anchors, and novelty claims; retrieve and diversify relevant prior work; then verify each claim-evidence pair as supporting, contradicting, or insufficiently evidenced.

**Main score:** the pipeline reports a normalized novelty-support score together with support rates. These measures indicate whether the reviewer's novelty statements are grounded in retrievable evidence. A high score means the claim is evidence grounded; it does not necessarily mean the reviewer reached the same judgment as a human expert.

### Method 3: Flaw Identification and Major-Issue Prioritization

Good reviewers need to identify real scientific flaws and give appropriate priority to the most serious ones. PRISM extracts flaw arguments from human and LLM reviews, verifies them against the paper, merges valid flaws into a consensus reference set, and labels them as **Critical** or **Minor**.

Because the true complete set of flaws in a manuscript is unobservable, PRISM builds a relative consensus ground truth from all human and LLM critiques. Candidate flaws are extracted, invalid or hallucinated critiques are removed, semantically equivalent flaws are merged, and valid issues are mapped back to their positions in the review.

**Main score:** severity-stratified recall measures how many flaws a reviewer finds. The **normalized Critique Prioritization Score (nCPS)** measures whether critical flaws appear before minor issues.

### Method 4: Multi-dimensional Constructiveness

A useful review should help authors improve the paper. PRISM breaks the review into **Atomic Review Comments (ARCs)** and scores each comment on five dimensions: actionability, specificity, justification, solution, and tone.

Each ARC is rated on a 0-2 scale for these five properties. The scoring is deliberately performed at the comment level. A review can be technically perceptive while still being unhelpful if it identifies a problem without explaining what the authors can do next.

**Main score:** the **Mean Constructiveness Score (MCS)** averages these comment-level scores to quantify whether feedback is specific, justified, actionable, solution-oriented, and professional.

| Constructiveness Dimension | What It Checks                                                      |
| -------------------------- | ------------------------------------------------------------------- |
| **Actionability**          | Does the comment give implementable guidance?                       |
| **Specificity**            | Does it point to concrete sections, equations, datasets, or claims? |
| **Justification**          | Is the critique supported by reasoning or evidence?                 |
| **Solution**               | Does it suggest a path to improve the paper?                        |
| **Tone**                   | Is the language professional and constructive?                      |

## Results and Analysis

Across **1,000 papers** from ICLR, ICML, and NeurIPS, PRISM shows that LLM reviewers tend to specialize in different review responsibilities. No single system dominates all four dimensions.

### Headline Results

| Evaluation Dimension     | Best Automated System                           | Human Baseline |
| ------------------------ | :---------------------------------------------- | :------------: |
| **Depth of Analysis**    | CycleReviewer: **0.484**; DeepReview: **0.483** |   **0.494**    |
| **Novelty Assessment**   | SEA: **0.833**                                  |   **0.787**    |
| **Critical Flaw Recall** | Reviewer2: **0.591**                            |   **0.343**    |
| **Minor Flaw Recall**    | Reviewer2: **0.459**                            |   **0.281**    |
| **Prioritization**       | SEA: **0.977**                                  |   **0.973**    |
| **Constructiveness**     | DeepReview: **0.634**                           |   **0.566**    |

### Key Findings

- **Humans remain the most balanced baseline:** Human DoA = 0.494, leading through premise density and methodology focus.
- **DeepReview and CycleReviewer nearly match human depth:** DoA = 0.483 and 0.484. Structured reasoning helps LLMs produce substantiated critiques.
- **SEA has the strongest novelty grounding:** Novelty score = 0.833 vs. human = 0.787. Retrieval-oriented pipelines verify literature claims.
- **Reviewer2 is the best flaw scanner:** Critical Recall = 0.591 vs. human = 0.343. LLMs surface missed issues for human reviewers.
- **DeepReview gives the most constructive feedback:** MCS = 0.634 vs. human = 0.566. It closes the loop from "this is a problem" to "here is how to fix it."

Human and LLM reviewers are **complementary**. Humans excel at balanced judgment and calibration; LLMs excel at exhaustive scanning and systematic verification.

## How to Use PRISM

Since no single system dominates all four dimensions, the evidence points toward targeted specialist use within a human-led pipeline.

| Need                             | Use             |
| -------------------------------- | --------------- |
| Find more critical flaws         | Reviewer2       |
| Draft constructive feedback      | DeepReview      |
| Check novelty against literature | SEA             |
| Make the final decision          | Human reviewers |

These systems are most effective as **specialist assistants within a human-led pipeline**, not as autonomous reviewers.

### Strengths and weaknesses by system

| System            | Strength                                          | Weakness                                      |
| ----------------- | ------------------------------------------------- | --------------------------------------------- |
| **Reviewer2**     | Exhaustive flaw scanning (highest recall)         | Limited solution provision                    |
| **DeepReview**    | Constructive feedback (actionable, professional)  | Slightly lower flaw recall                    |
| **SEA**           | Novelty verification (highest literature support) | Lower constructiveness                        |
| **CycleReviewer** | Strong analytical depth                           | High hallucination rate                       |
| **TreeReview**    | Limited comparative advantage                     | Surface-level trap (24% effort on formatting) |

## Related Systems

PRISM belongs to public benchmarks and reviewer-assistance projects that emphasize inspectable evaluation. Related systems include [Reviewer2](https://arxiv.org/abs/2402.10886), [SEA](https://aclanthology.org/2024.findings-emnlp.595/), [DeepReview](https://arxiv.org/abs/2503.08569), [TreeReview](https://aclanthology.org/2025.emnlp-main.790/), and [CycleReviewer](https://arxiv.org/abs/2411.00816).

## BibTeX

```bibtex
@article{prism2026,
  title={PRISM: A Multi-Dimensional Benchmark for Evaluating LLM Peer Reviewers},
  author={Ngoc Phan, Toan Huynh, Tran Khanh Thanh, Duy A. Nguyen, Nguyen Pham Tuan Anh, Thanh Nguyen, Nitesh V. Chawla, Wray Buntine, Kok-Seng Wong, Khoa D Doan, Binh Nguyen},
  journal={arXiv preprint},
  year={2026}
}
```
