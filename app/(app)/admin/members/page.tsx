import AppPage from "@/components/app/AppPage";
import styles from "@/components/app/app.module.css";
import { listMembers, setMemberRole, updateMember } from "@/lib/admin";

export default async function MembersPage() {
  const { rows, adminCount } = await listMembers();

  return (
    <AppPage
      number="08"
      crumb="구성원 관리"
      heading="구성원 관리"
      aside={`${rows.length}명 · 관리자 ${adminCount}명`}
    >
      <section className={styles.card}>
        <ul className={styles.memberList}>
          {rows.map((row) => {
            const isLastAdmin = row.role === "admin" && adminCount <= 1;
            return (
              <li key={row.id} className={styles.adminRow}>
                <div className={styles.adminIdentity}>
                  <span className={styles.memberName}>{row.name}</span>
                  <span className={styles.memberMeta}>{row.email || "—"}</span>
                </div>

                <form action={updateMember} className={styles.adminEditForm}>
                  <input type="hidden" name="id" value={row.id} />
                  <input
                    name="employeeNo"
                    defaultValue={row.employeeNo}
                    aria-label={`${row.name} 사번`}
                    className={`${styles.input} ${styles.noInput}`}
                    maxLength={3}
                  />
                  <input
                    name="department"
                    defaultValue={row.department}
                    aria-label={`${row.name} 부서`}
                    className={`${styles.input} ${styles.deptInput}`}
                  />
                  <input
                    name="title"
                    defaultValue={row.title}
                    aria-label={`${row.name} 직책`}
                    className={`${styles.input} ${styles.titleInput}`}
                  />
                  <button type="submit" className={styles.secondaryButton}>
                    저장
                  </button>
                </form>

                <div className={styles.adminRoleBox}>
                  {row.role === "admin" ? (
                    <span className={styles.roleAdmin}>관리자</span>
                  ) : (
                    <span className={styles.chip}>구성원</span>
                  )}
                  <form action={setMemberRole.bind(null, row.id, row.role === "admin" ? "member" : "admin")}>
                    <button
                      type="submit"
                      className={styles.secondaryButton}
                      disabled={isLastAdmin}
                      title={isLastAdmin ? "마지막 관리자의 권한은 내릴 수 없습니다." : undefined}
                    >
                      {row.role === "admin" ? "권한 내리기" : "관리자로"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </AppPage>
  );
}
