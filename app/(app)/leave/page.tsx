import AppPage from "@/components/app/AppPage";
import styles from "@/components/app/app.module.css";
import { requireApprovedProfile } from "@/lib/auth";
import { approveLeave, createLeave, listLeaves, rejectLeave } from "@/lib/leave";
import { LEAVE_KINDS, LEAVE_STATUS_LABEL } from "@/lib/leave-meta";

const STATUS_CLASS = {
  pending: styles.chipWorking,
  approved: styles.chipAvailable,
  rejected: styles.chip,
} as const;

export default async function LeavePage() {
  const profile = await requireApprovedProfile();
  const isAdmin = profile.role === "admin";
  const rows = await listLeaves();
  const pending = rows.filter((row) => row.status === "pending").length;

  return (
    <AppPage
      number="05"
      crumb="휴가 신청"
      heading="휴가"
      aside={isAdmin ? `전사 신청 · ${pending}건 대기` : "내 신청 내역"}
    >
      <section className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              {isAdmin && <th>신청자</th>}
              <th>종류</th>
              <th>기간</th>
              <th>사유</th>
              <th>상태</th>
              {isAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 4}>신청 내역이 없습니다.</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                {isAdmin && (
                  <td>
                    {row.requesterName}
                    <span className={styles.memberTitle}> {row.requesterDepartment}</span>
                  </td>
                )}
                <td>{row.kind}</td>
                <td className={styles.mono}>
                  {row.startDate === row.endDate
                    ? row.startDate
                    : `${row.startDate} ~ ${row.endDate}`}
                  <span className={styles.memberTitle}> · {row.days}일</span>
                </td>
                <td>{row.reason}</td>
                <td>
                  <span className={STATUS_CLASS[row.status]}>{LEAVE_STATUS_LABEL[row.status]}</span>
                </td>
                {isAdmin && (
                  <td>
                    {row.status === "pending" && (
                      <div className={styles.actions}>
                        <form action={approveLeave.bind(null, row.id)}>
                          <button type="submit" className={styles.primaryButton}>
                            승인
                          </button>
                        </form>
                        <form action={rejectLeave.bind(null, row.id)}>
                          <button type="submit" className={styles.secondaryButton}>
                            반려
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>휴가 신청</h2>
        <form action={createLeave}>
          <div className={styles.leaveGrid}>
            <label className={styles.field}>
              종류
              <select name="kind" className={styles.select} defaultValue={LEAVE_KINDS[0]}>
                {LEAVE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              시작일
              <input type="date" name="startDate" required className={styles.input} />
            </label>
            <label className={styles.field}>
              종료일
              <input type="date" name="endDate" required className={styles.input} />
            </label>
          </div>
          <label className={styles.field} style={{ marginTop: 12 }}>
            사유
            <input name="reason" required placeholder="가족 여행" className={styles.input} />
          </label>
          <div className={styles.composeFoot}>
            <span />
            <button type="submit" className={styles.primaryButton}>
              신청하기
            </button>
          </div>
        </form>
      </section>
    </AppPage>
  );
}
