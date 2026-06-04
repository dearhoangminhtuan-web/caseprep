-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────

create type case_type as enum (
  'profitability',
  'market_entry',
  'market_sizing',
  'ma',
  'operations'
);

create type difficulty as enum ('easy', 'medium', 'professional');

create type quiz_mode as enum ('math', 'framework', 'fact');

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  lang_pref       text not null default 'en' check (lang_pref in ('en', 'ja')),
  total_xp        integer not null default 0,
  level           smallint not null default 1,
  streak          integer not null default 0,
  last_active_date date,
  created_at      timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────
-- CASES
-- ─────────────────────────────────────────

create table cases (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  type            case_type not null,
  difficulty      difficulty not null,
  source_label    text not null default 'Original'
                    check (source_label in ('Original', 'AI-generated', 'Adapted')),
  source_url      text,
  title_en        text not null,
  title_ja        text,
  summary_en      text not null,
  summary_ja      text,
  steps_en        jsonb not null default '{}',
  steps_ja        jsonb,
  xp_value        integer not null default 30,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table cases enable row level security;

create policy "Anyone can read published cases"
  on cases for select using (is_published = true);

-- ─────────────────────────────────────────
-- CASE ATTEMPTS
-- ─────────────────────────────────────────

create table case_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  case_id         uuid not null references cases(id) on delete cascade,
  completed       boolean not null default false,
  self_rating     smallint check (self_rating between 1 and 5),
  time_spent_sec  integer,
  xp_awarded      integer not null default 0,
  created_at      timestamptz not null default now()
);

alter table case_attempts enable row level security;

create policy "Users can read own attempts"
  on case_attempts for select using (auth.uid() = user_id);

create policy "Users can insert own attempts"
  on case_attempts for insert with check (auth.uid() = user_id);

create index idx_attempts_user on case_attempts(user_id);
create index idx_attempts_case on case_attempts(case_id);

-- ─────────────────────────────────────────
-- FRAMEWORKS
-- ─────────────────────────────────────────

