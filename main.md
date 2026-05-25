# Introduction {#sec:intro}

Scientific peer review is under mounting strain. Submission volumes at
major machine learning venues have grown at an incredible rate: NeurIPS
received 15,671 submissions in 2024, surging to 21,575 in 2025
 [@neurips2024; @neurips2025blog], while ICML saw a 44.9% year-on-year
jump between 2023 and 2024 alone, followed by a further 25.4% increase
in 2025 [@icml2023stats; @icml2024stats; @icml2025stats]. This
exponential growth severely strains the reviewer pool and complicates
paper-to-reviewer matching, prompting venues to introduce new
load-management and quality-control mechanisms, such as ICML's recent
author self-ranking policies [@icml2026policy_blog]. Furthermore,
reviewing at several ML conferences is becoming mandatory with short
deadlines, creating additional pressure on reviewers, particularly when
assignments are not well aligned with their expertise. In response,
Large Language Models (LLMs) have moved rapidly from proofreading aids
to autonomous reviewer agents capable of drafting comprehensive
critiques and their deployment is no longer
theoretical [@chang-etal-2025-treereview; @gao2024reviewer2optimizingreviewgeneration; @yu-etal-2024-automated-SEA; @zhu-etal-2025-deepreview; @cyclereviewer].
Estimates indicate that 17--21% of reviews at recent top-tier venues
already involve LLM
assistance [@liang2023largelanguagemodelsprovide; @Wang_2024; @iclr2026policy],
prompting venues to adopt a wide range of policies from outright bans to
mandatory disclosure [@icml2026policy].

This reality raises an important question:*Are LLMs sufficient reviewers
to evaluate scientific work -- and, critically, are they better at
identifying gaps in a paper than human reviewers who increasingly work
under time constraints and review overload?* Answering this question is
particularly important when growing evidence suggests that human review
quality and reliability may be degrading under mounting pressures. For
example, the NeurIPS consistency experiment [@beygelzimer2023neurips]
suggested that as many as 23% of acceptance decisions may change
depending purely on reviewer assignment.

We address this by introducing a benchmark to evaluate both
LLM-generated and human reviews, grounded by official reviewer
guidelines of established machine learning venues (e.g., ICLR, NeurIPS).
A high-quality peer review must go beyond mere summarization to satisfy
four core duties: evaluating technical soundness, contextualizing
originality, diagnosing critical errors, and providing actionable
feedback. Accordingly, our benchmark evaluates whether the reviewers can
fulfill these mandates across four dimensions:

- **Depth of Analysis:** Do reviewers engage with a paper's
  methodological and empirical claims in depth, or do they default to
  surface-level assessment?

- **Novelty Assessment:** Are reviewers' novelty judgments grounded in
  prior literature, or do they rely on unverified or factually incorrect
  assertions?

- **Flaw Identification & Major Issues Prioritization:** How accurately
  and comprehensively do reviewers detect critical scientific flaws, and
  do they correctly prioritize fatal methodological concerns over minor
  textual anomalies?

- **Multi-dimensional Constructiveness:** How actionable,
  solution-oriented, and professionally calibrated is the reviewers'
  feedback?

We call this benchmark **PRISM** (**P**eer **R**eview **I**ntelligence
via **S**tructured **M**ulti-dimensional assessment). Each dimension is
operationalized through a dedicated evaluation pipeline, which is
grounded in argument mining, retrieval-augmented verification, and
consensus-based scoring. We then apply PRISM to compare five leading
automated reviewer systems---TreeReview [@chang-etal-2025-treereview],
Reviewer2 [@gao2024reviewer2optimizingreviewgeneration], SEA-E
[@yu-etal-2024-automated-SEA], DeepReview [@zhu-etal-2025-deepreview],
and CycleReviewer [@cyclereviewer]---and human reviewers on a stratified
corpus of papers drawn from ICLR, ICML, and NeurIPS (Figure
[\[fig:overall_result\]](#fig:overall_result){reference-type="ref"
reference="fig:overall_result"}). This analysis yields the following
insights:

::: minipage
- CycleReviewer and DeepReview match human analytical depth; TreeReview
  falls into a surface-level trap, over-indexing on presentation
  anomalies.

- SEA-E outperforms human reviewers on grounded novelty verification;
  other systems exhibit measurable novelty hallucination.

- Reviewer2 leads in flaw recall as a high-sensitivity scanner; LLMs
  broadly achieve near-perfect critical issue prioritization,
  demonstrating a cognitive alignment comparable to human reviewers.

