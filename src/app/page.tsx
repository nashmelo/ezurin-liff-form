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

  buildingType: string;
  parking: "あり" | "なし" | "";
  elevator: "あり" | "なし" | "";

  service: "不用品回収" | "部屋を丸ごと片付け" | "引越し" | "";

  movePostalCode: string;
  movePrefecture: string;
  moveCity: string;
  moveAddress1: string;

  items: string;
  images: File[];

  pickupDate1: string;
  pickupDate2: string;
  pickupDate3: string;

  contactMethod: "LINE" | "電話";
};

const initialFormData: FormData = {
  name: "",
  phone: "",

  postalCode: "",
  prefecture: "",
  city: "",
  address1: "",

  buildingType: "",
  parking: "",
  elevator: "",

  service: "",

  movePostalCode: "",
  movePrefecture: "",
  moveCity: "",
  moveAddress1: "",

  items: "",
  images: [],

  pickupDate1: "",
  pickupDate2: "",
  pickupDate3: "",

  contactMethod: "LINE",
};

export default function Home() {
  const [form, setForm] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [postalStatus, setPostalStatus] = useState<string | null>(null);
  const [movePostalStatus, setMovePostalStatus] = useState<string | null>(null);

  useEffect(() => {
    liff.init({ liffId: LIFF_ID }).catch(console.error);
  }, []);

  /* ---------------- 郵便番号検索 ---------------- */

  const fetchAddress = async (
    zipcode: string,
    isMove = false
  ) => {
    if (!/^\d{7}$/.test(zipcode)) return;

    isMove
      ? setMovePostalStatus("住所を検索しています…")
      : setPostalStatus("住所を検索しています…");

    try {
      const res = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`
      );
      const data = await res.json();

      if (data.status === 200 && data.results?.[0]) {
        const r = data.results[0];
        setForm((p) => ({
          ...p,
          ...(isMove
            ? {
                movePrefecture: r.address1,
                moveCity: `${r.address2}${r.address3}`,
              }
            : {
                prefecture: r.address1,
                city: `${r.address2}${r.address3}`,
              }),
        }));
        isMove ? setMovePostalStatus(null) : setPostalStatus(null);
      } else {
        isMove
          ? setMovePostalStatus("住所が見つかりませんでした")
          : setPostalStatus("住所が見つかりませんでした");
      }
    } catch {
      isMove
        ? setMovePostalStatus("住所検索に失敗しました")
        : setPostalStatus("住所検索に失敗しました");
    }
  };

  /* ---------------- 入力ハンドラ ---------------- */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "postalCode") {
      const v = value.replace(/\D/g, "");
      setForm((p) => ({ ...p, postalCode: v }));
      if (v.length === 7) fetchAddress(v);
      return;
    }

    if (name === "movePostalCode") {
      const v = value.replace(/\D/g, "");
      setForm((p) => ({ ...p, movePostalCode: v }));
      if (v.length === 7) fetchAddress(v, true);
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({
      ...p,
      images: Array.from(e.target.files || []),
    }));
  };

  /* ---------------- 送信 ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.phone || !form.service || !form.pickupDate1) {
      setError("必須項目が未入力です。");
      return;
    }

    if (
      !form.postalCode ||
      !form.prefecture ||
      !form.city ||
      !form.address1
    ) {
      setError("回収現場住所は必須です。");
      return;
    }

    if (
      form.service === "引越し" &&
      (!form.movePostalCode ||
        !form.movePrefecture ||
        !form.moveCity ||
        !form.moveAddress1)
    ) {
      setError("引越し先住所は必須です。");
      return;
    }

    if (!form.items.trim()) {
      setError("回収・引越しする物の種類・個数は必須です。");
      return;
    }

    try {
      setSubmitting(true);

      if (liff.isInClient()) {
        await liff.sendMessages([
          {
            type: "text",
            text: "お問い合わせを受け付けました。",
          },
        ]);
      }

      setSubmitted(true);
      setForm(initialFormData);
    } catch {
      setError("送信中にエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <main className={styles.main} style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", background: "#fff", padding: 20, borderRadius: 12 }}>
        <form onSubmit={handleSubmit}>
          <SectionTitle label="お客様情報" />

          <Field label="お名前" required>
            <input name="name" value={form.name} onChange={handleChange} style={inputStyle} />
          </Field>

          <Field label="電話番号（ハイフンなし）" required>
            <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} />
          </Field>

          <SectionTitle label="回収現場住所" />

          <Field label="郵便番号（7桁）" required>
            <input name="postalCode" value={form.postalCode} onChange={handleChange} style={inputStyle} />
            {postalStatus && <div style={{ fontSize: 11 }}>{postalStatus}</div>}
          </Field>

          <Field label="都道府県" required>
            <input name="prefecture" value={form.prefecture} onChange={handleChange} style={inputStyle} />
          </Field>

          <Field label="市区町村" required>
            <input name="city" value={form.city} onChange={handleChange} style={inputStyle} />
          </Field>

          <Field label="住所（番地など）" required>
            <input name="address1" value={form.address1} onChange={handleChange} style={inputStyle} />
          </Field>

          <SectionTitle label="ご希望内容" />

          <Field label="ご希望のサービス" required>
            <select name="service" value={form.service} onChange={handleChange} style={inputStyle}>
              <option value="">選択してください</option>
              <option value="不用品回収">不用品回収</option>
              <option value="部屋を丸ごと片付け">部屋を丸ごと片付け</option>
              <option value="引越し">引越し</option>
            </select>
          </Field>

          <Field label="回収・引越しする物の種類・個数" required>
            <textarea name="items" value={form.items} onChange={handleChange} rows={4} style={inputStyle} />
          </Field>

          <button type="submit" disabled={submitting} style={submitButtonStyle(submitting)}>
            {submitting ? "送信中..." : "送信する"}
          </button>
        </form>
      </div>
    </main>
  );
}

/* ---------- 共通UI ---------- */

const Field = ({ label, required, children }: any) => (
  <div style={{ marginBottom: 12 }}>
    <label>
      {label}
      {required && <span style={{ color: "red" }}> *</span>}
    </label>
    {children}
  </div>
);

const SectionTitle = ({ label }: any) => (
  <h2 style={{ marginTop: 20 }}>{label}</h2>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
};

const submitButtonStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  padding: 12,
  background: disabled ? "#aaa" : "#00c300",
  color: "#fff",
  border: "none",
  borderRadius: 999,
});
