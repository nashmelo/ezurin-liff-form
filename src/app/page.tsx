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

  /* =========================
     LIFF 初期化（最小構成）
  ========================= */
  useEffect(() => {
    liff
      .init({ liffId: LIFF_ID })
      .then(() => setLiffReady(true))
      .catch((e) => {
        console.error("LIFF init error", e);
        setLiffReady(false);
      });
  }, []);

  /* =========================
     入力ハンドラ
  ========================= */
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

  /* =========================
     送信処理
  ========================= */
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
      `〒${form.postalCode || "未入力"}`,
      `${form.prefecture}${form.city}${form.address1}`,
      `${form.building}`,
      "",
      "■ ご希望日時",
      `第1希望：${form.pickupDate1 || "未入力"}`,
      `第2希望：${form.pickupDate2 || "未入力"}`,
      `第3希望：${form.pickupDate3 || "未入力"}`,
      "",
      form.note ? `■ ご相談内容\n${form.note}` : "",
      "———",
      "",
      "※ このトークでそのままやり取りできます。",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      setSubmitting(true);

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

  /* =========================
     UI
  ========================= */
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "white",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            不用品回収・片付けご相談フォーム
          </h1>

          <p style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
            必要事項をご入力のうえ送信してください。
            <br />
            担当者よりLINEまたはお電話でご連絡いたします。
          </p>

          {error && (
            <div
              style={{
                background: "#ffe5e5",
                color: "#b00020",
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          {submitted && (
            <div
              style={{
                background: "#e6f7ff",
                color: "#0050b3",
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              送信ありがとうございました。トーク画面をご確認ください。
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Field label="お名前" required>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                style={inputStyle}
              />
            </Field>

            <Field label="電話番号" required>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                style={inputStyle}
              />
            </Field>

            <Field label="ご希望サービス" required>
              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">選択してください</option>
                <option value="不用品回収">不用品回収</option>
                <option value="遺品整理・生前整理">
                  遺品整理・生前整理
                </option>
                <option value="ゴミ屋敷片付け">ゴミ屋敷片付け</option>
                <option value="引越し">引越し</option>
              </select>
            </Field>

            <Field label="ご相談内容（任意）">
              <textarea
                name="note"
                rows={4}
                value={form.note}
                onChange={handleChange}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </Field>

            <Field label="画像添付（任意）">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
            </Field>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "10px 16px",
                borderRadius: 999,
                border: "none",
                background: submitting ? "#999" : "#00c300",
                color: "white",
                fontWeight: 700,
                fontSize: 15,
                cursor: submitting ? "default" : "pointer",
              }}
            >
              {submitting ? "送信中..." : "この内容で送信する"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

/* =========================
   小コンポーネント
========================= */
type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

const Field: React.FC<FieldProps> = ({ label, required, children }) => (
  <div style={{ marginBottom: 10 }}>
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 4,
      }}
    >
      {label}
      {required && <span style={{ color: "#d00", marginLeft: 4 }}>＊</span>}
    </label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ddd",
  fontSize: 13,
  boxSizing: "border-box",
};
