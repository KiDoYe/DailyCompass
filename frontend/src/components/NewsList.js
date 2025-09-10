// NewsList.js
import React, { useEffect, useMemo, useState, useCallback } from "react";

const API_BASE = "/api/news";

export default function NewsList({ date }) {
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(4);

  // ⭐️ useCallback을 사용하여 fetchNews 함수를 메모이제이션
  const fetchNews = useCallback(async () => {
    setPending(true);
    setError("");

    const url = date ? `${API_BASE}?date=${encodeURIComponent(date)}` : `${API_BASE}`;

    try {
      const res = await fetch(url);
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : {};

      if (!res.ok) {
        const msg = data.error ? `${data.error}` : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err.message || "뉴스 로딩 실패");
    } finally {
      setPending(false);
    }
  }, [date]); // ⭐️ date가 변경될 때만 fetchNews 함수를 새로 만듦

  useEffect(() => {
    fetchNews();

    const intervalId = setInterval(fetchNews, 300000); // 5분마다 호출

    return () => clearInterval(intervalId);
  }, [fetchNews]); // ⭐️ useEffect의 의존성 배열에 fetchNews를 포함

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );
  const canLoadMore = visibleCount < items.length;

  return (
    <section className="news-section">
      <div className="news-header">
        <h2>실시간 뉴스</h2>
      </div>

      <div className="news-content">
        {pending && <div className="news-loading">불러오는 중…</div>}
        {!pending && error && (
          <div className="news-error">
            <div style={{ marginBottom: 8 }}>오류: {error}</div>
          </div>
        )}
        {!pending && !error && (
          <>
            {visibleItems.length === 0 ? (
              <div className="news-empty">표시할 뉴스가 없습니다.</div>
            ) : (
              <ul className="news-list">
                {visibleItems.map((n) => (
                  <li key={n.link} className="news-item">
                    <a
                      className="news-title"
                      href={n.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {n.title}
                    </a>
                    <div className="news-meta">
                      <span className="news-press">
                        {n.press || "언론사 미상"}
                      </span>
                      {n.time && <span className="news-time"> · {n.time}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      {canLoadMore && !pending && !error && (
        <button
          className="load-more-btn"
          onClick={() =>
            setVisibleCount((c) => Math.min(c + 6, items.length))
          }
        >
          더보기
        </button>
      )}
    </section>
  );
}