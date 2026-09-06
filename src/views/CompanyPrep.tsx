import React, { useMemo, useState } from 'react';
import rawCompanyData from '../data/companies.json';
import { useTracker } from '../hooks/useTracker';
import { useGuest } from '../context/GuestContext';
import { Card } from '../components/ui/Card';
import { Checkbox } from '../components/ui/Checkbox';
import { ComingSoon } from '../components/ui/ComingSoon';
import { ArrowLeft, ExternalLink, Link2Off, ClipboardList, Layers, BarChart2, Target, FileText } from 'lucide-react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Question {
  id: string;
  title: string;
  link: string;
  type: string;
  year: string;
  topic: string;
  difficulty: Difficulty;
}
interface OaFormatItem {
  label: string;
  value: string;
}
// Interview-process summary. Populated later from `src/data/companies_formats.xlsx`;
// until then every field falls back to placeholder copy.
interface CompanyFormat {
  oaFormat?: string;
  numInterviews?: string;
  interviewFormats?: string;
}
interface Company {
  id: string;
  name: string;
  questions: Question[];
  oaFormat: OaFormatItem[];
  formats?: CompanyFormat;
}

const FORMAT_PLACEHOLDER: Required<CompanyFormat> = {
  oaFormat: 'Placeholder — online-assessment structure (platform, duration, sections) will be added from companies_formats.xlsx.',
  numInterviews: 'Placeholder — number of interview rounds will be added from companies_formats.xlsx.',
  interviewFormats: 'Placeholder — round-by-round format (DSA, system design, CS fundamentals, HR) will be added from companies_formats.xlsx.',
};

const companyData = rawCompanyData as unknown as Company[];

// CSEA placement portal — real, first-hand placement experiences live here.
const CSEA_PLACEMENT_URL = 'https://placement.cseaceg.org.in/';

// ─── Feature flags ──────────────────────────────────────────────────────────
// Set to `true` to hide the section behind a "Coming Soon" screen.
const COMING_SOON = false;
// Set to `false` to hide the "Interview Process" card on a company's detail page.
const SHOW_INTERVIEW_PROCESS = false;
// ────────────────────────────────────────────────────────────────────────────

// Brand domains used to fetch each company's logo. Keyed by the company `id`
// in `companies.json` (generated from `src/data/company_wise_sheet.xlsx`).
const COMPANY_DOMAINS: Record<string, string> = {
  accenture: 'accenture.com',
  accolite: 'accolite.com',
  alstom: 'alstom.com',
  amazon: 'amazon.com',
  'american-express': 'americanexpress.com',
  appian: 'appian.com',
  apple: 'apple.com',
  aptiv: 'aptiv.com',
  arcesium: 'arcesium.com',
  'arista-networks': 'arista.com',
  'aspire-systems': 'aspiresys.com',
  'athena-health': 'athenahealth.com',
  'bank-of-america': 'bankofamerica.com',
  barclays: 'barclays.com',
  'baton-systems': 'batonsystems.com',
  bny: 'bny.com',
  checktronix: 'checktronix.com',
  chronus: 'chronus.com',
  citi: 'citi.com',
  'de-shaw': 'deshaw.com',
  deloitte: 'deloitte.com',
  dover: 'dovercorporation.com',
  enphase: 'enphase.com',
  eucloid: 'eucloid.com',
  fidelity: 'fidelity.com',
  'gen-digital': 'gendigital.com',
  'global-analytics': 'globalanalytics.com',
  'goldman-sachs': 'goldmansachs.com',
  hsbc: 'hsbc.com',
  hubstream: 'hubstream.com',
  'idfc-first-bank': 'idfcfirstbank.com',
  'infibeam-avenues': 'infibeamav.com',
  infinera: 'infinera.com',
  khoros: 'khoros.com',
  kla: 'kla.com',
  'loadshare-networks': 'loadshare.net',
  ltimindtree: 'ltimindtree.com',
  mathworks: 'mathworks.com',
  micron: 'micron.com',
  microsoft: 'microsoft.com',
  'morgan-stanley': 'morganstanley.com',
  natwest: 'natwestgroup.com',
  'ncr-voyix': 'ncrvoyix.com',
  nokia: 'nokia.com',
  nvidia: 'nvidia.com',
  optum: 'optum.com',
  oracle: 'oracle.com',
  q2: 'q2.com',
  quantiphi: 'quantiphi.com',
  'ramco-systems': 'ramco.com',
  rtbrick: 'rtbrick.com',
  'samsung-rd': 'samsung.com',
  'sap-labs': 'sap.com',
  'software-ag': 'softwareag.com',
  tekion: 'tekion.com',
  trimble: 'trimble.com',
  vegrow: 'vegrow.in',
  verizon: 'verizon.com',
  'versa-networks': 'versa-networks.com',
  visa: 'visa.com',
  'vivriti-capital': 'vivriticapital.com',
  walmart: 'walmart.com',
  'wells-fargo': 'wellsfargo.com',
  'western-digital': 'westerndigital.com',
  wex: 'wexinc.com',
  wipro: 'wipro.com',
  zoho: 'zoho.com',
};

