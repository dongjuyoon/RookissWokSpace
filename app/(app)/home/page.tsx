import Link from "next/link";
import AppPage from "@/components/app/AppPage";
import styles from "@/components/app/app.module.css";
import { requireApprovedProfile } from "@/lib/auth";
import { checkIn, checkOut, getTodayAttendance } from "@/lib/attendance";
import { formatClock, formatDate, formatDay, greetingFor, seoulHour } from "@/lib/format";
import { listNotices } from "@/lib/notices";
import { listOnlineMembers } from "@/lib/members";
import { remainingAnnualLeave } from "@/lib/leave";

export default async function HomePage() {
  const profile = await requireApprovedProfile();
  const [notices, online, today, leave] = await Promise.all([
    listNotices(),
    listOnlineMembers(),
    getTodayAttendance(),
    remainingAnnualLeave(),
  ]);

  const now = new Date();
  const greeting = greetingFor(seoulHour(now));
  const recent = notices.slice(0, 5);
  const checkedIn = today ? formatClock(new Date(today.checkIn)) : null;
  const checkedOut = today?.checkOut ? formatClock(new Date(today.checkOut)) : null;
  const year = formatDate(now).slice(0, 4);

  return (
    <AppPage number="01" crumb="홈">
      <section className={styles.hero}>
        <p className={styles.heroDate}>
          {formatDay(now)} · {profile.department}
        </p>
        <h2 className={styles.heroTitle}>
          {greeting} <span className={styles.accent}>{profile.name}</span>님.
        </h2>
        {today && checkedOut === null && (
          <p className={styles.heroSub}>{checkedIn} 에 출근하셨어요. 오늘 하루도 고생 많으셨어요.</p>
        )}
        {today && checkedOut !== null && (
          <p className={styles.heroSub}>
            {checkedIn} 에 출근, {checkedOut} 에 퇴근하셨어요. 오늘 하루도 고생 많으셨어요.
          </p>
        )}
        <div className={styles.heroActions}>
          {today === null && (
            <form action={checkIn}>
              <button type="submit" className={styles.primaryButton}>
                ✓ 출근하기
              </button>
            </form>
          )}
          {today !== null && checkedOut === null && (
            <form action={checkOut}>
              <button type="submit" className={styles.primaryButton}>
                ✓ 퇴근하기
              </button>
            </form>
          )}
          <Link href="/notices" className={styles.secondaryButton}>
            게시판 열기
          </Link>
        </div>
      </section>

      <div className={styles.homeGrid}>
        <div>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.eyebrow}>TODAY</span>
              <Link href="/attendance" className={styles.asideLink}>
                전체 보기 →
              </Link>
            </div>
            <h2 className={styles.cardTitle}>오늘의 근태</h2>
            <div className={styles.timeRow}>
              <div className={styles.timeBlock}>
                <span className={styles.timeLabel}>출근</span>
                <span className={styles.timeValue}>{checkedIn ?? "—"}</span>
              </div>
              <div className={styles.timeBlock}>
                <span className={styles.timeLabel}>퇴근</span>
                <span className={styles.timeValue}>{checkedOut ?? "—"}</span>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.eyebrow}>최근 공지 · 게시글</span>
              <Link href="/notices" className={styles.asideLink}>
                전체 보기 →
              </Link>
            </div>
            <h2 className={styles.cardTitle}>게시판</h2>

            {recent.map((notice) => (
              <Link key={notice.id} href={`/notices/${notice.id}`} className={styles.noticeRow}>
                <div className={styles.noticeMeta}>
                  {notice.pinned && <span className={`${styles.chip} ${styles.chipPinned}`}>고정</span>}
                  <span className={styles.chip}>{notice.category}</span>
                  <span>{formatDate(notice.createdAt)}</span>
                </div>
                <span className={styles.noticeTitle}>{notice.title}</span>
                <div className={styles.noticeFoot}>댓글 {notice.commentCount}</div>
              </Link>
            ))}
          </section>
        </div>

        <div>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.eyebrow}>연차 현황 — {year}</span>
            </div>
            <h2 className={styles.cardTitle}>휴가</h2>
            <div className={styles.leaveBig}>
              {leave.remaining}
              <span className={styles.leaveBigSub}> / {leave.total}일 남음</span>
            </div>
            <div className={styles.leaveBlocks}>
              {Array.from({ length: leave.total }, (_, index) => (
                <span
                  key={index}
                  className={index < leave.remaining ? styles.leaveBlockOn : styles.leaveBlock}
                />
              ))}
            </div>
            <Link href="/leave" className={`${styles.secondaryButton} ${styles.fullWidth} ${styles.leaveApply}`}>
              + 신청하기
            </Link>
          </section>

          <aside className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.eyebrow}>TEAM · ONLINE NOW</span>
              <span className={styles.onlineCount}>● {online.length}</span>
            </div>
            <h2 className={styles.cardTitle}>지금 일하는 사람들</h2>
            {online.length > 0 ? (
              <ul className={styles.onlineList}>
                {online.map((member) => (
                  <li key={member.id} className={styles.onlineItem}>
                    <span className={styles.avatar}>{member.name.charAt(0)}</span>
                    {member.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.onlineEmpty}>&nbsp;</p>
            )}
          </aside>
        </div>
      </div>
    </AppPage>
  );
}
