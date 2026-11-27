# sample-screen/ — 화면 정본 열한 장 (학생에게 «건네는» 자료)

Ch.01 에서 학생이 `workspace/` 안에 통째로 넣는 폴더다. `CLAUDE.md` 가 이 파일 이름들을
부르고, **각 장의 프롬프트도 그 장이 만들 화면의 PNG 를 콕 집어 부른다** — 클로드 코드가
**이 이미지를 먼저 열어 보고 그대로** 만든다. 그래서 학생마다 스타일과 배치가 갈리지 않는다.

| 파일 | 화면 | 누구로 | 만드는 장 |
|---|---|---|---|
| `login.png` | 로그인 (`/login`) | 로그인 전 | 02 |
| `signup.png` | 회원가입 · 초대 코드 (`/signup`) | 로그인 전 | 03 |
| `admin-invites.png` | 초대 코드 발급 (`/admin/invites`) | 박지수(관리자) | 03 |
| `admin-approve.png` | 가입 승인 (`/admin`) | 박지수(관리자) | 03 |
| `home.png` | 홈 (`/home`) | 이서연(구성원) | 04 |
| `notices.png` | 게시판 목록 (`/notices`) | 이서연 | 04 |
| `notice-detail.png` | 글 하나 (`/notices/n1`) | 이서연 | 04 |
| `directory.png` | 조직도 (`/directory`) | 이서연 | 05 |
| `attendance.png` | 근태 (`/attendance`) | 이서연 | 06 |
| `leave.png` | 휴가 신청 (`/leave`) | 이서연 | 06 |
| `admin-members.png` | 구성원 관리 (`/admin/members`) | 박지수(관리자) | 07 |

## 어떻게 찍었나 (지어낸 것 없음)

완성본을 `_verify/` 에 올려 **실제로 띄우고**(Next.js 16 Turbopack · dev)
`_screens/_hrshotset.mjs` 로 CDP 캡처했다. 뷰포트 **1440×900** · 로그인은 `ws_demo_user` 쿠키로 심었고,
경로마다 `location.pathname` 을 읽어 **그 화면이 맞는지 값으로 확인**한 뒤 찍었다(쿠키가 안 먹으면
조용히 `/login` 으로 돌아간다).

**★ 데모 모드 배너만 «캡처용 스크래치 판»에서 뺐다.** `.env.local` 이 없으면 `(ws)/layout.tsx` 가
본문 맨 위에 회색 띠를 까는데, 교재는 **Supabase 를 정본으로** 가르치므로 그 상태의 화면을 정본으로
둔다(04~07 의 연출 SVG 도 배너를 안 그린다). 답지 소스(`code/app`)는 건드리지 않았다.

**★ 다시 찍는 법**

    # ① 답지를 _verify 에 올리고 띄운다 (배너를 뺀 스크래치 판으로)
    cd _verify && npx next dev -p 3411
    # ② 찍는다
    node _screens/_hrshotset.mjs http://127.0.0.1:3411 sample-screen

찍고 나서 `python _studentcode.py` 를 돌리면 `student-code/01~09` 에 이 폴더가 다시 실린다.
