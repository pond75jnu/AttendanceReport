# AttendanceReport 기술 노트

작성일: 2026-07-03  
대상 저장소: `C:\MyApps\AttendanceReport`  
앱 루트: `attendance-report/`

이 문서는 현재 코드 기준으로 유지보수를 바로 시작하기 위한 기술 노트다. 실제 실행 가능한 React/Vite 앱은 저장소 루트가 아니라 `attendance-report/` 아래에 있다.

## 1. 한눈에 보는 프로젝트

이 앱은 UBF 광주3부 요회별 주간 보고서를 입력, 조회, 수정, 인쇄하는 웹앱이다.

핵심 기능은 다음과 같다.

- Supabase Auth 이메일/비밀번호 로그인
- 요회(`yohoe`) 관리: 이름, 목자, 리더 수, 표시 순서
- 주간 보고서(`reports`) 작성 및 수정
- 주간 현황표: 금주/지난주 비교, 요회별 명단, 최근 5주 추이
- 말씀 주제(`weekly_themes`) 저장
- A4 인쇄/PDF용 13열 x 53행 격자 보고서 생성
- 최근 참석자 추이 차트

기술 스택은 React 19, Vite 7, React Router 7, Tailwind CSS 3, Supabase JS 2, Chart.js, `html2canvas`, `jspdf`, `xlsx`다.

## 2. 실행과 검증

작업 위치는 `attendance-report/`다.

```powershell
cd C:\MyApps\AttendanceReport\attendance-report
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

스크립트는 `attendance-report/package.json`에 있다.

| 명령 | 의미 |
| --- | --- |
| `npm run dev` | Vite 개발 서버 실행. 기본 URL은 `http://localhost:5173` |
| `npm run lint` | ESLint flat config 실행 |
| `npm run build` | `dist/` 프로덕션 번들 생성 |
| `npm run preview` | 빌드 결과 미리보기 |

현재 `package.json`에는 자동 테스트 스크립트가 없다. 저장소 가이드에는 `attendance-report/howtotest.md`를 유지하라고 되어 있지만, 현재 해당 파일은 없다. 기능 변경 시 이 파일을 새로 만들고 수동 QA 체크리스트를 남기는 것이 필요하다.

## 3. 디렉터리 구조

```text
C:\MyApps\AttendanceReport
├─ AGENTS.md
├─ readme.md
├─ package-lock.json                 # 루트 잠금 파일. 실제 앱 잠금 파일은 별도 존재
├─ doc/
│  └─ tech_note.md                    # 이 문서
└─ attendance-report/
   ├─ package.json
   ├─ package-lock.json
   ├─ vite.config.js
   ├─ tailwind.config.js
   ├─ eslint.config.js
   ├─ index.html
   ├─ public/
   │  ├─ print.css
   │  ├─ template.xlsx
   │  └─ vite.svg
   └─ src/
      ├─ App.jsx
      ├─ main.jsx
      ├─ index.css
      ├─ supabaseClient.js            # 중복 파일. 현재 import 사용처 없음
      ├─ lib/
      │  ├─ supabaseClient.js          # 실제 사용되는 Supabase 클라이언트
      │  ├─ dateUtils.js
      │  └─ reportUtils.js
      ├─ pages/
      │  ├─ LoginPage.jsx
      │  ├─ DashboardPage.jsx
      │  ├─ ReportPage.jsx
      │  ├─ ReportDetailPage.jsx
      │  └─ ProfilePage.jsx
      └─ components/
         ├─ WeeklyReportView.jsx       # 핵심 주간 현황표
         ├─ ReportDetailModal.jsx      # 현황표 내 보고서 신규/수정/삭제 모달
         ├─ YohoeModal.jsx
         ├─ WeeklyThemeModal.jsx
         ├─ DashboardChart.jsx
         ├─ Exact13x53Grid.jsx         # 현재 연결된 인쇄/PDF 컴포넌트
         └─ 기타 과거 출력 실험 컴포넌트들
```

SQL 마이그레이션 또는 RLS 정책 파일은 현재 루트와 앱 폴더 어디에도 없다. DB 변경을 하면 반드시 `.sql` 파일을 추가해야 유지보수가 가능하다.