// Renders the real company logo on a white tile, falling back to the
// company initial if the logo can't be loaded.
const CompanyLogo: React.FC<{ companyId: string; name: string; size?: 'sm' | 'lg' }> = ({
  companyId,
  name,
  size = 'sm',
}) => {
  const [failed, setFailed] = useState(false);
  const domain = COMPANY_DOMAINS[companyId];
  const dim = size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
  const imgDim = size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';

  if (failed || !domain) {
    return (
      <div className={`${dim} rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center`}>
        <span className="font-semibold text-zinc-200 text-sm tracking-tight">{name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <div className={`${dim} rounded-xl bg-white border border-black/10 flex items-center justify-center overflow-hidden`}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
        alt={`${name} logo`}
        className={`${imgDim} object-contain`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

// Badge colour by question type (OA vs Interview).
const typeStyles = (type: string) =>
  type === 'OA'
    ? 'text-amber-400 bg-amber-400/10 border-amber-500/20'
    : 'text-blue-400 bg-blue-400/10 border-blue-500/20';

// Difficulty palette — matches DsaSheetTable / DashboardStats.
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const diffBadge: Record<Difficulty, string> = {
  Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20',
  Medium: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
  Hard: 'text-rose-400 bg-rose-400/10 border-rose-500/20',
};
// Circular-chart colours — same guide as the dashboard's CompletionDonut.
const diffHex: Record<Difficulty, string> = {
  Easy: '#22c55e',
  Medium: '#eab308',
  Hard: '#ef4444',
};
const DONUT_SIZE = 140;
const DONUT_STROKE = 14;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRC = 2 * Math.PI * DONUT_RADIUS;
const DONUT_CENTER = DONUT_SIZE / 2;

// ─── Company detail page ─────────────────────────────────────────────────────
const CompanyDetailPage: React.FC<{
  company: Company;
  onBack: () => void;
}> = ({ company, onBack }) => {
  const { isSolved, toggleProblem } = useTracker();
  const { isGuest, promptSignIn } = useGuest();

  const questions = company.questions as Question[];
  const solvedCount = questions.filter((q) => isSolved(q.id)).length;
  const progressPct = questions.length ? Math.round((solvedCount / questions.length) * 100) : 0;
  const formats = { ...FORMAT_PLACEHOLDER, ...(company.formats ?? {}) };

  // Difficulty split + topic distribution across this company's questions only.
  const diffCounts = useMemo(() => {
    const counts: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
    questions.forEach((q) => { counts[q.difficulty] = (counts[q.difficulty] ?? 0) + 1; });
    return counts;
  }, [questions]);

  // Solved-per-difficulty for this company (drives the circular chart arcs).
  const solvedByDiff: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
  questions.forEach((q) => { if (isSolved(q.id)) solvedByDiff[q.difficulty]++; });

  // Pre-compute one arc per difficulty. Each arc's length is that difficulty's
  // solved share of ALL the company's questions, so the coloured ring equals
  // overall completion (same approach as the dashboard's CompletionDonut).
  const donutArcs = DIFFICULTIES.reduce<{ items: { d: Difficulty; dash: number; rotation: number }[]; acc: number }>(
    (state, d) => {
      const fraction = questions.length ? solvedByDiff[d] / questions.length : 0;
      state.items.push({ d, dash: fraction * DONUT_CIRC, rotation: -90 + state.acc * 360 });
      state.acc += fraction;
      return state;
    },
    { items: [], acc: 0 },
  ).items.filter((a) => a.dash > 0);

  const topicCounts = useMemo(() => {
    const map = new Map<string, number>();
    questions.forEach((q) => map.set(q.topic, (map.get(q.topic) ?? 0) + 1));
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [questions]);
  const maxTopicCount = topicCounts[0]?.count ?? 1;

  return (
  <div className="space-y-8 animate-fade-in-up">
    {/* Header */}
    <div className="flex items-center gap-4">
      <button
        onClick={onBack}
        className="p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center justify-center cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-3">
        <CompanyLogo companyId={company.id} name={company.name} size="lg" />
        <div>
          <span className="text-xs font-medium text-zinc-500">Companies</span>
          <h2 className="text-xl font-semibold text-zinc-100">{company.name}</h2>
        </div>
      </div>
    </div>

    {/* ── Interview process ────────────────────────────────── */}
    {/* Placeholder copy until `src/data/companies_formats.xlsx` is wired up. */}
    {SHOW_INTERVIEW_PROCESS && (
      <div className="glass-panel p-6 rounded-xl border border-zinc-800/80">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-zinc-200 text-base">Interview Process</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            ['OA Format', formats.oaFormat],
            ['Number of Interviews', formats.numInterviews],
            ['Interview Formats', formats.interviewFormats],
          ] as const).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
              <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{value}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* ── Progress + topics ────────────────────────────────── */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Your progress — circular chart + per-difficulty completion */}
      <div className="glass-panel p-6 rounded-xl border border-zinc-800/80">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-zinc-200 text-base">Your Progress</h3>
        </div>

        <div className="flex flex-col items-center">
          <div
            className="relative flex items-center justify-center"
            style={{ width: DONUT_SIZE, height: DONUT_SIZE }}
          >
            <svg width={DONUT_SIZE} height={DONUT_SIZE}>
              {/* Track */}
              <circle
                className="text-zinc-800"
                stroke="currentColor"
                fill="transparent"
                strokeWidth={DONUT_STROKE}
                r={DONUT_RADIUS}
                cx={DONUT_CENTER}
                cy={DONUT_CENTER}
              />
              {/* Solved arcs, one per difficulty (see donutArcs above). */}
              {donutArcs.map(({ d, dash, rotation }) => (
                <circle
                  key={d}
                  stroke={diffHex[d]}
                  fill="transparent"
                  strokeWidth={DONUT_STROKE}
                  strokeDasharray={`${dash} ${DONUT_CIRC - dash}`}
                  strokeLinecap="butt"
                  r={DONUT_RADIUS}
                  cx={DONUT_CENTER}
                  cy={DONUT_CENTER}
                  transform={`rotate(${rotation} ${DONUT_CENTER} ${DONUT_CENTER})`}
                  className="transition-all duration-500 ease-out"
                />
              ))}
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-zinc-100 font-mono leading-none">{progressPct}%</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mt-1">Solved</span>
            </div>
          </div>

          {/* Completed per difficulty, out of that difficulty's total. */}
          <div className="w-full mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
              <span className="text-zinc-400 font-semibold">Total</span>
              <span className="font-mono text-zinc-200">
                {solvedCount}<span className="text-zinc-500"> / {questions.length}</span>
              </span>
            </div>
            {DIFFICULTIES.map((d) => (
              <div key={d} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: diffHex[d] }} />
                  {d}
                </span>
                <span className="font-mono text-zinc-300">
                  {solvedByDiff[d]}<span className="text-zinc-500"> / {diffCounts[d]}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topics asked */}
      <div className="glass-panel p-6 rounded-xl border border-zinc-800/80">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-zinc-200 text-base">Topics Asked</h3>
        </div>
        {topicCounts.length === 0 ? (
          <p className="text-sm text-zinc-500">No topic data.</p>
        ) : (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {topicCounts.map((t) => (
              <div key={t.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400 truncate pr-2" title={t.name}>{t.name}</span>
                  <span className="text-zinc-400 font-mono shrink-0">{t.count}</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500/80 rounded-full transition-all duration-500"
                    style={{ width: `${(t.count / maxTopicCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* ── OA & Interview Format ────────────────────────────── */}
    {company.oaFormat.length > 0 && (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Layers className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">OA &amp; Interview Format</h3>
            <p className="text-xs text-zinc-500">Rounds, platform and process for {company.name}.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {company.oaFormat.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{item.label}</p>
              <p className="text-sm font-medium text-zinc-200 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* ── Questions asked ──────────────────────────────────── */}
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-zinc-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-100">Questions Asked</h3>
          <p className="text-xs text-zinc-500">
            Check off the ones you&apos;ve solved — progress is tracked per company.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {questions.map((q) => {
          const solved = isSolved(q.id);
          const hasLink = Boolean(q.link);
          const rowInner = (
            <>
              <span
                className={`flex-1 min-w-0 text-sm font-medium ${
                  solved
                    ? 'text-zinc-500 line-through decoration-zinc-600'
                    : 'text-zinc-200 group-hover:text-zinc-100'
                }`}
              >
                {q.title}
              </span>
              {/* Fixed-width cells so the tags line up in columns across every row. */}
              <span className="shrink-0 w-[68px] text-center">
                <span className={`inline-block w-full px-2 py-0.5 text-[10px] font-bold rounded-md border ${diffBadge[q.difficulty]}`}>
                  {q.difficulty}
                </span>
              </span>
              <span className="hidden lg:block shrink-0 w-28 truncate text-right text-[10px] font-medium text-zinc-500" title={q.topic}>
                {q.topic}
              </span>
              <span className="shrink-0 w-[76px] text-center">
                <span className={`inline-block w-full px-2 py-0.5 text-[10px] font-bold rounded-md border ${typeStyles(q.type)}`}>
                  {q.type}
                </span>
              </span>
              <span className="shrink-0 w-9 text-right text-[10px] font-mono font-bold text-zinc-500">{q.year}</span>
              {hasLink ? (
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-zinc-500 group-hover:text-blue-400 transition-colors" />
              ) : (
                <span
                  className="shrink-0 flex items-center"
                  title="Exact leetcode/GfG match not present"
                >
                  <Link2Off className="w-3.5 h-3.5 text-rose-500" />
                </span>
              )}
            </>
          );
          return (
            <div
              key={q.id}
              className="group flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:border-blue-500/40 hover:bg-zinc-900/70 transition-colors px-4 py-3"
            >
              <Checkbox
                checked={solved}
                id={`chk-${q.id}`}
                onChange={() => {
                  if (isGuest) {
                    promptSignIn();
                    return;
                  }
                  toggleProblem({
                    problemId: q.id,
                    title: q.title,
                    topic: q.topic,
                    difficulty: q.difficulty,
                    platform: '',
                  });
                }}
              />
              {hasLink ? (
                <a
                  href={q.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center gap-3 min-w-0"
                >
                  {rowInner}
                </a>
              ) : (
                <div className="flex flex-1 items-center gap-3 min-w-0">{rowInner}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>

  </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────
export const CompanyPrep: React.FC = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // ── Coming Soon screen ────────────────────────────────────────────────────
  if (COMING_SOON) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Companies</h2>
          <p className="text-sm text-zinc-500 mt-1">Company-specific OA & interview questions shared by students.</p>
        </div>
        <ComingSoon message="Company-specific questions are being set up. Check back soon!" />
      </div>
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

  const selectedCompany = companyData.find((c) => c.id === selectedCompanyId);

  if (selectedCompany) {
    return (
      <CompanyDetailPage
        company={selectedCompany}
        onBack={() => setSelectedCompanyId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Companies</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Company-specific OA &amp; interview questions shared by students.
        </p>
      </div>

      {/* Provenance — where this question bank comes from */}
      <p className="text-sm text-zinc-400">
        All questions were asked in OAs and interviews at Anna University, extracted from the{' '}
        <a
          href={CSEA_PLACEMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-400 underline decoration-blue-400/40 underline-offset-2 hover:text-blue-300"
        >
          CSEA Placement Portal
        </a>
        .
      </p>

      {/* CSEA placement portal banner — full placement experiences live here */}
      <a
        href={CSEA_PLACEMENT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-blue-500/50 bg-gradient-to-r from-blue-600/25 via-indigo-600/20 to-blue-600/25 px-5 py-4 shadow-lg shadow-blue-900/20 ring-1 ring-inset ring-white/5 transition-all hover:border-blue-400/70 hover:from-blue-600/35 hover:via-indigo-600/30 hover:to-blue-600/35"
      >
        <div className="w-12 h-12 shrink-0 rounded-xl bg-white border border-black/10 flex items-center justify-center overflow-hidden shadow-md">
          <img
            src="https://www.google.com/s2/favicons?domain=placement.cseaceg.org.in&sz=128"
            alt="CSEA logo"
            className="w-8 h-8 object-contain"
            loading="lazy"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white">CSEA Placement Portal</p>
            <span className="rounded-full bg-blue-500/30 border border-blue-400/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-100">
              Experiences
            </span>
          </div>
          <p className="text-xs text-blue-100/80 mt-0.5">
            Read full first-hand placement &amp; interview experiences on the CSEA portal.
          </p>
        </div>
        <span className="flex items-center gap-1.5 shrink-0 rounded-lg bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-blue-400">
          Visit <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </a>

      {/* Grid of company cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companyData.map((company) => (
          <Card
            key={company.id}
            onClick={() => setSelectedCompanyId(company.id)}
            className="flex flex-col justify-between group h-full cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <CompanyLogo companyId={company.id} name={company.name} />
                <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-tight bg-blue-500/15 border border-blue-500/20 px-2 py-0.5 rounded-md">
                  {company.questions.length} question{company.questions.length !== 1 ? 's' : ''}
                </span>
              </div>

              <h3 className="text-base font-semibold text-zinc-100 mb-2">{company.name}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                OA &amp; interview questions from students who interviewed at {company.name}.
              </p>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800 text-xs font-medium">
              <span className="text-zinc-500">Questions &amp; experiences</span>
              <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">View &rarr;</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
