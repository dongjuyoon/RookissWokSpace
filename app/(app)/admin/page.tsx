import AppPage from "@/components/app/AppPage";
import styles from "@/components/app/app.module.css";
import { approveMember, listPendingMembers, rejectMember } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export default async function ApprovePage() {
  const rows = await listPendingMembers();

  return (
    <AppPage number="06" crumb="가입 승인" heading="가입 승인" aside={`${rows.length}건 대기`}>
      <section className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>직책</th>
              <th>부서</th>
              <th>신청일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td className={styles.mono}>{row.email}</td>
                <td>{row.title}</td>
                <td>{row.department}</td>
                <td className={styles.mono}>{formatDate(row.createdAt)}</td>
                <td>
                  <div className={styles.actions}>
                    <form action={approveMember.bind(null, row.id)}>
                      <button type="submit" className={styles.primaryButton}>
                        승인
                      </button>
                    </form>
                    <form action={rejectMember.bind(null, row.id)}>
                      <button type="submit" className={styles.secondaryButton}>
                        거절
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppPage>
  );
}