## 4. 애플리케이션 부트스트랩과 라우팅

진입점은 `src/main.jsx`이고, `StrictMode`로 `App`을 렌더링한다.

`src/App.jsx`는 Supabase Auth 세션을 읽고 라우트를 보호한다.

| 경로 | 컴포넌트 | 인증 필요 | 설명 |
| --- | --- | --- | --- |
| `/login` | `LoginPage` | 아니오 | 이메일/비밀번호 로그인 |
| `/` | `DashboardPage` | 예 | 메인 대시보드 |
| `/report/new` | `ReportPage` | 예 | 현재 주간 보고서 작성 |
| `/report/:reportId` | `ReportDetailPage` | 예 | 독립 상세 페이지. 현재 대시보드는 주로 모달을 사용 |
| `/profile` | `ProfilePage` | 예 | 비밀번호 변경. 대시보드 링크는 `display: none`으로 숨겨져 있음 |

인증 흐름:

- 앱 시작 시 `supabase.auth.getSession()`으로 현재 세션 확인
- `supabase.auth.onAuthStateChange()`로 로그인/로그아웃 상태 반영
- 로그인은 `signInWithPassword`
- 로그아웃은 `signOut`
- 비밀번호 변경은 `updateUser({ password })`

## 5. Supabase 연결과 보안 상태

실제 import는 `src/lib/supabaseClient.js`를 사용한다.

```js
import { createClient } from '@supabase/supabase-js'
```

현재 Supabase URL과 anon key가 코드에 하드코딩되어 있다. anon key 자체는 공개 클라이언트 키 성격이지만, 저장소 가이드에는 Vite 환경 변수 사용을 요구한다. 유지보수 시 다음 형태로 바꾸는 것이 좋다.

