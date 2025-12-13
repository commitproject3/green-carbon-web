"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";

/** Config */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

/** Types */
type Recommendation = {
  category: string;
  action: string;
  expected_reduction_kg: number;
  tip: string;
};
type MonthResult = {
  month: string;
  total_amt: number;
  cluster_name_hint: string;
  carbon_kg: number;
  carbon_score: number;
  recommendations: Recommendation[];
};

/** Helpers */
const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 1 });
const pct = (n: number) => `${n.toFixed(1)}%`;

/** UI */
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MonthResult[] | null>(null);

  const canSubmit = useMemo(() => !!file || text.trim().length > 0, [file, text]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResults(null);

    if (!canSubmit) {
      setError("CSV 파일을 올리거나 텍스트를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      if (file) fd.append("file", file);
      if (text.trim()) fd.append("text", text.trim());
      if (date.trim()) fd.append("date", date.trim());

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as MonthResult[];
      setResults(json);
    } catch (err: any) {
      setError(err?.message || "요청 중 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  return (
    <main className="wrap">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <Image
            src="/leaf.jpg"
            alt="Leaf"
            width={22}
            height={22}
            className="leafImgSmall"
            priority
          />
          <span>Green Carbon</span>
        </div>
        <div className="right">
          <Image
            src="/leaf.jpg"
            alt="Leaf"
            width={22}
            height={22}
            className="leafImgSmall"
          />
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="heroLeft">
          <h1>
            친환경 소비를 위한 한걸음 <span className="mark"></span>
          </h1>
          <p className="sub">
            탄소배출량, 탄소 점수, 친환경 소비 방법 추천을 한 번에!
          </p>

          <ul className="bullets">
            <li>
              <Image src="/leaf.jpg" alt="leaf" width={18} height={18} className="leafImgMini" />
              나는 어떤 유형의 소비자일까?
            </li>
            <li>
              <Image src="/leaf.jpg" alt="leaf" width={18} height={18} className="leafImgMini" />
              탄소 배출량을 감소시킬 수 있는 소비 방법 추천
            </li>
            <li>
              <Image src="/leaf.jpg" alt="leaf" width={18} height={18} className="leafImgMini" />
              나의 탄소 점수는?
            </li>
          </ul>
        </div>

        <form className="card" onSubmit={onSubmit}>
          <label
            className={`drop ${file ? "hasFile" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <div className="dropInner">
              <Image
                src="/leaf.jpg"
                alt="Drop leaf"
                width={28}
                height={28}
                className="leafImgDrop"
              />
              <div className="dropText">
                {file ? (
                  <>
                    <b>{file.name}</b>
                    <span>다시 선택하거나 드래그해서 교체</span>
                  </>
                ) : (
                  <>
                    <b>파일 가져오기</b>
                  </>
                )}
              </div>
            </div>
          </label>

          <div className="sep"><span>또는</span></div>

          <div className="field">
            <label className="label"><b>소비 내역 입력</b></label>
            <textarea
              className="textarea"
              rows={4}
              placeholder={`예) 스타벅스 5000원, 배달의민족 15000원, 지하철 1400원`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canSubmit && !loading) {
                  onSubmit(e as unknown as React.FormEvent);
                }
              }}
            />
          </div>

          <div className="field">
            <label className="label"><b>기본 날짜 (YYYY-MM-DD, 선택)</b></label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {error && <div className="error">{error}</div>}

          {/* 버튼 */}
          <div className="actions">
            <button type="submit" className="btn" disabled={!canSubmit || loading}>
              {loading ? "LOADING..." : "RESULT"}
            </button>
          </div>

          <p className="hint">
            API: <code>{API_URL}/predict</code>
          </p>
        </form>
      </section>

      {/* Results */}
      {results && results.length > 0 && (
        <section className="results">
          <h2>
            <Image src="/leaf.jpg" alt="leaf" width={18} height={18} className="leafImgMini" /> 분석 결과
          </h2>

          <div className="grid">
            {results.map((r) => (
              <article key={r.month} className="resultCard">
                <div className="resultTop">
                  <span className="badge">{r.month}</span>
                  <span className="cluster">{r.cluster_name_hint}</span>
                </div>

                <div className="kpis">
                  <div className="kpi">
                    <span className="kpiLabel">총 지출</span>
                    <span className="kpiValue">{fmt(r.total_amt)} 원</span>
                  </div>
                  <div className="kpi">
                    <span className="kpiLabel">배출량</span>
                    <span className="kpiValue">{fmt(r.carbon_kg)} kg</span>
                  </div>
                  <div className="kpi">
                    <span className="kpiLabel">탄소 점수</span>
                    <span className="kpiValue">{pct(r.carbon_score)}</span>
                  </div>
                </div>

                <div className="recos">
                  <h3>
                    <Image src="/leaf.jpg" alt="leaf" width={18} height={18} className="leafImgMini" /> 친환경 소비 방법 추천
                  </h3>
                  <ul>
                    {r.recommendations.map((rec, i) => (
                      <li key={i} className="recoItem">
                        <span className="recoCat">{rec.category}</span>
                        <div className="recoText">
                          <div className="recoMain">{rec.action}</div>
                          <div className="recoSub">
                            예상절감 {fmt(rec.expected_reduction_kg)} kg · {rec.tip}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Styles */}
      <style jsx>{`
        :root {
          --bg: #f6fbf7;
          --panel: #ffffff;
          --ink: #1c2b1f;
          --muted: #6b7f6f;
          --line: #e5efe7;
          --brand: #2e7d32;
          --brand-2: #43a047;
          --accent: #e8f5e9;
          --shadow: 0 8px 24px rgba(24, 94, 32, 0.08);
        }
        .wrap {
          min-height: 100dvh;
          background: radial-gradient(1200px 600px at 10% -10%, #dff5e4 0%, transparent 60%),
            radial-gradient(1000px 500px at 100% 0%, #e7f8ec 0%, transparent 50%),
            var(--bg);
          color: var(--ink);
        }
        .header {
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px 20px 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          letter-spacing: -0.2px;
          font-size: 20px;
        }
        .leafImgSmall { filter: drop-shadow(0 3px 6px rgba(46,125,50,.25)); transform: rotate(-6deg); border-radius: 6px; }
        .leafImgMini { width: 18px; height: 18px; filter: drop-shadow(0 2px 4px rgba(46,125,50,.18)); transform: rotate(-5deg); flex: 0 0 auto; }
        .leafImgDrop { width: 28px; height: 28px; filter: drop-shadow(0 6px 12px rgba(46,125,50,.25)); transform: rotate(-4deg); flex: 0 0 auto; }

        .hero {
          max-width: 1100px;
          margin: 12px auto 24px;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 940px) { .hero { grid-template-columns: 1fr; } }

        .heroLeft h1 { font-size: clamp(28px, 4.5vw, 44px); line-height: 1.1; margin: 12px 0 10px; letter-spacing: -0.4px; }
        .mark { color: var(--brand); }
        .sub { color: var(--muted); margin-bottom: 14px; }

        .bullets { list-style: none; padding: 0; margin: 10px 0 0; display: grid; gap: 8px; color: var(--ink); }
        .bullets li { display: flex; align-items: center; gap: 10px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; box-shadow: var(--shadow); }

        .card {
          position: relative;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 18px;
          box-shadow: var(--shadow);
          display: grid;
          gap: 12px;
          align-content: start;
          z-index: 0;
        }

        .drop { border: 2px dashed #a5cfb0; border-radius: 14px; background: var(--accent); cursor: pointer; transition: .2s ease; }
        .drop:hover { border-color: var(--brand); background: #eef9f0; }
        .drop.hasFile { border-color: var(--brand); background: #e8f7eb; }
        .dropInner { display: flex; gap: 12px; align-items: center; padding: 14px; }
        .dropText b { display: block; }
        .dropText span { color: var(--muted); font-size: 12.5px; }

        .sep { position: relative; text-align: center; color: var(--muted); font-size: 12.5px; }
        .sep::before, .sep::after { content: ""; position: absolute; top: 50%; width: 40%; height: 1px; background: var(--line); }
        .sep::before { left: 0; } .sep::after { right: 0; }

        .field { display: grid; gap: 6px; }
        .label { font-size: 13px; color: var(--muted); }
        .input, .textarea { width: 100%; border-radius: 12px; border: 1px solid var(--line); padding: 10px 12px; font-size: 14.5px; background: #fff; outline: none; }
        .input:focus, .textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px #c9efd2; }
        .textarea { resize: vertical; }

        .actions {
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          z-index: 1;
        }
        /* ▶ 초록 RESULT 버튼 */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          min-width: 180px;
          padding: 12px 18px;
          border-radius: 14px;
          background: #2e7d32;        /* 진한 초록 */
          color: #ffffff;
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all .15s ease;
          box-shadow: 0 8px 18px rgba(46, 125, 50, 0.35);
        }
        .btn:hover:not(:disabled) {
          background: #256a2b;
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(46, 125, 50, 0.35);
        }
        .btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 4px 10px rgba(46, 125, 50, 0.25);
        }
        .btn:disabled {
          background: #9fc7a8;
          cursor: not-allowed;
          box-shadow: none;
          opacity: 0.85;
        }

        .hint { color: var(--muted); font-size: 12.5px; margin: 8px 0 -2px; }
        .error { background: #ffe8e8; color: #8a1f1f; border: 1px solid #ffd1d1; border-radius: 10px; padding: 10px 12px; font-size: 13.5px; }

        .results { max-width: 1100px; margin: 10px auto 40px; padding: 0 20px; }
        .results h2 { display: flex; align-items: center; gap: 8px; margin: 6px 0 14px; }

        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        @media (max-width: 940px) { .grid { grid-template-columns: 1fr; } }

        .resultCard { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 14px; box-shadow: var(--shadow); display: grid; gap: 10px; }
        .resultTop { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .badge { background: var(--accent); color: var(--brand); border: 1px solid #c9efd2; padding: 6px 10px; border-radius: 999px; font-size: 12.5px; font-weight: 700; }
        .cluster { color: var(--muted); font-size: 13.5px; }
        .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .kpi { background: #f9fcfa; border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; }
        .kpiLabel { color: var(--muted); font-size: 12px; }
        .kpiValue { display: block; font-weight: 800; margin-top: 2px; }
        .recos h3 { display: flex; align-items: center; gap: 8px; margin: 6px 0 8px; font-size: 15px; }
        .recos ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
        .recoItem { display: grid; grid-template-columns: 88px 1fr; gap: 10px; border: 1px dashed #cfe8d5; background: #f4fbf6; border-radius: 12px; padding: 10px 12px; }
        .recoCat { background: var(--accent); color: var(--brand); border: 1px solid #c9efd2; font-weight: 700; border-radius: 999px; padding: 6px 10px; text-align: center; align-self: start; }
        .recoMain { font-weight: 700; }
        .recoSub { color: var(--muted); font-size: 13px; }
      `}</style>
    </main>
  );
}





