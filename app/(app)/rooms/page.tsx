import Link from "next/link";
import AppPage from "@/components/app/AppPage";
import styles from "@/components/app/app.module.css";
import { countRoomsToday } from "@/lib/rooms";
import { ROOM_NUMBERS } from "@/lib/rooms-meta";

export default async function RoomsPage() {
  const counts = await countRoomsToday();
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <AppPage number="09" crumb="회의실 예약" heading="회의실 예약" aside={`오늘 ${total}건`}>
      <section className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>회의실</th>
              <th>오늘 예약</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ROOM_NUMBERS.map((no) => (
              <tr key={no}>
                <td className={styles.code}>{no}번방</td>
                <td>{counts[no] ?? 0}건</td>
                <td>
                  <div className={styles.actions}>
                    <Link href={`/rooms/${no}`} className={styles.secondaryButton}>
                      스케줄 보기
                    </Link>
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
