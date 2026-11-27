import Link from "next/link";
import AppPage from "@/components/app/AppPage";
import styles from "@/components/app/app.module.css";
import { requireApprovedProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createNotice, listNotices } from "@/lib/notices";
import { NOTICE_CATEGORIES } from "@/lib/notice-meta";

export default async function NoticesPage() {
  const profile = await requireApprovedProfile();
  const notices = await listNotices();

  return (
    <AppPage
      number="02"
      crumb="게시판"
      heading="게시판"
      aside={`${notices.length}건`}
    >
      {profile.role === "admin" && (
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.eyebrow}>새 글</span>
          </div>
          <form action={createNotice}>
            <div className={styles.composeGrid}>
              <label className={styles.field}>
                말머리
                <select name="category" required className={styles.select} defaultValue={NOTICE_CATEGORIES[0]}>
                  {NOTICE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                제목
                <input name="title" required className={styles.input} />
              </label>
            </div>
            <label className={styles.field} style={{ marginTop: 12 }}>
              내용
              <textarea name="body" className={styles.textarea} />
            </label>
            <div className={styles.composeFoot}>
              <label className={styles.checkRow}>
                <input type="checkbox" name="pinned" /> 고정
              </label>
              <button type="submit" className={styles.primaryButton}>
                등록
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.card}>
        {notices.map((notice) => (
          <Link key={notice.id} href={`/notices/${notice.id}`} className={styles.noticeRow}>
            <div className={styles.noticeMeta}>
              {notice.pinned && <span className={`${styles.chip} ${styles.chipPinned}`}>고정</span>}
              <span className={styles.chip}>{notice.category}</span>
              <span>
                {notice.authorName} · {formatDate(notice.createdAt)}
              </span>
            </div>
            <span className={styles.noticeTitle}>{notice.title}</span>
            <div className={styles.noticeFoot}>댓글 {notice.commentCount}</div>
          </Link>
        ))}
      </section>
    </AppPage>
  );
}