```js
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

주의할 점:

- `src/supabaseClient.js`에도 같은 클라이언트가 중복 정의되어 있지만 현재 사용처는 없다.
- `.env*` 파일은 커밋하지 않는다.
- RLS 정책은 코드로 관리되어야 하지만 현재 SQL 파일이 없다.

## 6. 데이터 모델

아래 스키마는 코드 사용처에서 역추적한 것이다. 실제 Supabase 콘솔 스키마와 반드시 대조해야 한다.

### 6.1 `yohoe`

요회 마스터 테이블.

| 컬럼 | 코드상 타입/용도 | 사용처 |
| --- | --- | --- |
| `id` | PK. UUID 추정 | 모든 보고서가 FK처럼 참조 |
| `name` | 요회명 | 대시보드, 출력, 선택 목록 |
| `shepherd` | 요회목자 | 요회 표시 및 출력 |
| `leader_count` | 리더 총수 | 리더 수 검증, 인쇄 총계 계산 |
| `order_num` | 표시 순서. null 가능 | 요회 정렬 |
| `created_at` | 생성 시각 | `order_num` 동률/누락 시 보조 정렬 |

정렬 규칙:

```text
order_num ASC nulls last, created_at ASC
```

`YohoeModal`에서 `leader_count`는 문자열 상태값 그대로 저장된다. DB numeric 컬럼이면 Supabase/Postgres가 캐스팅할 수 있지만, 명시적으로 `parseInt`하지 않는 점은 유지보수 시 확인이 필요하다. `order_num`만 `parseInt`한다.

### 6.2 `reports`

요회별 주간 출석 보고서.

| 컬럼 | 의미 |
| --- | --- |
| `id` | PK |
| `yohoe_id` | `yohoe.id` 참조 |
| `report_date` | 주일 날짜 문자열. 코드 기준 `YYYY-MM-DD` |
| `attended_leaders_count` | 참석 리더 수 |
| `attended_leaders_names` | 참석 리더 이름. 작성 페이지/독립 상세 페이지에는 있으나 현황표 모달에는 없음 |
| `absent_leaders_count` | 불참 리더 수 |
| `absent_leaders_names` | 불참 리더 이름 |
| `attended_graduates_count` | 학사양 참석 수 |
| `attended_graduates_names` | 학사양 참석자 이름 |
| `attended_students_count` | 재학생양 참석 수 |
| `attended_students_names` | 재학생양 참석자 이름 |
| `attended_freshmen_count` | 신입생양 참석 수 |
| `attended_freshmen_names` | 신입생양 참석자 이름 |
| `attended_others_count` | 기타 참석 수 |
| `attended_others_names` | 기타 참석자 이름 |
| `one_to_one_count` | 1대1 수 |
| `created_at` | 생성 시각. 출력에서 최신 보고서 선택 보조값 |
| `updated_at` | 수정 시각. 출력에서 최신 보고서 선택 보조값 |

중요한 제약 추정:

- `(yohoe_id, report_date)`는 사실상 유니크여야 한다.
- `ReportPage`는 저장 전 같은 `yohoe_id/report_date` 레코드를 삭제한 뒤 새로 삽입한다.
- `ReportDetailModal`은 기존 `id`가 있으면 update, 없으면 insert한다.
- DB에 유니크 제약이 없으면 중복 데이터가 생길 수 있고, 화면/출력 컴포넌트마다 중복 처리 방식이 달라질 수 있다.

### 6.3 `weekly_themes`

주간 말씀 주제.

| 컬럼 | 의미 |
| --- | --- |
| `week_date` | 해당 주의 주일 날짜. `YYYY-MM-DD` |
| `theme` | 말씀 주제 문자열. 입력 UI는 최대 100자 |

`WeeklyThemeModal`은 `upsert({ week_date, theme }, { onConflict: 'week_date' })`를 사용한다. 따라서 `weekly_themes.week_date`에는 unique 제약이 있어야 한다.

## 7. 날짜와 KST 처리

날짜 유틸은 `src/lib/dateUtils.js`에 있다.

핵심 원칙:

- 날짜 키는 `YYYY-MM-DD`
- 기준 시간대는 KST(UTC+09:00)
- 주간 기준일은 일요일

주요 함수:

| 함수 | 설명 |
| --- | --- |
| `formatDateToKSTString(value)` | 입력 날짜를 KST 날짜 문자열로 변환 |
| `normalizeKSTDateString(value)` | 문자열/Date/number를 `YYYY-MM-DD`로 정규화 |
| `getKSTDateParts(value)` | `{ year, month, day }` 반환 |
| `createDateFromKSTString(value)` | `YYYY-MM-DDT00:00:00+09:00` Date 생성 |
| `getSundayOfWeekKST(value)` | 해당 날짜가 속한 주의 KST 일요일 반환 |
| `getWeekRangeKST(value)` | `{ start, end, sunday }` 반환 |
| `addDaysToKSTDate(value, days)` | KST 날짜 기준 일수 이동 |
| `isNowWithinKSTWeek(sundayDateString)` | 현재 시각이 해당 일요일~토요일 범위인지 확인 |
| `formatKSTDateHuman(value)` | `YYYY년 M월 D일` 형식 |

주의:

- 대부분의 핵심 화면은 `dateUtils.js`를 쓰지만 `WeeklyThemeModal`은 자체 `getSundayOfWeek` 함수를 사용한다. 이 함수는 브라우저 로컬 시간대 기반이다. 사용자가 한국이 아닌 시간대에서 접근할 가능성이 있으면 KST 유틸로 통일하는 것이 안전하다.
- `Exact13x53Grid`도 내부에서 `new Date('YYYY-MM-DD')`를 직접 사용한다. 이 형식은 브라우저에서 UTC로 해석될 수 있어 월/일 경계 이슈가 생길 수 있다.

## 8. 핵심 업무 흐름

### 8.1 로그인

`LoginPage.jsx`

1. 사용자가 이메일/비밀번호 입력
2. `supabase.auth.signInWithPassword({ email, password })`
3. 성공 시 `/`로 이동
4. 실패 시 `alert`

### 8.2 대시보드 로딩

`DashboardPage.jsx`

초기/새로고침 시 다음 두 데이터를 가져온다.

- `yohoe`: 전체 요회 목록
- `reports`: 최근 35일 이후 보고서, `yohoe(name, order_num)` join 포함

보고서 목록 정렬:

1. `report_date` 최신순
2. 같은 날짜면 `yohoe.order_num` 오름차순
3. `order_num`이 null이면 뒤로

대시보드 주요 상태:

| 상태 | 의미 |
| --- | --- |
| `yohoes` | 요회 목록 |
| `reports` | 최근 35일 보고서 |
| `selectedWeekDate` | 주간 현황표와 인쇄 대상 주 |
| `showSamplePDFExport` | `Exact13x53Grid` 출력 시작 여부 |
| `isChartExpanded` | 차트 섹션 펼침 |
| `isReportsExpanded` | 입력 목록 펼침 |
| `isYohoeExpanded` | 요회 관리 펼침 |

주의:

- `WeeklyReportView`는 자체적으로 선택 주 기준 6주치 데이터를 다시 조회한다.
- 인쇄 버튼은 `DashboardPage`의 `reports` 상태를 `Exact13x53Grid`에 넘긴다.
- `DashboardPage`의 `reports`는 항상 “오늘 기준 최근 35일”이므로, 사용자가 주간 현황표에서 5주보다 오래된 과거 주를 선택한 뒤 인쇄하면 출력 데이터가 비거나 부족할 수 있다.

### 8.3 보고서 작성

`ReportPage.jsx`

보고서 작성은 현재 KST 주의 일요일만 대상으로 한다.

초기 report state:

```js
{
  report_date: getSundayOfWeekKST(),
  yohoe_id: '',
  attended_leaders_count: 0,
  attended_leaders_names: '',
  absent_leaders_count: 0,
  absent_leaders_names: '',
  attended_graduates_count: 0,
  attended_graduates_names: '',
  attended_students_count: 0,
  attended_students_names: '',
  attended_freshmen_count: 0,
  attended_freshmen_names: '',
  attended_others_count: 0,
  attended_others_names: '',
  one_to_one_count: 0
}
```

저장 전 검증:

1. 현재 시각이 해당 주일~토요일 범위인지 확인
2. `attended_leaders_count + absent_leaders_count === selectedYohoe.leader_count` 확인

저장 방식:

1. 현재 KST 주일을 다시 계산
2. 같은 `yohoe_id/report_date` 기존 보고서 삭제
3. 새 보고서 insert
4. 성공 시 대시보드로 이동

이전 주 데이터 불러오기:

- 선택된 요회의 이전 주일 보고서를 조회한다.
- 있으면 참석/불참/양/기타/1대1 필드를 현재 폼에 채운다.
- `report_date`와 `yohoe_id`는 유지한다.

### 8.4 주간 현황표

`WeeklyReportView.jsx`

대시보드 중앙의 핵심 컴포넌트다. 선택 주간의 금주/지난주 데이터를 요회별로 보여주고, 최근 5주 집계를 함께 표시한다.

데이터 조회:

1. `currentViewDate` 기준으로 6개 주간 범위 생성
   - `weeks[0]`: 선택 주
   - `weeks[1]`: 1주 전
   - ...
   - `weeks[5]`: 5주 전
2. `yohoe` 전체 조회
3. `reports`를 `weeks[5].start`부터 `weeks[0].end`까지 조회
4. 요회별로 선택 주/지난주 보고서 매핑
5. 1~5주 전 전체 집계 생성

화면 집계식:

```text
총 참석자 = attended_leaders_count
          + attended_graduates_count
          + attended_students_count
          + attended_freshmen_count
          + attended_others_count

