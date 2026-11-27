import Link from "next/link";
import { notFound } from "next/navigation";
import AppPage from "@/components/app/AppPage";
import styles from "@/components/app/app.module.css";
import { requireApprovedProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getNotice } from "@/lib/notices";

// 글 하나만 보이는 주소: /notices/[id]
export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireApprovedProfile();
  const { id } = await params;
  const notice = await getNotice(id);
  if (!notice) notFound();

  return (
    <AppPage
      number="02"
      crumb="게시판"
      heading={notice.title}
      aside={
        <Link href="/notices" className={styles.asideLink}>
          ← 목록
        </Link>
      }
    >
      <section className={styles.card}>
        <div className={styles.detailMeta}>
          {notice.pinned && <span className={`${styles.chip} ${styles.chipPinned}`}>고정</span>}
          <span className={styles.chip}>{notice.category}</span>
          <span>
            {notice.authorName} · {formatDate(notice.createdAt)}
          </span>
        </div>
        <div className={styles.noticeBody}>{notice.body}</div>
      </section>
    </AppPage>
  );
}