create table frameworks (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name_en         text not null,
  name_ja         text,
  category        text,
  when_to_use_en  text not null,
  when_to_use_ja  text,
  body_en         text not null,
  body_ja         text,
  diagram_url     text,
  applicable_case_types case_type[],
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

alter table frameworks enable row level security;

create policy "Anyone can read frameworks"
  on frameworks for select using (true);

-- ─────────────────────────────────────────
-- FACTS
-- ─────────────────────────────────────────

create table facts (
  id              uuid primary key default gen_random_uuid(),
  label_en        text not null,
  label_ja        text,
  value_text      text not null,
  numeric_value   numeric,
  unit            text,
  category        text,
  source_note     text,
  body_en         text,
  body_ja         text,
  created_at      timestamptz not null default now()
);

alter table facts enable row level security;

create policy "Anyone can read facts"
  on facts for select using (true);

create index idx_facts_category on facts(category);

-- ─────────────────────────────────────────
-- QUIZ RESULTS
-- ─────────────────────────────────────────

create table quiz_results (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  mode            quiz_mode not null,
  score           integer not null,
  total           integer not null,
  xp_awarded      integer not null default 0,
  created_at      timestamptz not null default now()
);

alter table quiz_results enable row level security;

create policy "Users can read own quiz results"
  on quiz_results for select using (auth.uid() = user_id);

create policy "Users can insert own quiz results"
  on quiz_results for insert with check (auth.uid() = user_id);

create index idx_quiz_user on quiz_results(user_id);

-- ─────────────────────────────────────────
-- SEED DATA — FRAMEWORKS
-- ─────────────────────────────────────────

insert into frameworks (slug, name_en, name_ja, category, when_to_use_en, when_to_use_ja, body_en, body_ja, applicable_case_types, sort_order) values
(
  'profitability-tree',
  'Profitability Tree',
  '収益性ツリー',
  'profitability',
  'Use when the client is experiencing declining profits or wants to diagnose revenue/cost drivers.',
  'クライアントの利益が低下している場合、または収益・コストの要因を診断したい場合に使用します。',
  'Revenue = Price × Volume. Costs = Fixed + Variable. Start at the top (Profit = Revenue − Costs) and drill down into each branch to identify where the root cause lies. Ask: Has revenue changed? Have costs changed? Which specific cost lines? Compare to prior periods or benchmarks.',
  '収益 = 価格 × 数量。コスト = 固定費 + 変動費。上から（利益 = 収益 − コスト）始め、各ブランチを掘り下げて根本原因を特定します。収益は変化したか？コストは変化したか？どのコスト項目か？前期や業界ベンチマークと比較します。',
  array['profitability','operations']::case_type[],
  1
),
(
  'market-entry',
  'Market Entry Framework',
  '市場参入フレームワーク',
  'market_entry',
  'Use when evaluating whether a company should enter a new market, geography, or segment.',
  '企業が新市場、新地域、新セグメントに参入すべきかを評価する際に使用します。',
  'Step 1 — Market Attractiveness: Is the market large enough? Growing? Profitable? Step 2 — Competitive Landscape: Who are the key players? Is there room for a new entrant? Step 3 — Company Fit: Does the client have the capabilities, brand, and resources to compete? Step 4 — Entry Mode: Organic growth, acquisition, partnership, or JV? Step 5 — Financial Case: Expected investment, payback period, ROI.',
  'ステップ1：市場の魅力度 — 市場規模は十分か？成長しているか？収益性はあるか？ステップ2：競合状況 — 主要プレイヤーは誰か？新規参入の余地はあるか？ステップ3：自社のフィット — 競争するための能力、ブランド、リソースはあるか？ステップ4：参入方式 — オーガニック成長、買収、提携、JVのどれか？ステップ5：財務ケース — 期待投資額、回収期間、ROI。',
  array['market_entry']::case_type[],
  2
),
(
  '3c',
  '3C Analysis',
  '3C分析',
  'strategy',
  'Use for a structured competitive landscape read: Company, Customers, Competitors.',
  '企業・顧客・競合の3軸で競争環境を体系的に把握したい場合に使用します。',
  'Company: What are the client''s strengths, weaknesses, core competencies, and strategic assets? Customers: Who are they? What do they need? How do they segment? Competitors: Who are the main competitors? What is their positioning, pricing, and strategic direction? Use 3C to identify where the client has an advantage and where they face threats.',
  '企業（Company）：クライアントの強み、弱み、コアコンピタンス、戦略的資産は何か？顧客（Customers）：顧客は誰か？何を求めているか？どのようにセグメント化されるか？競合（Competitors）：主要競合は誰か？ポジショニング、価格設定、戦略的方向性は？3Cを使ってクライアントの優位性と脅威を特定します。',
  array['market_entry','profitability','ma']::case_type[],
  3
),
(
  '4p',
  '4P Marketing Mix',
  '4Pマーケティング・ミックス',
  'marketing',
  'Use when the case involves product positioning, pricing, distribution, or go-to-market strategy.',
  '製品のポジショニング、価格設定、流通、または市場投入戦略が絡むケースで使用します。',
  'Product: What are the features, quality, and differentiation of the offering? Price: What pricing strategy — cost-plus, value-based, competitive, freemium? Place: What distribution channels — direct, retail, online, partners? Promotion: What marketing and communication strategy will drive awareness and conversion?',
  '製品（Product）：提供物の機能、品質、差別化は？価格（Price）：コストプラス、価値ベース、競合ベース、フリーミアムなどどの価格戦略か？流通（Place）：直接販売、小売、オンライン、パートナーなどどの流通チャネルか？プロモーション（Promotion）：認知とコンバージョンを促進するマーケティング・コミュニケーション戦略は？',
  array['market_entry','operations']::case_type[],
  4
),
(
  'porters-five-forces',
  'Porter''s Five Forces',
  'ポーターの5つの競争要因',
  'strategy',
  'Use when assessing the structural attractiveness of an industry before market entry or investment.',
  '市場参入や投資前に業界の構造的な魅力度を評価する際に使用します。',
  '1. Threat of New Entrants: How easy is it to enter the market? Barriers include capital requirements, regulations, brand loyalty, and economies of scale. 2. Bargaining Power of Suppliers: Can suppliers raise prices or reduce quality? 3. Bargaining Power of Buyers: Can buyers push prices down or demand more? 4. Threat of Substitutes: Are there alternative products that could replace the offering? 5. Rivalry Among Existing Competitors: How intense is the competition in the market?',
  '1. 新規参入の脅威：市場への参入はどれくらい容易か？参入障壁には資本要件、規制、ブランドロイヤルティ、規模の経済などがある。2. 売り手の交渉力：サプライヤーは価格を引き上げたり品質を下げたりできるか？3. 買い手の交渉力：買い手は価格を下げるよう迫れるか？4. 代替品の脅威：提供物に取って代わる代替製品・サービスはあるか？5. 既存競合間の競争：市場での競争はどれほど激しいか？',
  array['market_entry','ma']::case_type[],
  5
),
(
  'ma-framework',
  'M&A Framework',
  'M&Aフレームワーク',
  'ma',
  'Use when evaluating an acquisition, merger, or divestiture.',
  '買収・合併・売却を評価する際に使用します。',
  'Step 1 — Strategic Rationale: Why does this deal make sense? Fill a capability gap, acquire customers, enter a market, eliminate a competitor? Step 2 — Target Assessment: Quality of the target — growth, margins, competitive moat, management team, risks. Step 3 — Synergies: Revenue synergies (cross-sell, market expansion) and cost synergies (procurement, headcount, facilities). Step 4 — Valuation: Multiple-based (EV/EBITDA, EV/Revenue) and DCF. Is the ask price justified? Step 5 — Integration Risk: Culture clash, IT integration, customer retention, regulatory approval.',
  'ステップ1：戦略的根拠 — なぜこのディールは意味があるか？能力ギャップの補完、顧客獲得、市場参入、競合排除？ステップ2：対象企業の評価 — 成長性、利益率、競争優位性、経営陣、リスク。ステップ3：シナジー — 収益シナジー（クロスセル、市場拡大）とコストシナジー（調達、人員、施設）。ステップ4：バリュエーション — マルチプル法（EV/EBITDA、EV/売上）とDCF法。提示価格は正当か？ステップ5：統合リスク — 文化的摩擦、ITシステム統合、顧客維持、規制当局の承認。',
  array['ma']::case_type[],
  6
);

-- ─────────────────────────────────────────
-- SEED DATA — FACTS
-- ─────────────────────────────────────────

insert into facts (label_en, label_ja, value_text, numeric_value, unit, category, source_note) values
('US Population', '米国の人口', '~330 million', 330000000, 'people', 'population', 'US Census Bureau 2023'),
('Japan Population', '日本の人口', '~125 million', 125000000, 'people', 'population', 'Statistics Japan 2023'),
('World Population', '世界人口', '~8 billion', 8000000000, 'people', 'population', 'UN 2023'),
('US GDP', '米国GDP', '~$27 trillion', 27000000000000, 'USD', 'macro', 'World Bank 2023'),
('Japan GDP', '日本のGDP', '~¥600 trillion / $4.2 trillion', 4200000000000, 'USD', 'macro', 'World Bank 2023'),
('Global consulting market', 'グローバルコンサル市場', '~$700 billion', 700000000000, 'USD/yr', 'market_size', 'Statista 2023'),
('Typical EBITDA margin (manufacturing)', '製造業の典型的EBITDAマージン', '8–12%', null, '%', 'margin', 'McKinsey benchmark'),
('Typical EBITDA margin (SaaS)', 'SaaSの典型的EBITDAマージン', '20–40%', null, '%', 'margin', 'Public company benchmarks'),
('Typical gross margin (retail)', '小売業の典型的売上総利益率', '25–50%', null, '%', 'margin', 'Industry average'),
('Average US household income', '米国世帯の平均収入', '~$75,000/yr', 75000, 'USD/yr', 'consumer', 'US Census 2022'),
('Average Japanese salary', '日本の平均年収', '~¥4.5 million/yr', 4500000, 'JPY/yr', 'consumer', 'Ministry of Health, Labour and Welfare 2022'),
('Number of cars in the US', '米国の自動車保有台数', '~290 million', 290000000, 'vehicles', 'market_size', 'BTS 2022'),
('Global smartphone users', '世界のスマートフォンユーザー数', '~6.8 billion', 6800000000, 'people', 'technology', 'Statista 2023'),
('US e-commerce share of retail', '米国小売に占めるEコマース比率', '~16%', 16, '%', 'technology', 'US Census Q4 2023'),
('Average flight load factor (major airline)', '大手航空会社の平均座席利用率', '~83%', 83, '%', 'airline', 'IATA 2023'),
('Average restaurant profit margin', 'レストランの平均利益率', '3–9%', null, '%', 'margin', 'NRA 2022'),
('US healthcare spend as % of GDP', '米国医療費のGDP比', '~18%', 18, '%', 'healthcare', 'CMS 2022'),
('Average consulting project length', 'コンサルプロジェクトの平均期間', '3–6 months', null, 'months', 'consulting', 'Industry average'),
('McKinsey acceptance rate', 'マッキンゼーの採用率', '~1%', 1, '%', 'consulting', 'Publicly cited estimates'),
('Japan convenience stores (conbini) count', '日本のコンビニ店舗数', '~57,000', 57000, 'stores', 'market_size', 'Japan Franchise Association 2023');

-- ─────────────────────────────────────────
-- SEED DATA — CASES
-- ─────────────────────────────────────────

insert into cases (slug, type, difficulty, source_label, title_en, summary_en, xp_value, steps_en, is_published) values

-- EASY (5)
(
  'coffee-shop-profits',
  'profitability', 'easy', 'Original',
  'The Struggling Coffee Chain',
  'A regional coffee chain has seen profits drop 20% YoY despite flat revenue. Diagnose the root cause.',
  30,
  '{"prompt":"Your client is a regional coffee chain with 50 locations. Profits have fallen 20% over the past year despite flat revenue. The CEO wants to know why and what to do about it.","clarify":"Key clarifications to seek: Which cost lines have changed? Are all 50 locations affected equally? Has the product mix changed? Any new competitors nearby? Have raw material costs changed?","structure":"Use the Profitability Tree: Revenue (flat per problem) → investigate Costs → Fixed costs (rent, labor base) vs Variable costs (COGS, supplies). Hypothesis: variable costs have risen. Drill down to identify which variable cost line is the primary driver.","analysis":"Suppose COGS rose from 30% to 38% of revenue due to coffee bean price increases (+25% globally). Labor costs also up 5% from minimum wage increases. Together these explain the 20% profit drop. Quantify: if baseline margin was 15%, a 8-point COGS increase = ~53% margin decline on the profit line.","recommendation":"Short-term: renegotiate supplier contracts, explore alternative bean sources, modest price increase (3–5%). Medium-term: introduce a loyalty program to increase ticket size and offset margin compression. Long-term: consider a partnership with a regional roaster to hedge input costs.","debrief":"Strong answers structure the profitability tree clearly before diving in. Common mistakes: jumping to recommendations without quantifying the cost drivers. Always express the impact in terms of profit margin points, not just absolute dollars.","model_answer":"I would start by splitting the profit decline into revenue and cost drivers. Since revenue is flat, I focus on costs. Splitting fixed vs variable, the key driver is a 25% rise in coffee bean costs (variable COGS) combined with a 5% labor cost increase. Together these account for roughly 8 percentage points of margin compression on a ~15% baseline margin, explaining the 20% profit drop. My recommendations: (1) short-term cost mitigation via supplier renegotiation and 3–5% price increase supported by loyalty program launch to soften elasticity; (2) medium-term roaster partnership to hedge input costs."}',
  true
),
(
  'pizza-delivery-sizing',
  'market_sizing', 'easy', 'Original',
  'Pizza Deliveries in Tokyo',
  'Estimate the number of pizza deliveries made in Tokyo on a typical Friday night.',
  30,
  '{"prompt":"How many pizza deliveries are made in Tokyo on a typical Friday night?","clarify":"Scope: Tokyo metropolitan area (~14M people). Friday night = 6pm–midnight (6 hours). Delivery only (not dine-in or takeout pick-up). Pizza from any chain or independent restaurant.","structure":"Top-down demand-side: Population → households → proportion ordering food delivery on a Friday night → proportion specifically ordering pizza → proportion via delivery (vs. pickup). Triangulate supply-side: number of pizza delivery outlets × average deliveries per night.","analysis":"Tokyo 14M people ÷ 2.5 per household = 5.6M households. ~8% order some form of food delivery on a Friday night ≈ 450K ordering events. Of those, ~30% specifically order pizza ≈ 135K pizza orders. Of pizza orders, ~60% are delivery ≈ 81K deliveries. Sanity check: ~500 pizza delivery outlets × ~150 deliveries/night ≈ 75K. Consistent within ~10%.","recommendation":"Estimate: ~75,000–80,000 pizza deliveries in Tokyo on a typical Friday night.","debrief":"Strong market sizing has: clear segmentation, explicit assumptions, two methods for triangulation, and a sanity check. State your assumptions clearly — the interviewer is evaluating your reasoning, not whether you hit a specific number.","model_answer":"Demand-side: Tokyo has ~14M residents, ~5.6M households. On a Friday night, I estimate ~8% order food delivery, giving ~450K delivery orders. Of those, pizza is ~30% share (~135K), and ~60% are delivery vs. pickup — yielding ~80K pizza deliveries. Triangulating supply-side: ~500 pizza delivery locations × 150 orders/night ≈ 75K. My estimate: 75,000–80,000 deliveries."}',
  true
),
(
  'gym-entry-osaka',
  'market_entry', 'easy', 'Original',
  'Gym Chain Enters Osaka',
  'A Tokyo-based budget gym chain is considering opening its first Osaka location.',
  30,
  '{"prompt":"Your client is a successful budget gym chain operating 30 locations in Tokyo. They are evaluating opening their first location in Osaka. Should they?","clarify":"What is the target segment — budget vs premium? What is the current financial performance in Tokyo? Are there existing competitors in Osaka? Does the client have any Osaka brand recognition or real estate relationships?","structure":"Market Entry Framework: (1) Is the Osaka gym market attractive? (2) Does the client have the capability to compete? (3) What is the best entry mode? (4) What are the financials — investment required, breakeven, expected return?","analysis":"Osaka: 2.7M population, growing health-consciousness trend, 3 established budget gym chains but no dominant player. Client strengths: proven low-cost ops model, strong brand in Tokyo. Entry mode: greenfield single location as a pilot. Financials: ~¥80M capex, breakeven at ~800 members, comparable Osaka markets suggest 1,200 members achievable in year 1.","recommendation":"Yes, enter Osaka with one pilot location near a major train station. Monitor membership ramp; if >900 members by month 6, accelerate to a 3-location rollout. Choose Namba or Umeda for maximum foot traffic.","debrief":"Key structure: market attractiveness → client fit → entry mode → financials. Strong answers quantify the member breakeven and justify the pilot-before-scale approach. Weak answers skip the competitive analysis or fail to quantify the financial case.","model_answer":"I recommend entering Osaka. The market is attractive: 2.7M population, rising gym penetration, and no dominant budget player. The client has a proven low-cost playbook and operational advantage. Entry via a single greenfield location minimizes risk. With ¥80M capex and a breakeven of ~800 members, the Osaka market can support this — comparable Tokyo locations hit 1,200 members in year 1. I recommend a pilot-and-scale approach: one flagship near Namba or Umeda, measure at 6 months, then decide on a 3-location rollout."}',
  true
),
(
  'warehouse-bottleneck',
  'operations', 'easy', 'Original',
  'Warehouse Bottleneck',
  'An e-commerce company''s order fulfillment time has doubled. Find the root cause.',
  30,
  '{"prompt":"An e-commerce retailer''s average order fulfillment time has risen from 1 day to 2 days over the past quarter. Peak season is approaching in 6 weeks. Diagnose the issue and recommend a fix.","clarify":"Has order volume increased? Any staff changes? Any new product lines requiring different handling? Has the warehouse layout changed? Are all order types affected or just some?","structure":"Map the fulfillment process: Order receipt → Pick → Pack → Sort → Ship. Identify which step has the longest cycle time increase. Apply bottleneck/constraint analysis — the slowest step dictates overall throughput.","analysis":"Order volume up 40% QoQ. Picking step time increased most: average pick time per order rose from 4 min to 7 min. Root cause: 20% SKU expansion (new product lines) made item locations less organized — pickers walk 35% further per order. Packing and shipping are within normal range.","recommendation":"Immediate: re-slot high-velocity SKUs (top 20% by volume) to front zones (2-week project). Add 8 temporary pickers for the peak season. Medium-term: implement a WMS (warehouse management system) to optimize pick paths dynamically.","debrief":"Process-mapping before diagnosing is the right structure. Quantifying which step is the bottleneck separates average from strong answers. The weak answer is jumping to ''hire more staff'' without identifying the root cause.","model_answer":"I mapped the fulfillment process and found picking is the bottleneck — pick time per order rose 75% while pack and ship times are normal. Root cause: 20% SKU expansion with poor re-slotting forced pickers to walk 35% further per order. With peak season in 6 weeks: (1) re-slot the top 20% of SKUs by velocity to front zones, and (2) hire 8 temporary pickers. Longer term: implement a WMS to automate pick-path optimization."}',
  true
),
(
  'competitor-acquisition-easy',
  'ma', 'easy', 'Original',
  'Acquire the Competitor?',
  'A consumer goods firm considers acquiring a smaller direct competitor at 12× EBITDA.',
  30,
  '{"prompt":"Your client, a mid-size consumer goods company with $500M revenue, is considering acquiring a smaller competitor with $120M revenue and $8M EBITDA. The asking price is $96M (12× EBITDA). Is this a good deal?","clarify":"What synergies are expected? Is the target growing or shrinking? What is the client''s current leverage? What is the strategic rationale — fill a geographic gap, acquire a brand, eliminate a competitor?","structure":"M&A Framework: (1) Strategic rationale. (2) Target quality — growth, margins, risks. (3) Valuation — is 12× EBITDA fair? (4) Synergies — revenue and cost. (5) Integration risk.","analysis":"Strategic fit: target has strong position in a region where client is weak — fills geographic gap. Target quality: revenue growing 10% YoY, margins thin (6.7%) but improving. Valuation: 12× EBITDA is in line with sector comps (10–14×). Synergies: $12M cost synergies (procurement, back-office) + $8M revenue synergies (cross-sell) = $20M/yr. Post-synergy EBITDA: $28M → implied multiple of 3.4× — very attractive.","recommendation":"Proceed with acquisition. The deal is fairly valued at 12× pre-synergy EBITDA, but synergies make it highly attractive at an effective 3.4× post-synergy. Prioritize cost synergies in year 1, revenue synergies in year 2. Negotiate a retention package for target leadership.","debrief":"Strong answers calculate the synergy-adjusted multiple, not just the headline multiple. Always check strategic fit before financials — a cheap deal with no strategic rationale is still a bad deal.","model_answer":"Yes, this is a good deal. Strategically, the target fills a geographic gap where our client is weak. At 12× EBITDA, the valuation is in line with sector comps. But the real value is in synergies: $12M cost + $8M revenue = $20M/yr, reducing the effective acquisition multiple to ~3.4×. The target is growing at 10% YoY and margins are improving. My recommendation: proceed, structure a clean earnout to retain target management, and focus year-1 integration on procurement consolidation for quick cost wins."}',
  true
),

-- MEDIUM (5)
(
  'airline-profit-decline',
  'profitability', 'medium', 'Original',
  'Low-Cost Airline Margin Squeeze',
  'A Southeast Asian LCC''s margin fell from 8% to 3% despite 15% revenue growth.',
  60,
  '{"prompt":"Your client is a low-cost carrier (LCC) operating 80 routes in Southeast Asia. Net margin has fallen from 8% to 3% over two years despite revenue growing 15%. The board is alarmed. What is driving this and what should be done?","clarify":"Has fuel cost changed significantly? Any route mix changes? New aircraft acquisitions? Labor cost trends? Competitive dynamics on key routes? Has average ticket price changed?","structure":"Frame as CASM (cost per available seat mile) vs RASM (revenue per available seat mile). Revenue growing ✓ → focus on (A) costs growing faster than revenue, and (B) revenue quality declining (mix effect). Decompose CASM: fuel, labor, aircraft ownership, distribution, overhead.","analysis":"CASM rose 22% vs revenue +15%. Fuel +30% (oil price spike + older fleet inefficiency). Labor +18% (pilot shortage). Aircraft ownership +25% (new fleet leases). But also: 12 new routes added have average load factor 61% vs 81% on legacy routes, depressing RASM even as total revenue rises. Both cost inflation AND revenue mix degradation are at play.","recommendation":"Immediate: cut or consolidate the 4 worst-performing new routes (load factor <55%). Medium-term: accelerate fleet renewal to A320neo/B737 MAX for ~15% fuel savings. Longer-term: yield management system upgrade to improve RASM on high-demand routes. Target: restore margin to 6%+ within 18 months.","debrief":"The trap is focusing only on cost. The smarter insight is that revenue mix has also degraded — low-load new routes are diluting RASM. Strong answers catch both drivers. Always frame profitability as a two-sided equation: RASM vs CASM.","model_answer":"This is a CASM vs RASM problem. Revenue is growing but margin is falling — costs are growing faster than revenue AND revenue quality is declining. On costs: fuel (+30%), labor (+18%), and new fleet leases (+25%) drove CASM up 22%. On revenue quality: 12 new routes have 61% average load factor vs 81% on legacy routes, depressing RASM. Recommendations: (1) cut the 4 routes with load factor below 55%; (2) fast-track A320neo transition to cut fuel costs 15%; (3) invest in dynamic pricing to improve load factors on salvageable new routes. Target: restore margin to 6%+ within 18 months."}',
  true
),
(
  'edtech-japan-entry',
  'market_entry', 'medium', 'Original',
  'US EdTech Platform Enters Japan',
  'A US online learning platform wants to enter Japan within 18 months.',
  60,
  '{"prompt":"Your client is a leading US-based online professional learning platform with $800M revenue. They want to enter Japan within 18 months. How should they approach this, and is it a good idea?","clarify":"B2B or B2C focus? Any existing Japanese user base? Do they have Japanese-language content? What is the target segment — students, professionals, corporates? What is the budget for market entry?","structure":"Market Entry: (1) Market attractiveness — is Japan worth entering? (2) Competitive landscape. (3) Client capabilities vs. market requirements — what gaps exist? (4) Entry mode options. (5) Financial case and phasing.","analysis":"Japan EdTech market: ~$2.5B, growing 12% YoY. Professional learning segment: ~$800M. Competition: domestic players (Schoo, Udemy Japan via Benesse) have strong brand trust. Client gaps: no JP-language content, no local brand recognition, no distribution relationships. Client strengths: 10K+ course library, strong B2B sales motion, global tech brand. Entry mode: (A) organic B2C build — slow, expensive; (B) acquire/partner with Schoo — faster but costly; (C) white-label B2B via Japanese HR software vendor — lowest risk, fastest revenue. Option C is recommended.","recommendation":"Enter Japan via B2B white-label partnership with a top-3 HR software platform (e.g., SmartHR). Offer English-heavy tech content in year 1, invest in JP localization of top 200 courses for year 2. Avoid B2C until brand is established.","debrief":"Japan market entry cases reward candidates who identify the localization barrier and the keiretsu distribution challenge early. Generic frameworks without Japan-specific insight score lower.","model_answer":"Japan is worth entering — $800M professional learning market growing at 12%, with a strong corporate culture of L&D spend. The client faces two critical gaps: no Japanese-language content and no brand recognition. My recommendation: enter via B2B white-label partnership with a leading HR software platform like SmartHR. This provides immediate access to their corporate customer base, avoids brand-building costs, and leverages existing trust. Year 1: tech companies where English content is acceptable. Year 2: localize top 200 courses to expand TAM to non-tech corporates."}',
  true
),
(
  'conbini-coffee-sizing',
  'market_sizing', 'medium', 'Original',
  'Convenience Store Coffee Market in Japan',
  'Estimate the annual revenue from convenience store (conbini) coffee sales in Japan.',
  60,
  '{"prompt":"Estimate the annual revenue from brewed coffee sold at convenience stores in Japan.","clarify":"Scope: all convenience stores in Japan (7-Eleven, FamilyMart, Lawson, and others). Coffee = counter-brewed/drip coffee sold at the machine (not canned or bottled coffee in coolers).","structure":"Supply-side: Number of conbini stores × average cups/day/store × price × 365. Triangulate demand-side: Japan population × coffee-drinking proportion × conbini coffee frequency × price.","analysis":"Supply-side: ~57,000 conbini in Japan. Average ~80 cups/day (peak ~100 morning, off-peak ~50 overnight). Price: ¥100–150, use ¥120. Revenue/store/year: 80 × ¥120 × 365 = ¥3.5M. Total: 57,000 × ¥3.5M ≈ ¥200B. Demand-side: 125M × 60% coffee drinkers × 20% buy conbini coffee weekly × ~2/week × ¥120 × 52 ≈ ¥185B. Convergence at ¥190–200B.","recommendation":"Annual convenience store brewed coffee revenue in Japan: approximately ¥200 billion (~$1.3 billion USD).","debrief":"Japan conbini coffee is a real, well-known market. Strong candidates know the ~57K store count or can derive it. The ¥100–120 price point is distinctive — Japan conbini coffee is famous for being cheap and good. Two-method triangulation and a clear sanity check are expected at medium level.","model_answer":"Supply-side: Japan has ~57,000 convenience stores. Each sells roughly 80 cups of brewed coffee per day. At ¥120/cup, that is ¥3.5M per store per year, ¥200B total. Triangulating demand-side: 125M × 60% coffee drinkers × 20% buy conbini coffee weekly × 2 purchases/week × ¥120 × 52 weeks ≈ ¥185B. The two methods converge at ¥190–200B. My estimate: ¥200 billion per year."}',
  true
),
(
  'retail-labor-efficiency',
  'operations', 'medium', 'Original',
  'Retail Store Labor Efficiency',
  'A clothing retailer''s labor cost as a % of revenue rose 4 points over 3 years.',
  60,
  '{"prompt":"A mid-size clothing retailer (200 stores, $1.5B revenue) has seen labor cost as a percentage of revenue rise from 14% to 18% over 3 years, eroding profitability. Same-store sales are flat. What is driving this and how should they fix it?","clarify":"Have wages increased? Has headcount changed? Has the store format changed? Any shift in customer traffic patterns? Is this uniform across all stores or concentrated in a subset?","structure":"Labor cost % = Total labor ÷ Revenue. Revenue flat → cost must have risen. Decompose: Hours worked × Wage rate. Did hours go up, wages go up, or both? Then segment: are all 200 stores affected or just some clusters?","analysis":"Wage rate: minimum wage up 12% over 3 years → accounts for ~1.5 pts. Hours: stores are staffed to historical peak-traffic patterns, but foot traffic fell 20% (shift to online shopping). Stores are overstaffed during low-traffic hours. Bottom 40 stores by sales/sqft have labor cost at 22% — those are structurally unviable. Top 40 stores are at 15%.","recommendation":"(1) Deploy dynamic labor scheduling (traffic-based staffing) across all stores — ~$3M software investment, expected $30M labor savings. (2) Audit the bottom 40 stores — close or reformat 15 underperforming locations. (3) Explore omnichannel model (store-as-fulfillment-center) to improve revenue/labor ratio.","debrief":"Key insight: decompose into structural (wage increases) vs. behavioral (overstaffing due to traffic decline) components. The traffic-shift context is the non-obvious insight that separates strong answers. Segmenting by store performance is also a differentiator.","model_answer":"Labor cost % = labor spend ÷ revenue. With flat revenue, I focus on labor spend. Splitting wage rate × hours: minimum wage rose 12%, explaining ~1.5 of the 4 points. The remaining 2.5 points come from excess hours — stores are scheduled to historical traffic, but foot traffic fell 20% as customers shifted online. Fix: (1) implement traffic-based dynamic scheduling ($3M → $30M ROI); (2) audit bottom 40 underperforming stores for closure or format change (22% labor cost ratios are structurally unviable)."}',
  true
),
(
  'pharma-biotech-acquisition',
  'ma', 'medium', 'Original',
  'Pharma Acquires Oncology Biotech',
  'A major pharma with a weak pipeline considers a $2B acquisition of a clinical-stage biotech.',
  60,
  '{"prompt":"Your client is a major pharmaceutical company ($15B revenue) with a weak oncology pipeline. They are evaluating acquiring a clinical-stage oncology biotech for $2B. The biotech has one Phase 2 drug (60% Phase 2→3 success rate industry average) and one Phase 3 drug (40% approval probability). How should your client think about this deal?","clarify":"What is the peak revenue potential for each drug? What is the client''s oncology strategy? Any competing bidders? What synergies exist beyond the pipeline? What is the timeline to market for each drug?","structure":"M&A Framework: Strategic rationale → Target quality (pipeline risk-adjusted value) → Valuation → Synergies → Integration risk. Critical: risk-adjust the pipeline using probability-weighted NPV.","analysis":"Phase 3 drug: peak revenue $800M/yr, 40% approval probability × $800M × 8× NPV multiple = $2.56B, risk-adjusted: $1.02B. Phase 2 drug: peak $500M/yr, 60% Phase2→3 × 40% Phase 3 approval = 24% overall, risk-adjusted: 24% × $500M × 8× = $960M × 24% = $230M. Total pipeline risk-adjusted: ~$1.25B vs $2B ask — appears overpriced by ~$750M on pure DCF. BUT: strategic option value (platform, talent, IP, blocking a competitor) adds $400–600M. Adjusted range: $1.65–1.85B → deal is marginally overpriced.","recommendation":"Counter-offer at $1.6B upfront with $400M milestone earnout tied to Phase 3 approval. This aligns incentives, reduces downside risk, and keeps the client competitive if other bidders emerge.","debrief":"Pharma M&A requires probability-weighted NPV thinking. Candidates who do not risk-adjust the pipeline are missing the core analytical skill. The earnout structure is the sophisticated punchline. Always calculate both DCF and strategic option value.","model_answer":"Risk-adjusted NPV: Phase 3 drug: 40% × $800M × 8× = $1.02B. Phase 2 drug: 24% (60%×40%) × $500M × 8× = $230M. Total: $1.25B vs. $2B ask — overpriced by ~$750M on pure DCF. However, strategic option value — blocking a competitor, acquiring talent and platform IP — adds $400–600M, bringing the justified range to $1.65–1.85B. My recommendation: offer $1.6B upfront + $400M milestone earnout contingent on Phase 3 approval. This structures the deal to reflect the binary risk while staying competitive."}',
  true
),

-- PROFESSIONAL (5)
(
  'global-bank-cost-transform',
  'profitability', 'professional', 'Original',
  'Global Bank Cost Transformation',
  'Design a $1.5B cost reduction program for a tier-1 bank with a 68% cost-to-income ratio.',
  100,
  '{"prompt":"Your client is a tier-1 global bank with $45B in revenue and a cost-to-income ratio (CIR) of 68% — well above the 55% board target. The CEO has tasked you with designing a $1.5B cost reduction program over 3 years. What is your approach?","clarify":"Which business lines are in scope? Is there a headcount constraint? What is the baseline for year-1 savings? Any regulatory constraints (especially middle-office)? How should we handle the revenue-cost trade-off?","structure":"Cost base mapping: Front-office (revenue-linked, risky to cut) → Middle-office (risk/compliance, regulatory constraints) → Back-office (operations, technology, shared services — highest savings potential). Prioritize by impact/risk ratio. Use a transformation wave structure: quick wins (year 1) → structural changes (year 2) → technology-enabled (year 3).","analysis":"$45B × 68% CIR = $30.6B cost base. Target CIR 55% → $24.75B → gap is $5.85B (not $1.5B — the program is a partial step, rest from revenue growth). $30.6B breakdown: ~$12B front-office (do not touch), ~$8B middle-office (limited reduction due to regulation), ~$10.6B back-office (35% addressable = $3.7B potential). Levers: IT rationalization $400M + offshoring $350M + procurement $250M + branch optimization $300M + management layer $200M = $1.5B.","recommendation":"Three waves: Wave 1 (months 1–12): procurement, vendor consolidation, branch rationalization — $500M. Wave 2 (months 13–24): IT system decommissioning, offshoring ramp — $600M. Wave 3 (months 25–36): organizational simplification and back-office automation — $400M. Establish a Transformation Office reporting to the CFO with dedicated P&L ownership per wave.","debrief":"Professional-level cases reward structured program design, not just a list of cuts. The wave structure, governance model, and revenue-risk trade-off analysis separate strong from exceptional answers. Note: regulatory constraints make middle-office cuts dangerous and must be flagged.","model_answer":"Three-wave transformation. Cost base: $30.6B. Front-office is protected (revenue-linked). Middle-office has regulatory constraints. Back-office ($10.6B) is the primary pool — 14% reduction to hit $1.5B. Five levers: IT rationalization ($400M) by decommissioning legacy systems; offshoring ($350M) moving 3,000 FTE to India/Philippines; procurement ($250M) consolidating from 1,200 to 300 strategic vendors; branch network ($300M) closing 120 underperforming locations; management layer reduction ($200M). Wave structure: $500M year 1 (quick wins), $600M year 2 (structural), $400M year 3 (automation). Governance: dedicated Transformation Office with CFO reporting and business-line co-owners for revenue protection."}',
  true
),
(
  'european-oem-ev-japan',
  'market_entry', 'professional', 'Original',
  'European OEM Enters Japanese EV Market',
  'A major European automaker evaluates entering Japan''s nascent EV market. Design the full strategy.',
  100,
  '{"prompt":"A leading European OEM ($80B revenue, strong EV portfolio) is evaluating entering the Japanese automotive market with a focus on EVs. Japan has historically been resistant to foreign auto brands. Should the client enter, and if so, how?","clarify":"Passenger vehicles or commercial? Which EV segments (mass-market, premium, luxury)? Timeline — 3 years or 10? Does the client have existing distribution in Japan? Right-hand-drive capability?","structure":"Market Entry: (1) Market attractiveness — Japan EV size, growth, policy tailwinds vs. headwinds. (2) Competitive landscape — domestic incumbents (Toyota, Nissan, Honda) and foreign entrants (Tesla). (3) Client capabilities vs. market requirements — identify gaps. (4) Entry mode options with risk/cost trade-offs. (5) Financial case and milestone-based phasing.","analysis":"Japan EV penetration: ~3% in 2023 vs 20%+ in Europe/China. Government mandate: 100% electrified by 2035 — we are at the early inflection point. Domestic: Toyota strong in hybrid but slow on pure BEV; Nissan (Leaf, Ariya) has head start; Honda accelerating. Tesla holds ~1% share, proving the premium segment is accessible. Client gaps: no Japanese distribution, no right-hand-drive (RHD) versions of key models, no brand recognition. Entry mode: (A) direct subsidiary — slow and expensive; (B) JV with domestic OEM — complex IP issues; (C) exclusive distribution partnership with Japanese importer — fastest, lowest risk. Start with premium segment (>¥7M).","recommendation":"Enter via 3-year exclusive distribution partnership with a top-tier Japanese automotive importer. Invest ¥3B in RHD conversion and Japan-spec homologation. Target 0.3% market share (5,000 units/year) by year 3 as proof of concept, then transition to direct subsidiary.","debrief":"Japan automotive cases require knowledge of keiretsu distribution dynamics, RHD requirements, and the consumer trust challenge for foreign brands. Generic market entry without Japan-specific insight does not pass the professional bar.","model_answer":"Japan is worth entering now — EV penetration at 3% with a 2035 mandate creates a 10-year window. Risk: Japan automotive is keiretsu-dominated with deep consumer trust in domestic brands. Tesla''s ~1% share proves premium foreign EVs can penetrate. Recommendation: enter the ¥7–12M premium segment via a 3-year exclusive distribution deal with a national importer (e.g., Yanase). This avoids the ¥20B+ cost of direct infrastructure while giving market presence. Invest ¥3B in RHD conversion and homologation for 2–3 hero models. KPIs: 5,000 units/year by year 3, NPS >40, then evaluate direct subsidiary transition. The competitive window is the next 3–5 years before Toyota''s pure BEV lineup matures."}',
  true
),
(
  'senior-care-tech-japan',
  'market_sizing', 'professional', 'Original',
  'IoT Senior Care Market in Japan',
  'Estimate the TAM for IoT-enabled in-home health monitoring for independent seniors in Japan.',
  100,
  '{"prompt":"Estimate the total addressable market (TAM) for IoT-enabled in-home health monitoring devices targeting seniors (65+) living independently in Japan. Include both device revenue and recurring subscription revenue in your estimate.","clarify":"Product definition: IoT sensors (fall detection, vitals monitoring, emergency alert) + a monthly subscription service. Target: 65+ living alone or with one other elderly person (not in care facilities). Pricing: ¥30,000 device + ¥3,000/month subscription.","structure":"Population funnel: Japan 65+ → subset living independently → subset in solo or elderly-only households → realistic adoption rate. Then model revenue per household: device (one-time) + subscription LTV. Build both a penetration-phase TAM and a steady-state ARR.","analysis":"Japan: 125M × 30% aged 65+ = 37.5M seniors. ~60% live in community (not facilities) = 22.5M. ~35% live alone or in elderly-only households = ~7.9M households (at-risk, high-motivation segment). Adoption ceiling: smartphone adoption in 65+ cohort is ~40% in Japan. Realistic 5-year penetration: 15–20%, use 18% → 1.4M households. Revenue: ¥30,000 device + ¥3,000/month × 12 = ¥36,000/yr recurring. Year-1 TAM: 1.4M × ¥66,000 = ¥92B. Steady-state ARR: 1.4M × ¥36,000 = ¥50B/yr.","recommendation":"TAM: ~¥90B penetration-phase, ¥50B annual recurring at scale. This is a large, growing market — Japan''s senior population projected to reach 40% by 2040.","debrief":"Professional market sizing tests the ability to layer a multi-part revenue model (hardware + SaaS) and apply realistic adoption curves. Japan-specific demographic knowledge is expected. The adoption rate triangulation (vs. smartphone penetration benchmark) is what separates a strong answer.","model_answer":"Population funnel: 37.5M seniors (30% of 125M). 60% live in community settings = 22.5M. 35% are solo or elderly-couple households = ~7.9M target households. Adoption: benchmarking against 40% smartphone penetration in 65+ cohort as the tech-adoption ceiling, I apply a conservative 18% 5-year penetration → 1.4M households. Revenue: ¥30,000 device + ¥36,000/yr subscription. Penetration-phase TAM: 1.4M × ¥66,000 ≈ ¥92B. Steady-state ARR: 1.4M × ¥36,000 ≈ ¥50B. Japan''s aging trajectory (40% senior population by 2040) means this market will grow materially. My estimate: ¥90–100B TAM, ¥50B annual recurring at scale."}',
  true
),
(
  'auto-supply-chain-resilience',
  'operations', 'professional', 'Original',
  'Auto Supply Chain Resilience',
  'Design a supply chain resilience strategy after a $1B production loss from a single-source failure.',
  100,
  '{"prompt":"Your client is a top-5 Japanese automobile manufacturer. Last year, a fire at a single-source chip supplier caused a 6-week production halt across 14 plants, resulting in $800M in lost production and $200M in emergency procurement costs. The COO wants a supply chain resilience strategy. What do you recommend?","clarify":"How many total suppliers? What percentage are single-source? What is the current inventory policy (JIT vs. buffer stock)? Has risk been mapped by component criticality? What is the risk appetite for cost increase?","structure":"Resilience framework: (1) Risk mapping — identify and tier vulnerabilities by criticality × likelihood. (2) Mitigation levers — dual-sourcing, safety stock, geographic diversification, supplier development. (3) Cost-benefit analysis for each lever. (4) Implementation roadmap and governance model.","analysis":"Assume 3,000 suppliers, 18% single-source (~540). Of 540, ~30 are critical (high volume, long lead time, no substitute) — these represent 80% of risk exposure. Current: JIT with 3–7 day buffer. The $1B event came from one critical single-source chip supplier with a 3-day buffer. Mitigation options: (A) Dual-source top 30: 5–8% premium on $2B critical spend = $100–160M/yr, reduces single-event risk by 70%. (B) 30-day safety stock on critical components: $150M working capital increase, would have fully avoided the $1B event. (C) Geographic dual-sourcing for semiconductors and rare earths: 2–3 year program, $50–80M. (D) Supplier co-investment in backup capacity. Recommended portfolio: A + B + targeted C.","recommendation":"Tier 1 (months 1–6): 30-day safety stock on top 30 critical parts ($150M working capital). Tier 2 (month 12): dual-source top 30 ($120M/yr). Tier 3 (months 24–36): geographic diversification for semiconductors. Establish a Supply Chain Risk Control Tower with real-time supplier health monitoring.","debrief":"Professional operations cases require cost-benefit framing of resilience investment vs. risk exposure. The $280M annual cost protecting against $1B+ risk is the central trade-off to quantify. Candidates who list options without quantifying the trade-off do not pass the professional bar.","model_answer":"Risk-ranking first: of 3,000 suppliers, ~30 critical single-source ones represent 80% of exposure based on volume, lead time, and substitutability. The $1B event was predictable — JIT on critical single-source components is a known fragility. Three levers: (1) 30-day safety stock on critical 30 — $150M working capital, would have avoided the $800M loss (extraordinary ROI). (2) Dual-source top 30: $120M/yr premium, reduces single-event risk 70%. (3) Geographic diversification for semiconductors: $50–80M, 2–3 year program. Portfolio cost: ~$280M/yr vs $1B+ event risk — clearly justified. Governance: Risk Control Tower with real-time supplier health scoring, quarterly criticality re-tiering, and cross-functional crisis response protocol."}',
  true
),
(
  'neobank-acquisition-japan',
  'ma', 'professional', 'Original',
  'Regional Bank Acquires Neobank',
  'A regional Japanese bank evaluates a ¥80B acquisition of a fast-growing neobank.',
  100,
  '{"prompt":"Your client is a regional Japanese bank (¥3T in assets, declining net interest margin, aging customer base). They are considering acquiring a 5-year-old Japanese neobank (500K customers, ¥50B deposits, 80% YoY growth, burning ¥3B/yr, pre-profitability). The founders want ¥80B. Is this the right deal and at what price?","clarify":"What is the strategic goal — customers, technology, talent, or deposits? What is the bank''s digital transformation budget? Regulatory constraints on the acquisition? What is the neobank''s path to profitability?","structure":"M&A: (1) Strategic rationale and fit. (2) Target quality — growth, unit economics, competitive position, path to profitability. (3) Valuation (deposit multiple + DCF). (4) Synergies (cost and revenue). (5) Regulatory and integration risks.","analysis":"Strategic fit: strong — client needs digital distribution, younger customer base (neobank avg age 28 vs bank 52), and a modern tech stack. Target quality: 500K customers growing 80% YoY, ¥100K avg deposit, but burning ¥3B/yr. Path to profitability: ~18 months at current growth if bank provides balance sheet stability. Valuation: Japan neobank comps at 1–2× deposits (market skeptical of profitability) → 1.5× × ¥50B = ¥75B. DCF: terminal at 5M customers × ¥5K annual revenue/customer × 25% margin × 12× = ¥75B discounted ≈ ¥50B. Fair value range: ¥50–75B vs ¥80B ask — overpriced on fundamentals. Synergies: saved VC funding burn ¥5B (2 yrs), cross-sell to 500K young customers ¥10B NPV, avoided internal tech build ¥8B = ¥23B. Synergy-adjusted ceiling: ¥75B.","recommendation":"Counter-offer ¥68B + ¥12B milestone earnout tied to reaching 2M customers within 3 years. Structure as an independent subsidiary with founders retained as co-CEOs for 3 years.","debrief":"This case tests valuing a high-growth, pre-profit tech company in a traditional financial services context. The earnout structure and synergy analysis (especially the saved VC-burn insight) separate professional from medium-level answers. Always triangulate valuation methods.","model_answer":"Strategic rationale: compelling — digital distribution, younger demographics, and a tech stack that would cost ¥8B+ to build internally. Valuation triangulation: deposit multiple (1.5× ¥50B = ¥75B) and DCF (~¥50B present value). The ¥80B ask is above intrinsic value on both methods. However, synergies change the calculus: stopping the burn saves ¥5B over 2 years; cross-sell 500K young customers = ¥10B NPV; avoided tech build = ¥8B — ¥23B total. Synergy-adjusted ceiling: ¥75B. Recommendation: offer ¥68B upfront + ¥12B earnout tied to 2M customers in 3 years. Structure as an independent subsidiary with founders as co-CEOs for 3 years — culture preservation is the critical integration risk."}',
  true
);
