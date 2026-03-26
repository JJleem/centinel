# Centinel

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Claude API](https://img.shields.io/badge/Claude_API-Sonnet_4_+_Haiku_4.5-D97757?style=flat-square&logo=anthropic)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel)](https://centinel.vercel.app)

> **Cent**inel — *Supercent* + *Sentinel*. 경쟁 게임 시장을 감시하고, 즉시 액션으로 전환합니다.

슈퍼센트 AI 애플리케이션 엔지니어 과제전형 결과물입니다.
Google Play 실시간 차트 수집 → Claude AI 앙상블 분석 → 광고 소재 6종 즉시 생성까지 원스톱 파이프라인을 구현했습니다.

---

## 📌 프로젝트 소개

하이퍼 캐주얼 게임 시장에서 UA(User Acquisition) 담당자가 경쟁사 트렌드를 파악하고 광고 소재를 기획하는 데는 상당한 시간이 소요됩니다. Centinel은 이 과정을 완전 자동화합니다.

- 장르명·경쟁사명 입력 **또는** 실시간 차트에서 직접 클릭
- Google Play 데이터를 실시간 수집, Claude AI 4단계 앙상블 파이프라인으로 분석
- 이 게임이 왜 인기인가 · 비슷한 게임 · 떡상 가능성 · 광고 소재 6종 즉시 생성
- 결과를 공유 링크 / PDF / CSV로 저장, 히스토리에서 재열람 가능

---

## 🎯 핵심 기능

| 기능 | 설명 |
|------|------|
| 실시간 차트 | 급상승 · 글로벌 탑 · 매출 탑 · 캐주얼 탑 4개 탭, 클릭하면 바로 분석 |
| 실시간 데이터 수집 | `google-play-scraper`로 검색 결과 + 차트 순위 동시 수집, 개별 404 무시 |
| 이 게임이 왜 인기인가 | 차트 진입 게임별 개별 분석 — 훅 · 리텐션 · 수익 모델 해부 (Haiku) |
| 비슷한 게임 | 차트 게임 기준 `gplay.similar()` 10개 나열 — 추가 LLM 호출 없음 |
| 떡상 가능성 게임 | 스냅샷 DB 비교로 급상승 중인 미분석 게임 탐지 — 추가 LLM 호출 없음 |
| 4단계 앙상블 파이프라인 | Sonnet(트렌드) → Haiku×2(인사이트 앙상블) → Haiku(종합) → Haiku×2(광고 앙상블) → Sonnet(선별) |
| Vision 분석 | 스크린샷 최대 10장을 Sonnet Vision으로 분석 — UI 복잡도 · 색상 · 핵심 메카닉 추출 |
| SSE 스트리밍 | Server-Sent Events로 각 단계 진행 상태 실시간 표시 |
| 광고 소재 6종 | 흥미 · 도전 · 호기심 · FOMO · 단순 · 공감(스토리텔링) 6가지 톤 |
| 차트 순위 뱃지 | 글로벌탑 / 매출탑 / 캐주얼탑 + ▲▼ 순위 변동 뱃지 |
| EN / KO 언어 토글 | 분석 결과 언어 전환 |
| 공유 링크 | `/result/[id]` 고정 URL로 결과 공유 |
| 분석 히스토리 | Supabase DB 저장 + 히스토리 페이지에서 재열람 |
| PDF / CSV 다운로드 | `window.print()` 기반 PDF, 데이터 CSV 내보내기 |
| 스냅샷 시스템 | 매시간 크론(Vercel) + 수동 저장 버튼으로 차트 변화 이력 축적 |

---

## 🏗 아키텍처

```
사용자 입력 (검색어 / 실시간 차트 클릭)
        │
        ▼
[/api/scrape]
google-play-scraper 검색 + 개별 gplay.app() 병렬 수집
        │
        ├─ 차트 DB 조회 → chartRank / chartLabel / rankChange 뱃지 부여
        ├─ gplay.similar() → 비슷한 게임 10개
        └─ 게임 데이터 (GameData[])
                │
                ▼
[/api/analyze]  SSE 스트리밍
        │
        ├─ Stage 0 │ 이게임이 왜인기인가 (Haiku)    ─┐
        │            차트 게임별 인기 이유 분석         │ 병렬
        ├─ Stage 1 │ 트렌드 분석가 (Sonnet)          ─┘
        │            장르 트렌드 · 메카닉 · 키워드 추출
        │
        ├─ Stage 2 │ 인사이트 앙상블 (Haiku × 2 병렬)
        │            분석형 vs 창의형 → Haiku 오케스트레이터 종합
        │
        ├─ Stage 3 │ 광고 소재 앙상블 (Haiku × 2 병렬)
        │            퍼포먼스형 vs 브랜드형 6종씩 생성
        │
        └─ Stage 4 │ 오케스트레이터 선별 (Sonnet)
                     12종 중 최종 6종 선별 · 정제
                │
                ▼
        결과 저장 (Supabase analysis_history)
                │
                ▼
        결과 페이지 (/result)
        RisingInsightsSection · SimilarGamesSection · BreakoutSection
        TrendCard · AdCopyCard × 6 · GameCharts · Vision분석

[/api/cron/snapshot]  매시간 실행 (Vercel Cron)
        └─ 글로벌탑 · 매출탑 · 캐주얼탑 각 30위 → Supabase chart_snapshots

[/api/charts/rising]
        └─ 최신 vs 1시간 전 스냅샷 비교 → 급상승 게임 탐지
```

---

## 🛠 Tech Stack

| 역할 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4 |
| AI — 분석 | Claude Sonnet 4 (`claude-sonnet-4-20250514`) |
| AI — 앙상블 | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) |
| AI — Vision | Claude Sonnet 4 (이미지 base64 멀티모달) |
| 데이터 수집 | `google-play-scraper` |
| DB | Supabase (PostgreSQL) — `analysis_history`, `chart_snapshots` |
| 스트리밍 | Server-Sent Events (ReadableStream) |
| 배포 | Vercel + Vercel Cron (매시간 스냅샷) |
| 개발 도구 | Claude Code |

