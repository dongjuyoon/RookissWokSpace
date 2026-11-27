import AppPage from "@/components/app/AppPage";
import styles from "@/components/app/app.module.css";
import { createInvite, listInvites, revokeInvite } from "@/lib/admin";
import { formatDate } from "@/lib/format";

const STATE_LABEL = {
  available: "사용 가능",
  used: "사용됨",
  revoked: "회수됨",
} as const;

export default async function InvitesPage() {
  const rows = await listInvites();
  const available = rows.filter((row) => row.state === "available").length;

  return (
    <AppPage
      number="07"
      crumb="초대 코드"
      heading="초대 코드"
      aside={`쓸 수 있는 코드 ${available}개`}
    >
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>코드 발급</h2>
        <form action={createInvite}>
          <label className={styles.hintLabel} htmlFor="memo">
            메모 — 누구에게 줄 코드인가요?
          </label>
          <div className={styles.issueRow}>
            <input
              id="memo"
              name="memo"
              required
              placeholder="신규 입사자 (개발)"
              className={styles.input}
            />
            <button type="submit" className={styles.primaryButton}>
              코드 발급
            </button>
          </div>
        </form>
      </section>

      <section className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>코드</th>
              <th>메모</th>
              <th>발급</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={styles.code}>{row.code}</td>
                <td>{row.memo}</td>
                <td>
                  {row.createdByName ?? "—"}{" "}
                  <span className={styles.mono}>{formatDate(row.createdAt)}</span>
                </td>
                <td>
                  {row.state === "available" && (
                    <span className={`${styles.chip} ${styles.chipAvailable}`}>
                      {STATE_LABEL.available}
                    </span>
                  )}
                  {row.state === "used" && (
                    <>
                      <span className={styles.chip}>{STATE_LABEL.used}</span>
                      <span className={styles.usedBy}>{row.usedByName}</span>
                    </>
                  )}
                  {row.state === "revoked" && (
                    <span className={styles.chip}>{STATE_LABEL.revoked}</span>
                  )}
                </td>
                <td>
                  {row.state === "available" && (
                    <div className={styles.actions}>
                      <form action={revokeInvite.bind(null, row.id)}>
                        <button type="submit" className={styles.secondaryButton}>
                          회수
                        </button>
                      </form>
                    </div>
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
