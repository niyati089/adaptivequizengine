# Fix-It Plan — AdaptiveTutor

This plan addresses the bugs, gaps, and dead code found in the full-project review.
Organized into phases: fix data/correctness issues first, then tests, then cleanup,
then polish. Each item lists the problem, the fix, files touched, and how to verify.

Status legend: [ ] todo · [x] done · [~] in progress

## Status: All phases (0–4) are complete ✅

Everything in this document has been implemented and verified:
`python -m pytest -q` → **14 passed, 0 warnings**, `npm run build` → **compiles
clean**. (Test count dropped from 15 to 14 after Phase 3 removed the dead
mock `/dashboard/revision` endpoint and its test.)

## Important discovery made while executing Phase 0

The backend actually runs against a **live hosted Postgres database (Supabase)**
via `backend/.env` (gitignored, so it wasn't visible during the initial review).
That file sets `DATABASE_URL` explicitly, which always wins over the SQLite
default. This means:
- The two on-disk `sql_app.db` SQLite files were stale/legacy (only used when
  `.env` is absent). They've been consolidated into `backend/sql_app.db` as a
  correct fallback default; no real data was lost.
- The **live** Postgres DB was confirmed to have `review_schedules` = 0 rows
  despite 81 recorded `question_attempts` — direct, real-world confirmation of
  the review-persistence bug (see 1.3).
- The test suite was previously running against this **live** database with no
  isolation. Running the suite once during this review left orphaned test rows
  (`test_student@example.com`, 2 attempts) in production, which were cleaned up
  manually. This is now fixed permanently — see "0.2" below, added as a new
  item because of this discovery.

---

## Phase 0 — Data Integrity ✅ done

### 0.1 Pin the SQLite database path — [x] done
- **Problem**: `DATABASE_URL` defaulted to `sqlite:///./sql_app.db` (relative), so
  the DB file used depended on the cwd `uvicorn` was launched from. Confirmed two
  divergent DB files on disk (`sql_app.db` at repo root and `backend/sql_app.db`).
- **Fix**: `backend/app/core/config.py` now builds the default `DATABASE_URL` from
  `BACKEND_DIR` (already computed there) instead of a bare relative path, only
  falling back to it if `DATABASE_URL` isn't explicitly set. In practice
  `backend/.env` always sets `DATABASE_URL` (Postgres) so this is a correctness
  fix for the fallback/fresh-clone/CI case, not the live environment.
- **Files changed**: `backend/app/core/config.py`
- **Cleanup done**: consolidated the two stray SQLite files into
  `backend/sql_app.db` (the one with real data was kept) and deleted the
  root-level duplicate.
- **Validated**: confirmed `settings.DATABASE_URL` resolves identically
  regardless of invocation directory.

### 0.2 Isolate the test suite from the live database — [x] done (new, discovered live)
- **Problem**: `backend/tests/conftest.py` imported `app.main` directly with no
  `DATABASE_URL` override, so **pytest was running against the live Supabase
  Postgres database**. Confirmed by finding orphaned `test_student@example.com`
  rows in production left behind by a failed test run.
- **Fix**: `conftest.py` now sets `DATABASE_URL` to an isolated local SQLite file
  (`backend/tests/test_sql_app.db`) *before* `app.main` is imported, wipes it at
  the start of the session, and best-effort cleans it up afterward (tolerant of
  Windows file-lock quirks that leave the file briefly open).
- **Files changed**: `backend/tests/conftest.py`
- **Validated**: re-ran the suite; live Postgres row counts are unchanged
  before/after.

---

## Phase 1 — Critical Functional Bugs ✅ done

### 1.1 Quiz timer expiry doesn't submit the answer — [x] done
- **Problem**: In `frontend/src/app/quiz/page.tsx`, the countdown `useEffect`
  called `setSubmitted(true)` directly on timeout instead of running the submit
  flow — no attempt saved, theta never updated, no explanation shown.
- **Fix**: Extracted the submit flow into a shared `finalizeAnswer(opts?: {
  timedOut })` used by both the "Submit Answer" button and the timer. A
  `finalizeAnswerRef` (kept fresh via a no-dependency `useEffect`) is called from
  the timer's interval callback so it always sees the latest `selected` value
  and never a stale closure. A timeout now submits with `selected_option: ""`
  (counted as incorrect, matches backend semantics).
- **Files changed**: `frontend/src/app/quiz/page.tsx`
- **Validated**: `npm run build` compiles clean; logic manually traced through
  both the manual-submit and timeout code paths.

### 1.2 Student dashboard shows fully hardcoded data — [x] done
- **Problem**: `frontend/src/app/dashboard/page.tsx` never called the backend;
  all numbers/charts were static fixtures ("Hello, Simona!", fixed theta
  history, etc.) while `GET /api/analytics/me` already returns real data (and is
  correctly used on `/analytics`).
- **Fix**: Rewrote the page to fetch `getUserAnalytics()` on mount (same
  loading-state pattern as `/analytics`). Stat cards, the ability-progression
  area chart, the topic-balance radar chart, and the topic-mastery list are now
  all driven by the real response (`summary`, `theta_history`, `topic_mastery`).
  Replaced the fabricated "Day Streak" stat with "Topics Practiced" (a real
  field). Greets the actual logged-in user by name. Added an empty-state banner
  for brand-new accounts with zero attempts.
- **Files changed**: `frontend/src/app/dashboard/page.tsx`
- **Validated**: `npm run build` compiles clean; data shape matches what
  `/analytics` already consumes successfully from the same endpoint.

### 1.3 Review/spaced-repetition feature never persists — [x] done
- **Problem**: `ReviewService.schedule_review()` computed SM-2 params correctly
  but never committed them; `get_pending_reviews()` returned fully mocked data
  with a hardcoded `user_id = 1`. Confirmed live: `review_schedules` had 0 rows
  despite 81 real quiz attempts.
- **Fix**:
  - `routes/review.py` now takes a `db: Session = Depends(get_db)` and resolves
    the authenticated user from the JWT bearer token (same pattern as
    `quiz.py`'s `/submit`), falling back to an explicit `user_id` in the request
    body for unauthenticated/local use.
  - `ReviewService.schedule_review()` now queries `ReviewSchedule` by
    `(user_id, topic_id)`, updates it if found or creates it if not, and
    `db.commit()`s.
  - `ReviewService.get_pending_reviews()` now queries real
    `ReviewSchedule` rows where `next_review_date <= now()` for the resolved
    user, ordered by most overdue first.
  - Frontend's `scheduleReview()` call in `quiz/page.tsx` now also sends
    `user_id` for robustness; `ReviewRequest` type updated accordingly.
- **Files changed**: `backend/app/services/review_service.py`,
  `backend/app/api/routes/review.py`, `frontend/src/services/quizService.ts`,
  `frontend/src/app/quiz/page.tsx`
- **Validated**: new/updated backend tests in `test_review.py` cover
  create-then-update-in-place persistence and correct due/overdue filtering;
  full suite passes.

### 1.4 `/quiz/results` was orphaned and fully mocked — [x] done
- **Problem**: The quiz never terminated or routed to a results page; the page
  itself showed fixed fake data unrelated to any session actually played.
- **Fix**:
  - `quiz/page.tsx` now ends the session after `TOTAL_QUESTIONS` (12, matching
    the existing "Question X of 12" progress UI) and navigates to
    `/quiz/results` with the real session summary as query params: topic,
    subtopic, correct/total, starting/ending theta, and any misconception tags
    hit along the way (collected from each `/quiz/submit` response).
  - Rewrote `quiz/results/page.tsx` to render that real data: actual score
    circle, real theta before → after progress bar, a genuine
    misconceptions-detected list (or a "clean run" message if none), and CTAs
    back into `/quiz` (same topic) and `/analytics`. Removed the fabricated
    multi-topic "Next Up" and "Performance Insights" sections that had no real
    data source.
- **Files changed**: `frontend/src/app/quiz/page.tsx`,
  `frontend/src/app/quiz/results/page.tsx`
- **Validated**: `npm run build` compiles clean, including the `useSearchParams`
  Suspense-boundary requirement.

### 1.5 Repeat-question avoidance only remembered the last question — [x] done
- **Problem**: `handleNext` called `fetchNextQuestion(theta, [q.question])`,
  discarding history each time, so the LLM's "don't repeat" list only ever had
  1 entry regardless of how far into the quiz the user was.
- **Fix**: Added an `askedQuestions` state array that accumulates every
  question's text as it's fetched; `fetchNextQuestion` now always sends the
  full accumulated list as `previous_questions` (the backend already caps this
  to the last 5 for the prompt).
- **Files changed**: `frontend/src/app/quiz/page.tsx`
- **Validated**: traced logic manually; `askedQuestions` resets on `startQuiz`
  and grows on every `fetchNextQuestion` call.

---

## Phase 2 — Test Suite ✅ done

### 2.1 Fix failing educator dashboard tests — [x] done
- **Problem**: `test_educators.py::test_educator_dashboard_mock_fallback` and
  `::test_educator_dashboard_real_data` failed with 401 (endpoint requires
  `get_current_teacher` auth; tests called it unauthenticated). Additionally,
  `test_educator_dashboard_real_data` never created a `Classroom` or
  `ClassEnrollment`, so even with auth fixed it would have kept hitting the
  mock-fallback branch instead of the real-data branch it asserted against.
- **Fix**: Added a `teacher_auth_headers` fixture to `conftest.py` (registers +
  logs in a teacher, returns bearer headers). Updated both tests to pass it.
  Rewrote `test_educator_dashboard_real_data` to create a real `Classroom` +
  approved `ClassEnrollment` and attribute the seeded `QuestionAttempt` rows to
  that classroom, matching what the endpoint actually requires. Cleanup is now
  wrapped in `try/finally` so a failed assertion can't leave orphaned rows.
- **Files changed**: `backend/tests/conftest.py`, `backend/tests/test_educators.py`
- **Validated**: `python -m pytest -q` → 15 passed (was 12 passed / 2 failed).

### 2.2 Regression tests for the Phase 1 fixes — [x] done (backend); [ ] optional frontend e2e
- Added `test_review.py::test_schedule_review_persists_to_db`,
  `::test_schedule_review_updates_existing_schedule`, and
  `::test_get_pending_reviews_returns_only_overdue_schedules`, replacing the old
  tests that only asserted mocked output.
- Frontend e2e coverage (e.g. Playwright) for the timer-expiry and
  quiz→results flow is still a nice-to-have; no e2e framework exists in this
  repo yet, so it's left as optional future work rather than blocking this pass.

---

## Phase 3 — Dead Code Removal ✅ done

> **Update**: `app/orchestration/`, `app/cache/`, `frontend/src/hooks/`,
> `frontend/src/store/`, `frontend/src/components/quiz/`, and
> `frontend/src/components/educator/` were recreated (as empty dirs with a
> `.gitkeep`) per team direction — they were placeholders for planned future
> work, not truly dead. The stub *files* that used to live in them
> (`orchestration/graph.py`, `cache/redis_client.py`, `hooks/useAdaptiveQuiz.ts`,
> `store/useQuizStore.ts`, `store/useUserStore.ts`,
> `components/quiz/QuestionCard.tsx`, `components/educator/ClassMetrics.tsx`)
> remain deleted since those specific implementations were dead code; only the
> directory scaffolding was restored.

### 3.1 Backend — all done
- [x] Deleted `app/agents/explanation.py`, `app/agents/socratic.py` (stub dupes of
      `explanation_agent.py` / `socratic_agent.py`, the real ones in use).
- [x] Deleted `app/orchestration/graph.py` (empty stub; `langgraph`/`langchain` unused).
- [x] Deleted `app/services/quiz_service.py` (mock "capital of France" logic, unused).
- [x] Deleted `app/cache/redis_client.py` (empty stub; `redis` dep unused).
- [x] Deleted `app/analytics/metrics.py` (empty stub; `numpy`/`scipy` deps confirmed
      unused anywhere else and removed from `requirements.txt`).
- [x] Deleted `app/agents/question_gen.py` / `app/agents/verification.py` (unused;
      kept the existing inline Groq-calling approach in `quiz.py`/`dag.py` rather
      than adopting them, to avoid an unnecessary refactor).
- [x] Deleted `app/models/question.py` / `app/models/session_model.py`
      (`Question`, `LearningSession`) and removed them from `app/models/__init__.py`.
      The underlying `questions`/`sessions` DB tables are left in place untouched.
- [x] Also found and removed (new, discovered during cleanup): the mock
      `/dashboard/revision` endpoint (`api/routes/dashboard.py`,
      `services/dashboard_service.py`, `analytics/revision_analytics.py`,
      `schemas/dashboard.py`) and its test — confirmed unused by the frontend
      (the real dashboard now uses `/analytics/me`, per Phase 1.2) and just as
      fake as the review mock was. Deregistered from `api/router.py`.
- [x] Trimmed `requirements.txt`: removed `langchain`, `langgraph`, `redis`,
      `numpy`, `scipy` (confirmed zero imports anywhere in the codebase).
      Kept `networkx` — still genuinely used by `topic_dag.py`.
- [x] Updated `tests/conftest.py`'s `mock_groq_client` fixture to stop patching
      the now-deleted `question_gen`/`verification` agent classes.

### 3.2 Frontend — all done
- [x] Deleted `hooks/useAdaptiveQuiz.ts`, `store/useUserStore.ts`,
      `store/useQuizStore.ts` (all unused — Phase 1.4's quiz→results handoff
      ended up using query params instead of a store) and the now-empty
      `hooks/`/`store/` directories.
- [x] Deleted `components/dashboard/MasteryMap.tsx`, `components/educator/ClassMetrics.tsx`.
- [x] Deleted `components/quiz/QuestionCard.tsx` (decided not to force-adopt it
      into `quiz/page.tsx` — see 4.3 note below — to avoid regression risk on a
      page that was just fixed) and the now-empty `components/quiz/`,
      `components/educator/` directories.
- [x] Deleted scratch/leftover files: `temp_old_page.tsx`, `temp_old_page_utf8.tsx`,
      `frontend/update_page.py`, `frontend/build_output.txt`,
      `frontend/dev_stdout.log`, `frontend/dev_stderr.log`. (`dev_stdout_3001.log`
      / `dev_stderr_3001.log` were locked by a running process at cleanup time —
      safe to delete manually once that process is stopped.)
- [x] Removed now-unused `zustand` dependency from `package.json` and ran
      `npm install` to sync `package-lock.json`/`node_modules`.

---

## Phase 4 — Tech Debt / Polish ✅ done

### 4.1 Standardize Groq API key resolution — [x] done
- Added `resolve_groq_api_key(explicit_key)` to `app/core/config.py` and used it
  consistently in `quiz.py` (both call sites), `dag.py`, and `educators.py`'s
  re-teaching endpoint. `dag.py` and `educators.py` now also accept an optional
  `api_key` query param, matching `quiz.py`'s existing override behavior (no
  frontend UI currently sends it, but the capability is now consistent).

### 4.2 Pydantic v2 / datetime deprecations — [x] done
- `core/config.py` and `schemas/user_schema.py` now use `model_config =
  SettingsConfigDict(...)` / `ConfigDict(...)` instead of the deprecated
  class-based `Config`.
- Added `app/core/time_utils.py::utcnow()` — a drop-in, non-deprecated
  replacement for `datetime.utcnow()` that stays naive/UTC (avoids introducing
  aware-vs-naive datetime comparison bugs against existing DB columns/data).
  Applied it in `models/attempt.py`, `models/classroom.py`,
  `models/misconception.py`, `models/review.py`, `repetition/sm2_scheduler.py`,
  `services/review_service.py`, `core/security.py`,
  `api/endpoints/classes.py`, and `tests/test_review.py`.
- Result: `python -m pytest -q` now reports **zero warnings** (was 20).

### 4.3 Break up `quiz/page.tsx` — [ ] skipped (deliberate)
- Decided against this optional refactor for now: `quiz/page.tsx` was just
  carefully fixed (timer bug, history tracking, results hand-off) and a large
  structural refactor purely for line-count/readability carries regression risk
  disproportionate to the benefit. `QuestionCard.tsx` was deleted instead (see
  3.2). Can revisit later as a standalone, low-stakes refactor.

### 4.4 Startup side effects — [x] done (with an extra fix found along the way)
- `main.py` now uses a proper `lifespan` context manager (the modern
  non-deprecated replacement for `@app.on_event("startup")`) to run
  `Base.metadata.create_all`, the `question_attempts` column migration, and
  misconception tag seeding, instead of running them as import-time side effects.
- **Caught during validation**: `backend/tests/conftest.py`'s `client` fixture
  called `TestClient(app)` without entering it as a context manager, which
  meant lifespan/startup events never fired — this would have silently broken
  every DB-backed test ("no such table") the moment this change landed. Fixed
  by (a) using `with TestClient(app) as test_client: yield test_client`, and
  (b) adding a session-scoped `_setup_test_database` autouse fixture that
  creates tables + seeds tags once up front, so tests that talk to the DB
  directly via `SessionLocal` (never touching `TestClient`) aren't dependent on
  test execution order for a schema to exist.
- Verified against a real `uvicorn` process too (not just `TestClient`): server
  boots, `/` and an authenticated-only endpoint both respond correctly.

### 4.5 `MisconceptionAnalyzer()` without a `db` — [x] done
- Both call sites in `educators.py` now construct `MisconceptionAnalyzer(db=db)`
  instead of `MisconceptionAnalyzer()`.

### 4.6 Shared JWT-user-resolution helper — [x] done
- Added `resolve_user_id_from_token(db, token, explicit_user_id)` to
  `app/api/endpoints/users.py`. `quiz.py`'s `/submit` and `routes/review.py`
  both now call this shared helper instead of each having their own inline
  copy of the "decode JWT → look up User, else fall back" logic.

---

## Final Validation

- `cd backend && python -m pytest -q` → **14 passed, 0 warnings**
- `cd frontend && npm run build` → compiles clean, all 10 routes generated
- Verified live: real `uvicorn` boot + HTTP requests against `app.main:app`
- Verified the isolated test DB is fully decoupled from the live Postgres DB
  (row counts unchanged across multiple full test-suite runs)
- Diagnostics swept across all changed files: clean (remaining diagnostic
  noise is pre-existing Python-interpreter-path warnings from the language
  server affecting the whole backend, unrelated to these changes)
