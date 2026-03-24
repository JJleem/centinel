# Centinel

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Claude API](https://img.shields.io/badge/Claude_API-claude--sonnet--4--20250514-D97757?style=flat-square&logo=anthropic)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel)](https://centinel.vercel.app)

> **Cent**inel — *Supercent* + *Sentinel*. 경쟁 게임 시장을 감시하고, 즉시 액션으로 전환합니다.

슈퍼센트 AI 애플리케이션 엔지니어 과제전형 결과물입니다.
Google Play 실시간 데이터 수집 → Claude AI 3단계 분석 → 광고 소재 5종 즉시 생성까지 원스톱 파이프라인을 구현했습니다.

---

## 📌 프로젝트 소개

하이퍼 캐주얼 게임 시장에서 UA(User Acquisition) 담당자가 경쟁사 트렌드를 파악하고 광고 소재를 기획하는 데는 상당한 시간이 소요됩니다. Centinel은 이 과정을 완전 자동화합니다.

- 장르명·경쟁사명 하나만 입력하면 Google Play 데이터를 실시간 수집
- Claude AI가 트렌드 분석 → 인사이트 요약 → 광고 카피 생성을 순차 실행
- 결과를 PDF로 저장하거나 히스토리에서 재열람 가능

---

## 🎯 핵심 기능

| 기능 | 설명 |
|------|------|
| 실시간 데이터 수집 | `google-play-scraper`로 Google Play 인기 게임 즉시 수집 |
| 3단계 AI 파이프라인 | 트렌드 분석가 → 인사이트 요약가 → 광고 카피라이터 순차 실행 |
| SSE 스트리밍 로딩 | Server-Sent Events로 각 단계 진행 상태 실시간 표시 |
| 광고 소재 5종 생성 | 흥분 / 도전 / 호기심 / FOMO / 단순함 5가지 톤 카피 |
| EN / KO 언어 토글 | 분석 결과 언어 전환 (영문/한국어) |
| 분석 히스토리 | localStorage 기반 최근 10건 저장 및 재열람 |
| PDF 다운로드 | `window.print()` + `@media print` 기반 PDF 저장 |
| Fallback 안전장치 | 스크래핑 실패 시 검증된 fallback 데이터 자동 적용 |

---

## 🏗 아키텍처

```
사용자 입력 (장르 / 경쟁사)
        │
        ▼
[/api/scrape]  ──────────────────────────────────────────
google-play-scraper 실시간 수집          실패 / 결과 < 3건
        │                                       │
        │                               fallback.json 적용
        ▼                                       │
   게임 데이터 ◄──────────────────────────────────┘
        │
        ▼
[/api/analyze]  SSE 스트리밍
        │
        ├─ Step 1 │ 트렌드 분석가      → 장르 트렌드, 메카닉, 키워드 추출
        │
        ├─ Step 2 │ 인사이트 요약가    → 핵심 인사이트 5줄 + 시장 기회
        │
        └─ Step 3 │ 광고 카피라이터    → 5가지 톤 광고 소재 생성
                │
                ▼
        결과 페이지 (/result)
        TrendCard + AdCopyCard + GameGrid + PDF 저장
```

---

## 🛠 Tech Stack

| 역할 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS v4 |
| AI | Claude API `claude-sonnet-4-20250514` |
| 데이터 수집 | `google-play-scraper` |
| 스트리밍 | Server-Sent Events (ReadableStream) |
| 배포 | Vercel |
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
```

```bash
npm run dev
# http://localhost:3000
```

---

## 🔐 환경변수

| 변수명 | 설명 |
|--------|------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API 키 |

---

## ⚠️ 주의사항

- Claude API 키가 없으면 분석 기능이 동작하지 않습니다.
- `google-play-scraper` 요청 실패 또는 결과가 3건 미만이면 fallback 데이터가 자동 적용되며, 결과 화면에 경고 배너가 표시됩니다.
- 실제 서비스 전환 시 Rate Limiting 및 캐싱 레이어 적용이 필요합니다.

---

## 👤 만든 사람

**임재준**

[![Portfolio](https://img.shields.io/badge/Portfolio-molt--ten.vercel.app-4DAEDB?style=flat-square)](https://molt-ten.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-JJleem-181717?style=flat-square&logo=github)](https://github.com/JJleem)
[![Email](https://img.shields.io/badge/Email-leemjaejun@gmail.com-EA4335?style=flat-square&logo=gmail)](mailto:leemjaejun@gmail.com)
