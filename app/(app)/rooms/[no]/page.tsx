import Link from "next/link";
import { notFound } from "next/navigation";
import AppPage from "@/components/app/AppPage";
import styles from "@/components/app/app.module.css";
import { requireApprovedProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createReservation, getReservation, listWeekReservations, updateReservation } from "@/lib/rooms";
import {
  DAY_END,
  DAY_START,
  TIME_OPTIONS,
  WEEKDAY_LABEL,
  addDays,
  fromMinutes,
  isRoomNo,
  mondayOf,
  toMinutes,
} from "@/lib/rooms-meta";

// 1분 = 1px. 시간표 높이는 DAY_START ~ DAY_END 사이의 분 수입니다.
const PX_PER_MIN = 1;
const TIMELINE_MINUTES = toMinutes(DAY_END) - toMinutes(DAY_START);
const HOUR_LABELS: number[] = [];
for (let m = toMinutes(DAY_START); m <= toMinutes(DAY_END); m += 60) HOUR_LABELS.push(m);

const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ no: string }>;
  searchParams: Promise<{ week?: string; edit?: string }>;
}) {
  const profile = await requireApprovedProfile();
  const { no } = await params;
  if (!isRoomNo(no)) notFound();

  const query = await searchParams;
  const today = formatDate(new Date());
  const weekInput = query.week && WEEK_RE.test(query.week) ? query.week : today;
  const monday = mondayOf(weekInput);
  const sunday = addDays(monday, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const reservations = await listWeekReservations(no, monday);

  // 수정 중인 예약 (이 방의 것만, 본인 또는 관리자만 고칠 수 있습니다)
  const selected = query.edit ? await getReservation(query.edit) : null;
  const selectedInRoom = selected && selected.roomNo === no ? selected : null;
  const canEdit =
    selectedInRoom !== null &&
    (selectedInRoom.userId === profile.id || profile.role === "admin");

  const weekHref = (week: string) => `/rooms/${no}?week=${week}`;

  return (
    <AppPage number="09" crumb={`${no}번방`} heading={`${no}번방`} aside={`${monday} ~ ${sunday}`}>
      <section className={styles.card}>
        <div className={styles.ttNav}>
          <Link href={weekHref(addDays(monday, -7))} className={styles.secondaryButton}>
            ← 이전 주
          </Link>
          <Link href={weekHref(today)} className={styles.secondaryButton}>
            이번 주
          </Link>
          <Link href={weekHref(addDays(monday, 7))} className={styles.secondaryButton}>
            다음 주 →
          </Link>
        </div>

        <div className={styles.ttHead}>
          <div />
          {days.map((day, i) => (
            <div key={day} className={`${styles.ttDayHead} ${day === today ? styles.ttToday : ""}`}>
              <span className={styles.ttDayName}>{WEEKDAY_LABEL[i]}</span>
              <span className={styles.ttDayDate}>{day}</span>
            </div>
          ))}
        </div>

        <div className={styles.ttBody} style={{ height: TIMELINE_MINUTES * PX_PER_MIN }}>
          <div className={styles.ttTimes}>
            {HOUR_LABELS.map((m) => (
              <span key={m} className={styles.ttTime} style={{ top: (m - toMinutes(DAY_START)) * PX_PER_MIN }}>
                {fromMinutes(m)}
              </span>
            ))}
          </div>

          {days.map((day) => (
            <div key={day} className={styles.ttCol}>
              {reservations
                .filter((r) => r.date === day)
                .map((r) => {
                  const top = (toMinutes(r.start) - toMinutes(DAY_START)) * PX_PER_MIN;
                  const height = (toMinutes(r.end) - toMinutes(r.start)) * PX_PER_MIN;
                  const mine = r.userId === profile.id;
                  return (
                    <Link
                      key={r.id}
                      href={`/rooms/${no}?week=${monday}&edit=${r.id}`}
                      className={`${styles.ttBlock} ${mine ? styles.ttBlockMine : ""} ${
                        selectedInRoom?.id === r.id ? styles.ttBlockSelected : ""
                      }`}
                      style={{ top, height }}
                    >
                      <span className={styles.ttBlockTitle}>{r.title}</span>
                      <span className={styles.ttBlockMeta}>
                        {r.start}–{r.end} · {r.bookerName}
                      </span>
                    </Link>
                  );
                })}
            </div>
          ))}
        </div>
      </section>

      {selectedInRoom && !canEdit && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{selectedInRoom.title}</h2>
          <p className={styles.memberMeta}>
            {selectedInRoom.date} {selectedInRoom.start}–{selectedInRoom.end} · {selectedInRoom.bookerName}
          </p>
          <p className={styles.memberTitle}>본인이 만든 예약만 수정할 수 있습니다.</p>
        </section>
      )}

      {canEdit && selectedInRoom && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>예약 수정</h2>
          <form action={updateReservation}>
            <input type="hidden" name="id" value={selectedInRoom.id} />
            <ReservationFields
              date={selectedInRoom.date}
              start={selectedInRoom.start}
              end={selectedInRoom.end}
              title={selectedInRoom.title}
            />
            <div className={styles.composeFoot}>
              <Link href={weekHref(monday)} className={styles.secondaryButton}>
                닫기
              </Link>
              <button type="submit" className={styles.primaryButton}>
                수정 저장
              </button>
            </div>
          </form>
        </section>
      )}

      {!canEdit && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>예약하기</h2>
          <form action={createReservation}>
            <input type="hidden" name="roomNo" value={no} />
            <ReservationFields date={today} start="09:00" end="10:00" title="" />
            <div className={styles.composeFoot}>
              <span />
              <button type="submit" className={styles.primaryButton}>
                예약하기
              </button>
            </div>
          </form>
        </section>
      )}
    </AppPage>
  );
}

// 예약 폼의 입력칸 (예약하기·수정 공통)
function ReservationFields({
  date,
  start,
  end,
  title,
}: {
  date: string;
  start: string;
  end: string;
  title: string;
}) {
  return (
    <>
      <div className={styles.roomGrid}>
        <label className={styles.field}>
          날짜
          <input type="date" name="date" required defaultValue={date} className={styles.input} />
        </label>
        <label className={styles.field}>
          시작
          <select name="start" defaultValue={start} className={styles.select}>
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          종료
          <select name="end" defaultValue={end} className={styles.select}>
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={styles.field} style={{ marginTop: 12 }}>
        제목
        <input name="title" required maxLength={60} defaultValue={title} className={styles.input} />
      </label>
    </>
  );
}
