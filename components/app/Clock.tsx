"use client";

import { useEffect, useState } from "react";
import { formatClock, formatDate } from "@/lib/format";
import styles from "./app.module.css";

// 상단바의 오늘 날짜 · 시각 (YYYY-MM-DD HH:MM, 30초마다 갱신)
export default function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return <span className={styles.clock} />;
  return (
    <span className={styles.clock}>
      {formatDate(now.toISOString())} {formatClock(now)}
    </span>
  );
}