양 = attended_graduates_count
   + attended_students_count
   + attended_freshmen_count
```

모바일과 데스크톱 렌더링은 분리되어 있다.

- 모바일: `MobileSummary`, `MobileCard`
- 데스크톱: `ReportRow`, `TotalsRow`, `HistoricalSummary`

상호작용:

- 요회명 클릭: `YohoeModal`로 요회 수정
- 보고서 수정 클릭: `ReportDetailModal`
- 말씀 주제 설정 아이콘 클릭: `WeeklyThemeModal`
- 과거 기록보기: 미니 캘린더 표시

미니 캘린더:

- `reports.report_date` 전체를 가져와 `availableDates`에 저장한다.
- 일요일이고 보고서가 있는 날짜를 파란색으로 표시한다.
- 현재 구현은 보고서가 없는 날짜도 클릭 자체는 가능하다. 클릭하면 해당 날짜 기준 주간으로 이동한다.

### 8.5 현황표 내 보고서 수정/신규 입력

`ReportDetailModal.jsx`

이 모달은 두 모드로 동작한다.

| 상황 | 동작 |
| --- | --- |
| `reportId` 있음 | 기존 보고서 조회 후 수정/삭제 |
| `reportId` 없음 + `yohoeInfo/reportDate` 있음 | 빈 보고서를 만들어 바로 편집 모드 진입, 저장 시 insert |

저장 payload:

```js
{
  yohoe_id,
  report_date,
  attended_leaders_count,
  absent_leaders_count,
  attended_graduates_count,
  attended_students_count,
  attended_freshmen_count,
  attended_others_count,
  one_to_one_count,
  attended_graduates_names,
  attended_students_names,
  attended_freshmen_names,
  attended_others_names,
  absent_leaders_names
}
```

주의:

- `attended_leaders_names`는 이 모달에서 편집하거나 저장 payload에 포함하지 않는다.
- `ReportPage`와 달리 리더 수 합계 검증을 하지 않는다.
- 신규 insert 시 같은 `yohoe_id/report_date` 기존 레코드 확인 또는 upsert를 하지 않는다. DB 유니크 제약이 없으면 중복 보고서가 생길 수 있다.

### 8.6 말씀 주제

`WeeklyThemeModal.jsx`

- 모달 열림 시 해당 주일의 `weekly_themes.theme` 조회
- 저장 시 `week_date` 기준 upsert
- 비어 있는 주제는 저장하지 않음
- 표시 기본값은 화면에서는 `-`, 인쇄에서는 `"여호와, 인자와 진실이 많으신 하나님"` fallback을 사용한다.

### 8.7 요회 관리

`YohoeModal.jsx`

- 대시보드 요회 관리 섹션과 주간 현황표 요회명 클릭에서 사용된다.
- 새 요회 추가 또는 기존 요회 수정
- 필드: `name`, `shepherd`, `leader_count`, `order_num`
- 수정 후 부모 콜백으로 목록 또는 현황표를 갱신한다.

요회 삭제는 `DashboardPage`에서 직접 처리한다.

- `supabase.from('yohoe').delete().match({ id })`
- 확인창 문구는 “보고서 데이터도 함께 삭제됩니다”라고 되어 있다.
- 실제로 보고서가 같이 삭제되는지는 DB FK cascade 설정에 달려 있다. SQL 스키마가 없어서 코드만으로 보장할 수 없다.

### 8.8 참석자 추이 차트

`DashboardChart.jsx`

- `DashboardPage`가 가져온 최근 35일 보고서를 입력으로 받는다.
- `report.report_date` 기준 주일로 묶는다.
- 최근 5주만 표시한다.

차트 집계식:

```text
총 참석자 = attended_leaders_count
          + attended_graduates_count
          + attended_students_count
          + attended_freshmen_count
