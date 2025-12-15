"use client";

import React, { useState, useEffect } from "react";
import liff from "@line/liff";
import styles from "./page.module.css";

const LIFF_ID = "2008636045-8572KPnd";

type FormData = {
  name: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address1: string;
  building: string;
  buildingType: string;
  parking: "あり" | "なし" | "";
  elevator: "あり" | "なし" | "";
  service: string;
  note: string;
  images: File[];
  pickupDate1: string;
  pickupDate2: string;
  pickupDate3: string;
};

const initialFormData: FormData = {
  name: "",
  phone: "",
  postalCode: "",
  prefecture: "",
  city: "",
  address1: "",
  building: "",
  buildingType: "",
  parking: "",
  elevator: "",
  service: "",
  note: "",
  images: [],
  pickupDate1: "",
  pickupDate2: "",
  pickupDate3: "",
};

export default function Home() {
  const [form, setForm] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liffReady, setLiffReady] = useState(false);

  /* ---------------------------
     LIFF 初期化（最小構成）
  --------------------------- */
  useEffect(() => {
    liff
      .init({ liffId: LIFF_ID })
      .then(() => setLiffReady(true))
      .catch((e) => {
        console.error("LIFF init error", e);
        setLiffReady(false);
      });
  }, []);

  /* ---------------------------
     フォーム操作
  --------------------------- */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      images: Array.from(e.target.files || []),
    }));
  };

  /* ---------------------------
     送信処理
  --------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.phone || !form.service) {
      setError("お名前・電話番号・ご希望サービスは必須です。");
      return;
    }

    const summaryText = [
      "📩 お問い合わせを受け付けました",
      "",
      "以下の内容で承りました。",
      "内容を確認のうえ、担当者よりご連絡いたします。",
      "",
      "———",
      `【お名前】${form.name}`,
      `【電話番号】${form.phone}`,
      `【ご希望サービス】${form.service}`,
      "",
      "■ 回収現場住所",
      `〒${form.postalCode}`,
      `${form.prefecture}${form.city}${form.address1}`,
      `${form.building}`,
      "",
      "■ ご希望日時",
      `第1希望：${form.pickupDate1 || "未入力"}`,
      `第2希望：${form.pickupDate2 || "未入力"}`,
      `第3希望：${form.pickupDate3 || "未入力"}`,
      "",
      form.note ? "■ ご相談内容\n" + form.note : "",
      "———",
      "",
      "※ このトークでそのままやり取りできます。",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      setSubmitting(true);

      // LINEアプリ内ならトーク送信
      if (liffReady && liff.isInClient()) {
        await liff.sendMessages([
          {
            type: "text",
            text: summaryText,
          },
        ]);
      }

      setSubmitted(true);
      setForm(initialFormData);
    } catch (e) {
      console.error(e);
      setError("送信中にエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------
     UI
  --------------------------- */
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <div className={styles.card}>
          <h1>不用品回収・片付けご相談フォーム</h1>

          {error && <div className={styles.error}>{error}</div>}
          {submitted && (
            <div className={styles.success}>
              送信ありがとうございました。トーク画面をご確認ください。
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="お名前"
              value={form.name}
              onChange={handleChange}
            />

            <input
              name="phone"
              placeholder="電話番号"
              value={form.phone}
              onChange={handleChange}
            />

            <select
              name="service"
              value={form.service}
              onChange={handleChange}
            >
              <option value="">サービスを選択</option>
              <option value="不用品回収">不用品回収</option>
              <option value="遺品整理・生前整理">遺品整理・生前整理</option>
              <option value="ゴミ屋敷片付け">ゴミ屋敷片付け</option>
            </select>

            <textarea
              name="note"
              placeholder="ご相談内容（任意）"
              value={form.note}
              onChange={handleChange}
            />

            <input type="file" multiple onChange={handleFileChange} />

            <button type="submit" disabled={submitting}>
              {submitting ? "送信中..." : "この内容で送信する"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
