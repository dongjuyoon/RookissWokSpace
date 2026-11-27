import AppPage from "@/components/app/AppPage";
import styles from "@/components/app/app.module.css";
import { listDirectory, type DirectoryMember } from "@/lib/directory";

// 이름 두 글자 아바타 (sample-screen/directory.png 와 같이 이름 끝 두 글자)
function avatarText(name: string): string {
  return name.slice(-2);
}

function MemberRow({ member }: { member: DirectoryMember }) {
  const avatarClass = `${styles.avatar} ${styles.memberAvatar} ${
    member.online ? styles.memberAvatarOnline : ""
  }`;
  return (
    <li className={styles.memberRow}>
      <span className={avatarClass} aria-label={member.online ? "접속 중" : undefined}>
        {avatarText(member.name)}
      </span>
      <div className={styles.memberInfo}>
        <div className={styles.memberNameLine}>
          <span className={styles.memberName}>{member.name}</span>
          {member.title && <span className={styles.memberTitle}>{member.title}</span>}
          {member.role === "admin" && <span className={styles.chip}>관리자</span>}
        </div>
        <div className={styles.memberMeta}>
          {member.email || "—"} · 사번 {member.employeeNo ?? "—"}
        </div>
      </div>
    </li>
  );
}

export default async function DirectoryPage() {
  const groups = await listDirectory();
  const total = groups.reduce((sum, group) => sum + group.members.length, 0);

  return (
    <AppPage number="03" crumb="조직도" heading="조직도" aside={`${groups.length}개 부서 · ${total}명`}>
      <section className={styles.card}>
        {groups.map((group) => (
          <div key={group.department} className={styles.deptGroup}>
            <div className={styles.deptHead}>
              <span className={styles.deptName}>{group.department || "—"}</span>
              <span className={styles.deptCount}>{group.members.length}명</span>
            </div>
            <ul className={styles.memberList}>
              {group.members.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </ul>
          </div>
        ))}
      </section>
    </AppPage>
  );
}