```

주의: 차트는 `attended_others_count`를 더하지 않는다. 주간 현황표와 계산식이 다르다.

### 8.9 인쇄/PDF 출력

현재 대시보드의 “보고서 인쇄” 버튼은 `Exact13x53Grid.jsx`를 사용한다.

출력 흐름:

1. `DashboardPage.handleExportSamplePDF()`가 선택 주의 주일을 계산
2. `weekly_themes`에서 해당 주제 조회
3. `{ reports, weekInfo, yohoeList, weeklyTheme }`를 `Exact13x53Grid`로 전달
4. `Exact13x53Grid`가 13열 x 53행 HTML 테이블 문자열 생성
5. 데스크톱은 숨겨진 iframe에 HTML을 쓰고 `print()`
6. 모바일은 미리보기 iframe을 보여준 뒤 `html2canvas` + `jspdf`로 PDF blob 생성

출력 파일명:

```text
report_YYYYMMDD_YYYYMMDDHHMMSS.pdf
```

인쇄 집계식:

```text
총 참석자 = yohoe.leader_count
          + attended_graduates_count
          + attended_students_count
          + attended_freshmen_count
          + attended_others_count
          - absent_leaders_count

양 = attended_graduates_count
   + attended_students_count
   + attended_freshmen_count
```

주의:

- 인쇄 총계는 화면 총계와 다르다. 리더 참석 수를 `attended_leaders_count`가 아니라 `leader_count - absent_leaders_count`로 계산한다.
- `ReportPage`에서 리더 수 검증을 통과한 데이터라면 두 계산식은 같아야 한다.
- `ReportDetailModal`에서는 리더 수 검증이 없어 계산식 차이가 실제 차이로 드러날 수 있다.
- `Exact13x53Grid`는 현재 전달받은 `reports` 배열 안에서만 현재/지난주/과거추이를 만든다. 대시보드의 `reports`가 최근 35일뿐이라 오래된 과거 주 출력은 부정확할 수 있다.

기타 출력 컴포넌트:

| 컴포넌트 | 상태 |
| --- | --- |
| `PDFPrintView` | import와 렌더 조건은 남아 있으나 대시보드의 기존 PDF 버튼이 주석 처리되어 사실상 비활성 |
| `ExcelExport` | 현재 직접 사용처 없음. `template.xlsx`를 읽어 XLSX 파일 생성하는 코드 |
| `ExcelToPDFExport` | 현재 직접 사용처 없음 |
| `Exact13x44Grid`, `ExactGridReport`, `ExactSamplePDF`, `GridBasedReport`, `HTMLPrintReport`, `PerfectSamplePDF`, `PixelPerfectReport`, `PDFReportView` | 과거 출력 실험/대안으로 보이며 현재 앱 라우트에서 직접 사용되지 않음 |

## 9. 집계식 차이 요약

현재 코드에는 같은 “총 참석자”라도 위치별 계산식이 다르다.

| 위치 | 기타 포함 | 리더 계산 | 공식 |
| --- | --- | --- | --- |
| `WeeklyReportView` | 포함 | `attended_leaders_count` | 참석리더 + 학사양 + 재학생양 + 신입생 + 기타 |
| `Exact13x53Grid` | 포함 | `leader_count - absent_leaders_count` | 리더총수 - 불참리더 + 학사양 + 재학생양 + 신입생 + 기타 |
| `DashboardChart` | 미포함 | `attended_leaders_count` | 참석리더 + 학사양 + 재학생양 + 신입생 |
| 구형 출력 컴포넌트 다수 | 대체로 미포함 또는 파일별 상이 | 대체로 `leader_count - absent` | 파일별 확인 필요 |

유지보수 권장:

1. 공통 집계 유틸을 `src/lib/reportTotals.js` 같은 파일로 분리한다.
2. 화면, 차트, 출력이 같은 정책을 쓰도록 한다.
3. “기타”를 공식 총계에 포함할지 명시적으로 결정한다.
4. 리더 참석 수의 기준을 `attended_leaders_count`로 할지 `leader_count - absent`로 할지 통일한다.

## 10. 스타일과 출력 CSS

Tailwind 설정은 `tailwind.config.js`에 있으며 `Noto Sans KR`을 sans 폰트에 추가한다.

글로벌 CSS:

- `src/index.css`: Tailwind import와 인쇄용 전역 스타일
- `public/print.css`: `index.html`에서 `media="print"`로 로드

주의:

- 인쇄용 스타일이 `src/index.css`와 `public/print.css`에 중복되어 있다.
- `public/print.css`에는 `button:contains("수정")` 같은 표준 CSS가 아닌 선택자가 있다. 브라우저 CSS에서는 `:contains()`가 유효하지 않다.
- `Exact13x53Grid`는 별도 HTML 문자열 내부에 자체 CSS를 생성하므로, 앱 전역 CSS와 독립적으로 동작한다.

## 11. 현재 발견된 유지보수 리스크

우선순위가 높은 순서다.

1. Supabase URL/anon key가 코드에 하드코딩되어 있다.
2. DB 스키마와 RLS 정책 SQL 파일이 없다.
3. `reports`의 `(yohoe_id, report_date)` 유니크 보장이 코드만으로는 불명확하다.
4. `ReportPage`, `ReportDetailModal`, 출력 컴포넌트 간 리더 수 검증과 총계 계산식이 다르다.
5. 대시보드 인쇄는 `DashboardPage`의 최근 35일 보고서만 사용해 오래된 선택 주 출력이 틀릴 수 있다.
6. `howtotest.md`가 없다.
7. `src/lib/supabaseClient.js`와 `src/supabaseClient.js`가 중복되어 있다.
8. 사용하지 않는 출력 컴포넌트가 많아 실제 운영 경로를 파악하기 어렵다.
9. `WeeklyThemeModal`과 `Exact13x53Grid` 일부 날짜 계산이 KST 유틸과 통일되어 있지 않다.
10. `public/print.css`에 비표준 `:contains()` 선택자가 있다.
11. `DashboardPage`의 프로필 링크가 숨겨져 있으나 라우트와 페이지는 남아 있다.
12. 많은 사용자 피드백이 `alert`, `confirm`, `console.log`에 의존한다.

## 12. 변경 작업별 가이드

### 새 보고서 필드를 추가할 때

1. Supabase 컬럼 추가 SQL 작성
2. `ReportPage` 초기 state와 입력 UI 수정
3. `loadPreviousData` 복사 필드에 추가
4. `ReportDetailModal.createEmptyReport`와 저장 payload 수정
5. `ReportDetailPage`가 아직 필요하면 상세/수정 UI 수정
6. `WeeklyReportView` 표시 및 총계 수정
7. `Exact13x53Grid` 출력 HTML과 총계 수정
8. 필요하면 `DashboardChart` 집계 수정
9. `howtotest.md`에 수동 검증 추가

### 요회 정렬 정책을 바꿀 때

수정 위치:

- `DashboardPage.fetchYohoes`
- `DashboardPage.sortYohoes`
- `ReportPage.fetchYohoes`
- `WeeklyReportView` 내부 `yohoe` 조회 두 곳

현재 네 곳이 같은 정렬을 중복 구현한다. 공통 조회 함수로 묶으면 좋다.

### 인쇄 레이아웃을 바꿀 때

현재 실제 운영 출력은 `Exact13x53Grid.jsx`다.

수정 시 확인할 것:

- A4 `@page` margin
- `grid-13x53` colgroup 13개 열 너비
- 요회별 5행 구조
- 총계 7행 구조
- 모바일 미리보기 iframe 최소 너비
- 모바일 `html2canvas` 캡처 결과와 데스크톱 `print()` 결과가 모두 정상인지

### 오래된 주간 인쇄를 고칠 때

권장 접근:

1. `DashboardPage.handleExportSamplePDF`에서 선택 주 기준 5주 전~선택 주까지 reports를 새로 조회한다.
2. 그 결과를 `Exact13x53Grid`에 전달한다.
3. `DashboardPage`의 차트/목록용 `reports` 상태와 인쇄용 데이터 의존성을 분리한다.

### 총계 계산식을 통일할 때

권장 공통 함수:

```js
export const getYangSum = (report) =>
  (report?.attended_graduates_count || 0) +
  (report?.attended_students_count || 0) +
  (report?.attended_freshmen_count || 0)

