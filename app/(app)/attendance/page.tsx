import AppPage from "@/components/app/AppPage";
import styles from "@/components/app/app.module.css";
import { checkIn, checkOut, getTodayAttendance, listRecentAttendance } from "@/lib/attendance";
import { formatClock, formatDate } from "@/lib/format";

export default async function AttendancePage() {
  const [today, recent] = await Promise.all([getTodayAttendance(), listRecentAttendance()]);
  const working = today !== null && today.checkOut === null;

  return (
    <AppPage number="04" crumb="근태" heading="근태" aside="최근 30일">
      <section className={`${styles.card} ${styles.attendanceCard}`}>
        <div className={styles.timeRow}>
          <div className={styles.timeBlock}>
            <span className={styles.timeLabel}>출근</span>
            <span className={styles.timeValue}>{today ? formatClock(new Date(today.checkIn)) : "—"}</span>
          </div>
          <div className={styles.timeBlock}>
            <span className={styles.timeLabel}>퇴근</span>
            <span className={styles.timeValue}>
              {today?.checkOut ? formatClock(new Date(today.checkOut)) : "—"}
            </span>
          </div>
        </div>

        {working ? (
          <form action={checkOut}>
            <button type="submit" className={styles.primaryButton}>
              ✓ 퇴근하기
            </button>
          </form>
        ) : (
          <form action={checkIn}>
            <button type="submit" className={styles.primaryButton} disabled={today !== null}>
              ✓ 출근하기
            </button>
          </form>
        )}
      </section>

      <section className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>날짜</th>
              <th>출근</th>
              <th>퇴근</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((row) => (
              <tr key={row.id}>
                <td className={styles.mono}>{row.workDate}</td>
                <td className={styles.mono}>{formatClock(new Date(row.checkIn))}</td>
                <td className={styles.mono}>
                  {row.checkOut ? formatClock(new Date(row.checkOut)) : "—"}
                </td>
                <td>
                  {row.checkOut === null && row.workDate === formatDate(new Date()) ? (
                    <span className={styles.chipWorking}>근무 중</span>
                  ) : row.checkOut ? (
                    <span className={styles.chip}>퇴근</span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppPage>
  );
}