- DeepReview produces the most actionable feedback, though a
  constructiveness gap relative to human reviewers persists across all
  systems.
:::

::: minipage
![image](./images/macro_metrics_spider_all.pdf){width="\\linewidth"}
[]{#fig:overall_result label="fig:overall_result"}
:::

No single system dominates across all four dimensions: each excels in a
distinct niche while leaving structured gaps invisible to aggregate
metrics. This positions LLM reviewers as powerful, task-matched
specialists---effective where deployed deliberately, but not yet near
general-purpose replacements for human reviewers. In summary, the key
contributions of this work are:

- **PRISM: A Multi-dimensional Benchmarking Framework.** We introduce
  PRISM, a structured evaluation framework with four dedicated pipelines
  that operationalizes RQ1--RQ4, probing scientific reviewer competence
  beyond surface-level prose.

- **Comprehensive Evaluation Corpus.** We curate a dataset of
  manuscripts and expert human reviews spanning ICLR, ICML, and NeurIPS,
  establishing a robust, consensus-driven reference for benchmarking
  automated reviewer systems.

- **Systematic Human-vs-LLM Analysis.** We benchmark five leading LLM
  reviewer systems across all four dimensions, revealing distinct
  specialization profiles and structured failure modes invisible to
  aggregate metrics.

- **Actionable Deployment Guidance.** We derive evidence-based
  recommendations for deploying LLM reviewers, identifying which systems
  best fit which roles within a human-assisted review pipeline.

# Related work {#sec:related_work}

#### LLM-based Reviewer Systems.

The rapid progress of large language models has spawned a growing family
of specialized automated reviewing systems. One line of work improves
review quality through structured reasoning:
TreeReview [@chang-etal-2025-treereview] decomposes evaluation into a
hierarchical tree of questions that are recursively refined and
aggregated, while DeepReview [@zhu-etal-2025-deepreview] emulates the
slow, deliberate thinking process of expert reviewers. A complementary
line focuses on optimizing the generation pipeline itself:
Reviewer2 [@gao2024reviewer2optimizingreviewgeneration] trains a
two-stage model that first predicts review aspects and then conditions
generation on them, and SEA [@yu-etal-2024-automated-SEA] standardizes
heterogeneous review data before fine-tuning dedicated evaluation and
analysis modules. Multi-agent collaboration offers yet another angle;
CycleReviewer [@cyclereviewer] pairs a research agent with a reviewer
agent in an iterative preference-training loop. While these systems
demonstrate impressive linguistic fluency, their corresponding
evaluation protocols predominantly rely on generic n-gram metrics or
monolithic LLM-as-a-judge scoring applied to the review as a whole.
Although some works evaluate multiple criteria, these macro-level
assessments are structurally blind to the granular logic of the
critique: they cannot verify whether individual claims are substantiated
by grounded premises, nor can they cross-check novelty assertions
against retrieved prior literature.

#### Evaluation of AI-Generated Reviews.

Evaluating AI-generated reviews is a distinct challenge from generating
them. Early work relied on lexical overlap
metrics---ROUGE [@lin-2004-rouge] and
BLEU [@papineni-etal-2002-bleu]---that reward surface similarity with
reference reviews but are blind to scientific reasoning quality and
factual
correctness [@novikova-etal-2017-need]. @liang2023largelanguagemodelsprovide
advanced beyond surface metrics by measuring point-level overlap between
LLM and human feedback, finding comparable coverage but systematic gaps
in methodological depth. The LLM-as-judge
paradigm [@liu-etal-2023-g; @zheng2023judging] offers richer evaluation,
but introduces well-documented biases---position [@zheng2023large],
verbosity [@saito2023verbosity], and
self-enhancement [@panickssery2024llm]---that are especially problematic
when scientific rigor, not linguistic fluency, is the target.
ReviewEval [@garg-etal-2025-revieweval] is the most structured prior
framework, defining six evaluation dimensions including depth of
analysis, constructiveness, and guideline adherence; however, relies on
end-to-end LLM rubric prompting to assign scores, and the benchmark
covers only 16 papers and three reviewer systems. DeepReview-Bench have
introduced large-scale evaluation sets (e.g., $1{,}000+$ samples), but
their scope is largely restricted to a single venue (ICLR).
RottenReviews [@ebrahimi2025rottenreviews] and the focus-level framework
of @focuslevel2025 study failure patterns and distributional biases in
LLM reviews, but neither provides a reusable, per-review scoring
protocol. @dycke2026automatic focused on faults in reasoning.

**PRISM** departs from all prior frameworks by deploying dedicated,
verifiable pipelines for each dimension---argument mining for depth,
retrieval-augmented claim verification for novelty, consensus-weighted
scoring for flaw identification, severity atomization for
prioritization, and semantic rule matching for constructiveness---rather
than relying on rubric-prompted LLM judging. In addition, PRISM
benchmarks five leading automated reviewer systems across a diverse,
stratified corpus of $1{,}000$ papers spanning five venue-years (ICLR
2024--2026, ICML 2025, and NeurIPS 2025), and each pipeline is
rigorously operationalized rather than superficially assessed.

# The PRISM Framework {#sec:method}

**PRISM** evaluates reviews across four independent pipelines designed
to target the specific failure modes of LLMs in scientific discourse
(Figure [1](#fig:overall_flow){reference-type="ref"
reference="fig:overall_flow"}). Rather than asking an LLM judge for a
holistic rating---which risks conflating stylistic fluency with
scientific rigor---each of the pipelines in our framework decomposes the
evaluation into structured evidence-extraction tasks: the LLM identifies
and classifies discrete evidence units, while final scores are computed
analytically. This approach ensures the evaluation is traceable and
allows for precise control over metric formulation. The subsequent
sections (§[3.1](#subsec:doa){reference-type="ref"
reference="subsec:doa"}--[3.4](#subsec:mcs){reference-type="ref"
reference="subsec:mcs"}) detail the computational formulations and
workflows for each dimension.

<figure id="fig:overall_flow" data-latex-placement="th">
<embed src="./images/PRISM_overview.pdf" style="width:90.0%" />
<figcaption><strong>Comprehensive overview of the PRISM evaluation
pipeline.</strong> The framework processes the peer review and
manuscript text through an initial Data Segmentation unit to extract
structural elements. The core evaluation is then distributed across four
modular LLM-driven pipelines presented in Sections <a href="#subsec:doa"
data-reference-type="ref" data-reference="subsec:doa">3.1</a> to <a
href="#subsec:mcs" data-reference-type="ref"
data-reference="subsec:mcs">3.4</a>. These modules output four distinct
quantitative metrics that form the final evaluation
profile.</figcaption>
</figure>

## Depth of Analysis {#subsec:doa}

A high-quality review is characterized not only by the presence of
critical claims, but also by the substantive evidence supporting
them [@hua-etal-2019-argument]. We define *Depth of Analysis* (DoA) as
the degree to which a reviewer substantiates their judgments with
objective, well-grounded premises: a shallow review relies on generic
assertions, while a strong critique backs each argument with evidence.

**Pipeline.** We extract the core review sections (Summary, Strengths,
Weaknesses) and break them into Argumentative Discourse Units
(ADUs) [@peldzusadu]. Each ADU is classified along two axes:
(i) *argumentative role*---*Claim* (a point of contention or conclusion)
or *Premise* (supporting evidence)---and (ii) *aspect topic* (Novelty,
Methodology, Experiments, or Clarity). Identified premises are then
assessed for *grounding level* $g(p) \in \{0,1,2\}$: Level 0
(Vague/Generic), Level 1 (Internal---references the manuscript
directly), or Level 2 (External---references broader scientific
literature).

**Score Formulation.** Let $A$ be the set of all ADUs, $P \subseteq A$
the subset classified as premises, and $g_{\max} = 2$ as the maximum
grounding level. We define the *Premise Ratio*
$R_{\mathrm{prem}} = |P|/|A|$ (evidence coverage) and the *normalized
Average Grounding Score*
$S_{\mathrm{depth}} = \frac{1}{g_{\max}|P|}\sum_{p \in P}g(p)
\in [0,1]$ (evidence quality). DoA is defined as the harmonic mean:
$\mathrm{DoA} = \frac{2 \cdot R_{\mathrm{prem}} \cdot S_{\mathrm{depth}}}
                        {R_{\mathrm{prem}} + S_{\mathrm{depth}}},$ which
penalizes the imbalance: a review must excel in both the *proportion*
and the *rigorousness* of its evidence to score highly. If $|P|=0$,
DoA $=0$ by definition. Although aspect labels do not factor into the
DoA score themselves, they reveal where reviewers direct their effort --
toward substantive dimensions or surface-level concerns
(Section [4.2.1](#sec:exp_doa){reference-type="ref"
reference="sec:exp_doa"}).

## Novelty Assessment

In scientific peer review, novelty is the degree to which a paper
introduces non-trivial findings---such as new ideas, methods, data, or
perspectives---relative to existing
knowledge [@novelty1; @novelty2; @novelty3]. A genuine novelty judgment,
therefore, requires situating the paper's claimed contributions within
the prior literature. Our pipeline operationalizes this by verifying
whether a reviewer's novelty comments are supported or refuted by
retrievable prior work [@zhang2026opennovelty].

**Pipeline.** The pipeline proceeds in three stages. ***Extraction***: a
constrained LLM extracts the paper's core task, contribution anchors,
and key terms, along with the set of verbatim novelty claims
$\mathcal{C} = \{c_1,\ldots,c_n\}$ from the review. ***Retrieval***: we
construct deterministic Semantic Scholar queries using the extracted
anchors. Results are filtered for prior publications, duplication, and
diversified via Maximal Marginal Relevance to form a candidate pool
$\mathcal{B} = \{b_1,\ldots,b_k\}$. ***Verification***: for each
claim-candidate pair $(c_i, b_j)$, an LLM judge compares the review
claim against both the paper context (abstract + introduction) and the
candidate's prior work (title + abstract). It returns a discrete
evidence-support score $s(c_i, b_j) \in \{-2,-1,0,+1,+2\}$ ranging from
*contradicted* to *fully supported*.

**Score Formulation.** Because each claim is evaluated against multiple
candidates, we aggregate scores using a relevance-weighted top-3 policy
($\mathcal{T}_i$) rather than maximum pooling. This choice mitigates
optimistic inflation from a single spuriously favorable match and better
preserves the evidence ranking induced by retrieval. Let $r_j$ denote
the retrieval relevance of candidate $b_j$; the per-claim score is
$S_{\mathrm{claim}}(c_i) = \frac{\sum_{j \in \mathcal{T}_i} s(c_i,b_j)\,r_j}
                                    {\sum_{j \in \mathcal{T}_i} r_j}.$
At the review level, we compute the mean claim score
$\bar{S} = \frac{1}{n}\sum_{i=1}^{n}S_{\mathrm{claim}}(c_i)$ and derive
three normalized metrics--- $NS(R) = \frac{\bar{S}+2}{4}, \quad
    SR(R)  = \frac{|\{c_i : S_{\mathrm{claim}}(c_i) \ge 1\}|}{n}, \quad
    SSR(R) = \frac{|\{c_i : S_{\mathrm{claim}}(c_i) = 2\}|}{n},$ where
$NS \in [0,1]$ is the overall normalized score, $SR$ and $SSR$ measure
the fraction of claims with partial and strict literature support,
respectively. Together, these metrics distinguish well-grounded
critiques from partial matches or unsupported hallucinations.

## Flaw Identification & Major Issues Prioritization 

Effective peer review requires both accurate diagnosis of scientific
errors and clear structural organization. We define *Flaw
Identification* as the ability to detect genuine methodological
weaknesses in a manuscript while filtering minor surface-level issues.
Because the absolute number of flaws in any manuscript is unobservable,
we establish a relative \"ground truth\" using a consensus mechanism
that merges findings from both verified human and LLM reviewers.
Furthermore, since authors prioritize issues encountered early in a
reviewing text [@NDCG], we treat the burial of critical flaws beneath
trivial formatting complaints as a significant failure in review
quality.

**Pipeline.** The pipeline proceeds in two stages. ***Extraction***: we
isolate the critical review sections (Summary, Weaknesses, Questions)
from both the human and LLM reviews; an LLM parses them concurrently to
extract distinct flaw arguments---specific criticisms regarding the
manuscript. ***Consensus Verification***: grounded in the actual paper
context, an LLM judge evaluates all extracted flaws, discarding invalid
or hallucinated critiques; verified findings from both reviewer types
are merged into a consensus ground truth and classified by severity into
*Critical* (e.g., methodological errors, flawed proofs) or *Minor*
(e.g., typos, formatting issues). ***Positional Recovery***: valid flaws
are mapped back to their original sequential position within the review
text, forming the ranked ordering used to compute the prioritization
score.

**Score Formulation.** We represent the consensus sets of Critical and
Minor flaws as $F_{\mathrm{true}}^{C}$ and $F_{\mathrm{true}}^{M}$,
respectively. The subsets of these valid flaws successfully identified
by the reviewer under evaluation are denoted as $F_{\mathrm{rev}}^{C}$
and $F_{\mathrm{rev}}^{M}$. **Diagnostic coverage** is measured by
severity-stratified recall:
$\text{Critical/Minor Recall} = \frac{|F_{\mathrm{true}}^{C/M} \cap F_{\mathrm{rev}}^{C/M}|}
                                   {|F_{\mathrm{true}}^{C/M}|}. 
                                   % \qquad
    % \text{Minor Recall}    = \frac{|F_{\mathrm{true}}^M \cap F_{\mathrm{rev}}^M|}
                                   % {|F_{\mathrm{true}}^M|}$
**Structural ranking** quality is measured by the normalized Critique
Prioritization Score ($nCPS$), inspired by NDCG [@NDCG]. We assign
severity weights $w_i \in \{2,1\}$ for Critical/Minor flaws and let
$p_i$ be the position of the $i$-th valid flaw in the review:
$nCPS = \frac{CPS}{iCPS}, 
      CPS = \sum_{i=1}^{k} \frac{w_i}{\log_2(p_i + 1)},$ where $iCPS$ is
the ideal score (all Critical flaws preceding Minor), so an $nCPS$
approaches 1 indicates optimal prioritization.

## Multi-Dimensional Constructiveness {#subsec:mcs}

While identifying flaws is essential, a review's real value lies in its
ability to help authors improve. To measure this, we introduce the
*Multi-Dimensional Constructiveness* metric, which quantifies the
helpfulness of feedback. Grounded in discourse taxonomies like
DISAPERE [@kennard-etal-2022-disapere], our framework systematically
decomposes constructiveness into informational and social dimensions.

**Pipeline.** An LLM judge first breaks the review into Atomic Review
Comments (ARCs), the smallest independent units of critique or
suggestion. Each ARC ($c_j$) is then rated on a scale from 0 to 2 across
five dimensions: **Actionability ($D_1$):** does the comment provide
clear, implementable guidance rather than vague opinions?; **Specificity
($D_2$):** does it pinpoint concrete elements, such as specific sections
or equations?; **Justification ($D_3$):** are assertions backed by
logical reasoning or empirical evidence?; **Solution ($D_4$):** does the
reviewer propose a path for improvement instead of just highlighting a
problem?; **Tone ($D_5$):** is the language professional and
encouraging? This dimension penalizes hostility, which can demoralize
authors without improving scientific
quality [@hyland2020antithetical; @rao2022civility].

**Score Formulation.** For a review $R$ with $n$ ARCs
$\{c_1,\ldots,c_n\}$, the Comment-Level Constructiveness
$CLC(c_j) = \frac{1}{10}\sum_{k=1}^{5} D_k(c_j) \in [0,1]$ normalizes
the five dimension scores, and the Mean Constructiveness Score
$MCS(R) = \frac{1}{n}\sum_{j=1}^{n} CLC(c_j)$ averages over all
comments. This formulation ensures that to achieve a perfect $MCS$ of
$1.0$, a reviewer must consistently deliver specific, well-justified,
actionable and professionally toned feedback across all constituent
comments.

# Experiment and analysis {#sec:experiment}

## Evaluation Setting

::: minipage
[]{#tab:data_selection_stats label="tab:data_selection_stats"}
:::

::: minipage
![image](./images/keyword_cloud.pdf){width="\\linewidth"}
[]{#fig:keyword_cloud label="fig:keyword_cloud"}
:::

**Dataset selection.** PRISM is evaluated on 200 manuscripts per
venue-year across five conference splits---**ICLR 2024**, **ICLR 2025**,
**ICLR 2026**, **ICML 2025**, and **NeurIPS 2025**
(Table [\[tab:data_selection_stats\]](#tab:data_selection_stats){reference-type="ref"
reference="tab:data_selection_stats"})---stratified by decision category
(*Reject*, *Poster*, *Spotlight*, *Oral*) and topic
(Figure [\[fig:keyword_cloud\]](#fig:keyword_cloud){reference-type="ref"
reference="fig:keyword_cloud"}). Sampling preserves each venue's
original score distribution, ensuring the benchmark reflects natural
acceptance dynamics while remaining tractable for end-to-end
multi-system evaluation.

**Reviewer baselines and implementations.** We evaluate five automated
reviewer systems spanning two paradigms--*supervised fine-tuning*
(SEA-E [@yu-etal-2024-automated-SEA], CycleReviewer [@cyclereviewer],
DeepReview [@zhu-etal-2025-deepreview]) and *prompting-based*
(Reviewer2 [@gao2024reviewer2optimizingreviewgeneration],
TreeReview [@chang-etal-2025-treereview])---and human reviewers; see
Appendix [\[sec:app_baseline\]](#sec:app_baseline){reference-type="ref"
reference="sec:app_baseline"} for configuration details.

**LLM-as-a-Judge implementation.** We adopt the LLM-as-a-Judge paradigm,
using Gemini 2.5 Flash Lite [@gemini2025team] as our evaluation engine
for all metric extraction and scoring tasks. Full configuration details
and prompt templates are in
Appendix [\[sec:app_prism\]](#sec:app_prism){reference-type="ref"
reference="sec:app_prism"}.

## Result Analysis: LLMs vs Human-Reviewer Baselines

Table [\[tab:main_results\]](#tab:main_results){reference-type="ref"
reference="tab:main_results"} reports macro-averaged PRISM scores for
five LLM reviewer systems and the human baseline across all four
dimensions; the following subsections unpack each in turn. Extended
quantitative breakdowns appear in
Appendices [\[sec:app_exp1\]](#sec:app_exp1){reference-type="ref"
reference="sec:app_exp1"}--[\[app:app_exp2\]](#app:app_exp2){reference-type="ref"
reference="app:app_exp2"} and qualitative examples in
Appendix [\[app:app_exp3\]](#app:app_exp3){reference-type="ref"
reference="app:app_exp3"}.

### Depth of Analysis {#sec:exp_doa}

::: minipage
[]{#tab:doa_core label="tab:doa_core"}
:::

::: minipage
![image](./images/doa_heatmap_all.pdf){width="\\linewidth"}
[]{#fig:doa_aspect label="fig:doa_aspect"}
:::

Table [\[tab:main_results\]](#tab:main_results){reference-type="ref"
reference="tab:main_results"} summarizes the macro-averaged DoA
performance across all venues. The human ground-truth establishes the
benchmark with the highest overall DoA score ($0.494$). Among the
automated systems, **DeepReview** ($0.483$) and **CycleReviewer**
($0.484$) closely match the human standard. Their good performance is
primarily driven by a robust *Premise Ratio* ($\approx 0.60$), meaning
they consistently substantiate their claims, successfully compensating
for the slight gap in absolute Grounding scores.

Table [\[tab:doa_core\]](#tab:doa_core){reference-type="ref"
reference="tab:doa_core"} reveals that while Grounding scores remain
consistent across humans and LLMs ($0.431$--$0.475$), the DoA disparity
is primarily driven by the Premise Ratio. While baselines like
TreeReview fall short, CycleReviewer ($0.614$) and DeepReview ($0.596$)
successfully close the gap by matching or exceeding the human baseline
($0.567$) in consistently substantiating their claims. Furthermore,
aspect distributions (Figure
[\[fig:doa_aspect\]](#fig:doa_aspect){reference-type="ref"
reference="fig:doa_aspect"}) show that cognitive alignment is heavily
architecture-dependent. Advanced pipelines (DeepReview, CycleReviewer,
Reviewer2, SEA) mirror human intuitive focus by dedicating the vast
majority of their grounded premises to Methodology and Experimental
Design, while keeping *Clarity* strictly proportional to human levels
($\sim 7-12\%$, detailed in the Appendix
[\[sec:detail_doa\]](#sec:detail_doa){reference-type="ref"
reference="sec:detail_doa"}). By contrast, TreeReview disproportionately
squanders $\sim 24\%$ of its overall effort on formatting issues at the
expense of methodological rigor---a degradation in evaluative depth
recently observed in in-the-wild LLM peer reviews [@llmsurfacebias].
With these results, the "surface-level trap" is thus not an inherent LLM
flaw, but rather an artifact of reasoning frameworks that lack explicit,
domain-specific constraints.

***Key Insight:** Human reviewers's analytical depth has both a high
Premise Ratio and cognitive alignment that prioritizes core methodology
over surface-level formatting. To perform comparably to human reviewers,
the best-performing LLMs primarily rely on generating highly robust
premises, effectively using structural completeness to compensate for
their slight gaps in empirical grounding.*

### Novelty Assessment

In contrast to the human-dominated Depth of Analysis, Novelty Assessment
yields uniformly high evidence-grounding scores across automated
baselines. As shown in
Table [\[tab:main_results\]](#tab:main_results){reference-type="ref"
reference="tab:main_results"}, all automated systems operate within the
$0.750$ to $0.830$ range, meaning that many of their extracted novelty
claims can be matched to supportive prior-work evidence under the PRISM
retrieval-and-verification pipeline. Importantly, this metric does not
certify the manuscript's objective novelty or full human-level
agreement; it measures how well the claims a reviewer chose to make are
grounded in retrieved literature. Accordingly, a review can score highly
on Novelty Assessment while still differing from human reviewers in
claim selection, evidence choice, or calibration. Within this
evidence-grounding perspective, **SEA** achieves the highest
macro-average score of $\mathbf{0.833}$, slightly above the human
baseline ($0.787$), suggesting that structured prompting helps models
articulate novelty claims that are retrievably justifiable.

Figure [\[fig:novelty_a\]](#fig:novelty_a){reference-type="ref"
reference="fig:novelty_a"} reveals that review systems diverge
considerably in their novelty stance. SEA endorses novelty in 79% of
claims---far above the human rate of 59%---reflecting a tendency to
agree with authors rather than scrutinize their contributions. In
contrast, DeepReview adopts the most skeptical lens (39% *Novel*, 33%
*Not novel*), suggesting its multi-step reasoning positively searches
for counter-evidence. In parallel,
Figure [\[fig:novelty_b\]](#fig:novelty_b){reference-type="ref"
reference="fig:novelty_b"} exposes a consistent cross-reviewer pattern:
claims labeled *Not novel* or *Somewhat novel* attract markedly stronger
literature groundings, compared with *Novel* claims. This aligns well
with a natural reviewing dynamic---*a reviewer who challenges authors'
novelty statements would cite prior works to substantiate that critique,
whereas agreements would require little external justification*.
Importantly, the pattern holds consistently across reviewer pipelines
and human, confirming it is an intrinsic property of the reviewing task
itself, rather than an LLM artifact.

::: minipage
![image](./images/novelty_detailed_analysis_a.pdf){width="\\linewidth"}
[]{#fig:novelty_a label="fig:novelty_a"}
:::

::: minipage
![image](./images/novelty_detailed_analysis_b.pdf){width="\\linewidth"}
[]{#fig:novelty_b label="fig:novelty_b"}
:::

***Key Insight:** While automated reviewers back their novelty claims
with solid evidence, this reflects a tendency to select easily
verifiable claims rather than true human-level judgment. Additionally,
both models and humans follow a natural reviewing pattern: negative
novelty judgments are consistently backed by much stronger evidence than
positive ones.*

### Flaw Identification & Major Issues Prioritization

::: minipage
![image](./images/flaw_diverging.pdf){width="\\linewidth"}
[]{#fig:comparison_flaws label="fig:comparison_flaws"}
:::

::: minipage
![image](./images/constructiveness_parallel.pdf){width="\\linewidth"}
[]{#fig:constructiveness_detailed label="fig:constructiveness_detailed"}
:::

Table [\[tab:main_results\]](#tab:main_results){reference-type="ref"
reference="tab:main_results"} reveals distinct specialization profiles
in diagnostic precision. **Reviewer2** stands out as an exhaustive flaw
scanner, achieving the highest recall for both Critical
($\mathbf{0.591}$) and Minor ($\mathbf{0.459}$) issues---substantially
exceeding the human baseline ($0.343$ and $0.281$, respectively). This
suggests that structured LLM pipelines can systematically surface
vulnerabilities that time-constrained human reviewers may overlook. By
contrast, **DeepReview** and the Human baseline maintain more
conservative, targeted diagnostic patterns, trading raw recall for
precision.

Figure [\[fig:comparison_flaws\]](#fig:comparison_flaws){reference-type="ref"
reference="fig:comparison_flaws"} contextualizes raw recall by
decomposing extracted flaws into valid and hallucinated counts.
Reviewer2 recovers an exceptionally high volume of valid flaws at a low
hallucination rate (${\sim}3.3\%$), while CycleReviewer's high
hallucination rate (${\sim}18.5\%$) signals a fundamental precision
deficit. Critically, hallucinations are strictly confined to minor
issues across every system: no reviewer---human or LLM---fabricates a
fatal methodological breakdown, ensuring that Critical flaw flags remain
factually grounded. Complementary aspect-level analysis
(Appendix [\[sec:detailed_flaw_analysis\]](#sec:detailed_flaw_analysis){reference-type="ref"
reference="sec:detailed_flaw_analysis"}) further shows that both LLMs
and humans dynamically adapt their diagnostic focus by severity ---
concentrating on core methodology for Critical flaws while shifting
toward presentation and clarity for Minor anomalies.

Notably, all systems---including humans---achieve near-identical nCPS
scores ($\approx 0.97$), suggesting that prioritization of critical over
minor flaws may reflect a near-universal baseline behavior rather than a
discriminating capability at current performance levels.

***Key Insight:** Certain LLMs act as high-sensitivity scanners,
catching more critical flaws than human reviewers. However, structuring
a review by severity (putting critical issues first) is a standard
behavior across all evaluated systems and humans, not a unique advantage
of any single model.*

### Multi-dimensional Constructiveness {#multi-dimensional-constructiveness}

The Multi-Dimensional Constructiveness Score evaluation reveals that
LLMs can emulate, and in some cases exceed, the professional and
supportive tone expected in academic peer review. While human reviewers
establish a solid constructiveness baseline of $0.566$, **DeepReview**
significantly outperforms both human reviewers and other LLMs, achieving
the highest score of $\mathbf{0.634}$. This suggests that DeepReview's
multi-stage reasoning pipeline is exceptionally effective at not only
identifying weaknesses but also formulating specific, actionable and
professionally communicated suggestions for author improvement.

Figure [\[fig:constructiveness_detailed\]](#fig:constructiveness_detailed){reference-type="ref"
reference="fig:constructiveness_detailed"} and
Appendix [\[sec:detailed_constructiveness\]](#sec:detailed_constructiveness){reference-type="ref"
reference="sec:detailed_constructiveness"} decompose constructiveness
into five dimensions (D1--D5), where each score reflects the *per-ARC
average* across all atomic comments---not a binary presence indicator; a
lower score means lower *density* of that attribute, not its absence.
The results reveal an intriguing divergence. Both humans ($1.725$) and
**CycleReviewer** ($1.897$) excel at *Specificity* (D2), yet human
reviewers show a surprising shortfall in *Solution* provision
(D4 = $0.470$)---they identify problems but rarely propose fixes.
**DeepReview** fills this gap most convincingly, leading on both
*Actionability* (D1 = $1.414$) and *Solution* (D4 = $0.784$): it does
not merely flag issues but formulates explicit, implementable
improvements. **Reviewer2**'s elevated *Justification* score
(D3 = $0.939$) may partly reflect its verbose style rather than genuine
reasoning depth, as its low *Solution* rate (D4 = $0.266$) leaves
critiques largely unactionable. On *Tone* (D5), LLMs generally stay
neutral-to-encouraging; DeepReview ($1.726$) is the most professional,
avoiding the dismissive register of some humans.

***Key Insight:**Helpful feedback does not emerge automatically from
LLMs; it requires specific system design. Purpose-built pipelines (like
DeepReview) go beyond simply pointing out errors to offer actionable,
professional solutions---a level of constructive feedback that standard
models and even human reviewers rarely provide.*

# Conclusion & Future Work {#sec:conclusion}

PRISM demonstrates that LLM peer reviewers are specialized tools rather
than general-purpose replacements for human expertise. Each system
excels in a specific niche but exhibits distinct blind spots across
other dimensions.

#### Actionable deployment recommendations.

Since no single system dominates all four dimensions, we recommend a
targeted ensemble deployment rather than a standalone approach: use
**Reviewer2** for exhaustive flaw scanning (highest diagnostic recall);
use **DeepReview** for constructive feedback drafting (highest
actionability and solution density); use **SEA** for novelty-grounding
checks (highest literature support rate). Ultimately, these systems are
most effective as specialist co-pilots within a human-assisted pipeline
rather than autonomous reviewers.

#### Limitations.

Our primary evaluation pipeline relies on `Gemini 2.5 Flash Lite` as the
core judge model. While we conducted preliminary robustness checks using
an alternative model (Xiaomi `MiMo V2.5 Pro` [@mimo2026v25pro]) on a
subset of the data to verify metric stability (See
Appendix [\[app:app_exp2\]](#app:app_exp2){reference-type="ref"
reference="app:app_exp2"}), a comprehensive multi-judge study across
diverse LLM families remains necessary to fully eliminate judge-specific
biases. Furthermore, the benchmark corpus covers ML/AI venues only, and
PRISM may require recalibration for other scientific domains. Full
limitation details are in
Appendix [\[sec:app_limitation\]](#sec:app_limitation){reference-type="ref"
reference="sec:app_limitation"}.

#### Future work.

We identify three priority directions: (1) *Cross-domain
generalization*---recalibrating PRISM for clinical medicine, social
sciences, and pure mathematics. (2) *Judge robustness*---systematic
study of inter-judge agreement across LLM judge families and human
raters. (3) *Human validation*---correlating PRISM scores with
post-review author satisfaction or acceptance decision outcomes to
confirm that the metrics capture meaningful review quality.