---

## ⚡ 로컬 실행

```bash
git clone https://github.com/JJleem/centinel.git
cd centinel
npm install
```

`.env.local` 파일 생성:

```env
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
CRON_SECRET=your-cron-secret
```

```bash
npm run dev
# http://localhost:3000
```

---

## 🗄 Supabase 테이블

**`analysis_history`** — 분석 결과 영구 저장 및 공유 링크

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | 공유 링크 ID |
| query | text | 검색어 |
| games | jsonb | 수집된 게임 데이터 |
| insight | jsonb | 앙상블 인사이트 |
| ad_copies | jsonb | 광고 소재 6종 |
| rising_insights | jsonb | 이게임이 왜인기인가 |
| similar_games | jsonb | 비슷한 게임 |
| breakout_candidates | jsonb | 떡상 가능성 게임 |
| vision_result | jsonb | Vision 분석 결과 |
| lang | text | EN / KO |
| created_at | timestamptz | 생성 시각 |

**`chart_snapshots`** — 시간별 차트 순위 이력

| 컬럼 | 타입 | 설명 |
|------|------|------|
| app_id | text | Google Play 앱 ID |
| title / developer / icon | text | 앱 정보 |
| rank | int | 순위 (1–30) |
| collection | text | TOP_FREE / GROSSING |
| category | text | GAME / GAME_CASUAL |
| score / genre | — | 부가 정보 |
| fetched_at | timestamptz | 스냅샷 시각 |

---

## 🔐 환경변수

| 변수명 | 설명 |
|--------|------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API 키 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `CRON_SECRET` | Vercel Cron 인증 토큰 |

---

## ⚠️ 주의사항

- Claude API 키가 없으면 분석 기능이 동작하지 않습니다.
- Supabase 미설정 시 차트 뱃지 · 히스토리 · 급상승 기능이 비활성화됩니다.
- 급상승 탭은 스냅샷이 1시간 간격으로 2개 이상 쌓여야 작동합니다.
- `google-play-scraper` 응답이 3건 미만이면 422를 반환합니다 (fallback 제거됨).

---

## 👤 만든 사람

**임재준**

[![Portfolio](https://img.shields.io/badge/Portfolio-molt--ten.vercel.app-4DAEDB?style=flat-square)](https://molt-ten.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-JJleem-181717?style=flat-square&logo=github)](https://github.com/JJleem)
[![Email](https://img.shields.io/badge/Email-leemjaejun@gmail.com-EA4335?style=flat-square&logo=gmail)](mailto:leemjaejun@gmail.com)