export const getAttendeeSum = (report, yohoe, { includeOthers = true, leaderMode = 'reported' } = {}) => {
  const leaders =
    leaderMode === 'masterMinusAbsent'
      ? (yohoe?.leader_count || 0) - (report?.absent_leaders_count || 0)
      : (report?.attended_leaders_count || 0)

  return leaders +
    (report?.attended_graduates_count || 0) +
    (report?.attended_students_count || 0) +
    (report?.attended_freshmen_count || 0) +
    (includeOthers ? (report?.attended_others_count || 0) : 0)
}
```

그 뒤 화면/출력/차트의 정책만 명시적으로 선택한다.

## 13. 수동 QA 체크리스트 초안

`attendance-report/howtotest.md`가 없으므로, 다음 내용을 기반으로 만들면 된다.

1. 로그인
   - 잘못된 계정으로 실패 메시지 확인
   - 정상 계정으로 대시보드 진입
2. 요회 관리
   - 새 요회 추가
   - 표시 순서 변경 후 정렬 확인
   - 리더 수 변경 후 보고서 검증 반영 확인
3. 보고서 작성
   - 현재 주 요회 선택
   - 리더 참석+불참 합계가 요회 리더 수와 다르면 저장 차단
   - 정상 저장 후 대시보드 반영
   - 이전 주 데이터 끌어오기
4. 주간 현황표
   - 금주/지난주 수치 확인
   - 요회별 명단 표시 확인
   - 과거추이 1~5주 전 합계 확인
   - 모바일 카드 레이아웃 확인
5. 현황표 모달
   - 기존 보고서 수정
   - 보고서 없는 요회/주에서 신규 등록
   - 보고서 삭제 후 표 갱신
6. 말씀 주제
   - 주제 저장
   - 대시보드 표시 확인
   - 인쇄물 표시 확인
7. 인쇄
   - 데스크톱 브라우저에서 인쇄 다이얼로그 표시
   - 파일명에 `report_YYYYMMDD_YYYYMMDDHHMMSS.pdf` 반영
   - 모바일 미리보기와 PDF 생성 확인
   - 선택 주가 오래된 경우 데이터가 맞는지 확인
8. 회귀 확인
   - `npm run lint`
   - `npm run build`
   - `npm run preview`

## 14. 빠른 파일별 책임표

| 파일 | 책임 |
| --- | --- |
| `src/App.jsx` | 인증 세션 확인, 보호 라우팅 |
| `src/pages/LoginPage.jsx` | 로그인 폼 |
| `src/pages/DashboardPage.jsx` | 메인 화면, 요회/보고서 fetch, 섹션 토글, 인쇄 시작 |
| `src/pages/ReportPage.jsx` | 현재 주 보고서 작성 전용 페이지 |
| `src/pages/ReportDetailPage.jsx` | 독립 상세/수정 페이지. 현재 주 사용 경로는 약함 |
| `src/pages/ProfilePage.jsx` | 비밀번호 변경 |
| `src/components/WeeklyReportView.jsx` | 주간 현황표, 요회별 비교, 과거 추이, 모달 연결 |
| `src/components/ReportDetailModal.jsx` | 현황표 내 보고서 신규/수정/삭제 |
| `src/components/YohoeModal.jsx` | 요회 추가/수정 |
| `src/components/WeeklyThemeModal.jsx` | 주간 말씀 주제 조회/저장 |
| `src/components/DashboardChart.jsx` | 최근 5주 참석자 추이 차트 |
| `src/components/Exact13x53Grid.jsx` | 현재 운영 인쇄/PDF 출력 |
| `src/lib/dateUtils.js` | KST 날짜 정규화와 주간 범위 계산 |
| `src/lib/reportUtils.js` | 주간 필터링 |
| `src/lib/supabaseClient.js` | 실제 Supabase 클라이언트 |
| `src/index.css` | Tailwind 및 인쇄 전역 스타일 |
| `public/print.css` | 브라우저 print 전용 스타일 |

## 15. 유지보수 시작 순서

새 담당자는 다음 순서로 보면 빠르다.

1. `attendance-report/package.json`으로 의존성과 스크립트 확인
2. `src/App.jsx`로 라우트와 인증 흐름 파악
3. `src/lib/dateUtils.js`로 날짜 기준 확인
4. `src/pages/DashboardPage.jsx`와 `src/components/WeeklyReportView.jsx`로 메인 업무 흐름 파악
5. `src/pages/ReportPage.jsx`와 `src/components/ReportDetailModal.jsx`로 저장 규칙 파악
6. `src/components/Exact13x53Grid.jsx`로 출력 규칙 파악
7. Supabase 콘솔에서 실제 테이블, FK, unique, RLS 정책 확인
8. `npm run lint`와 `npm run build`로 현 상태 확인

가장 먼저 정리하면 좋은 작업은 DB 스키마 SQL 추가, Supabase 환경 변수화, 총계 계산 공통화, `howtotest.md` 작성이다.
