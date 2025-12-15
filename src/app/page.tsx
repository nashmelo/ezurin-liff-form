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
  building: "",

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

  useEffect(() => {
    liff.init({ liffId: LIFF_ID }).catch(console.error);
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.phone || !form.service || !form.pickupDate1) {
      setError("必須項目が未入力です。");
      return;
    }

    const summaryText = [
      "📩 お問い合わせを受け付けました",
      "",
      "———",
      `【お名前】${form.name}`,
      `【電話番号】${form.phone}`,
      `【やり取り方法】${form.contactMethod}`,
      "",
      "■ ご希望サービス",
      form.service,
      "",
      "■ 回収現場住所",
      `〒${form.postalCode}`,
      `${form.prefecture}${form.city}${form.address1}`,
      form.building,
      "",
      `建物種類：${form.buildingType}`,
      `駐車場：${form.parking}`,
      `エレベーター：${form.elevator}`,
      "",
      form.service === "引越し"
        ? [
            "■ 引越し先住所",
            `〒${form.movePostalCode}`,
            `${form.movePrefecture}${form.moveCity}${form.moveAddress1}`,
            "",
          ].join("\n")
        : "",
      "■ 回収・引越しする物",
      form.items || "未入力",
      "",
      "■ お引き取り希望日時",
      `第1希望：${form.pickupDate1}`,
      `第2希望：${form.pickupDate2 || "なし"}`,
      `第3希望：${form.pickupDate3 || "なし"}`,
      "",
      `■ 添付画像：${form.images.length}枚`,
      "",
      "内容を確認のうえ、担当者よりご連絡いたします。",
    ].join("\n");

    try {
      setSubmitting(true);

      if (liff.isInClient()) {
        await liff.sendMessages([{ type: "text", text: summaryText }]);
      }

      setSubmitted(true);
      setForm(initialFormData);
    } catch {
      setError("送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <div className={styles.card}>
          <h1>不用品回収・片付けご相談フォーム</h1>

          {error && <ErrorBox>{error}</ErrorBox>}
          {submitted && <InfoBox>送信しました。LINEをご確認ください。</InfoBox>}

          <form onSubmit={handleSubmit}>
            <SectionTitle label="お客様情報" />

            <Field label="お名前" required>
              <input name="name" value={form.name} onChange={handleChange} style={inputStyle} />
            </Field>

            <Field label="電話番号" required>
              <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} />
            </Field>

            <SectionTitle label="回収現場住所" />

            <Field label="郵便番号">
              <input name="postalCode" value={form.postalCode} onChange={handleChange} style={inputStyle} />
            </Field>

            <Field label="都道府県">
              <input name="prefecture" value={form.prefecture} onChange={handleChange} style={inputStyle} />
            </Field>

            <Field label="市区町村">
              <input name="city" value={form.city} onChange={handleChange} style={inputStyle} />
            </Field>

            <Field label="番地・建物名">
              <input name="address1" value={form.address1} onChange={handleChange} style={inputStyle} />
            </Field>

            <Field label="建物種類">
              <select name="buildingType" value={form.buildingType} onChange={handleChange} style={inputStyle}>
                <option value="">選択してください</option>
                <option value="戸建て">戸建て</option>
                <option value="マンション・アパート">マンション・アパート</option>
                <option value="倉庫">倉庫</option>
                <option value="オフィス">オフィス</option>
                <option value="その他">その他</option>
              </select>
            </Field>

            <Field label="駐車場の有無">
              <select name="parking" value={form.parking} onChange={handleChange} style={inputStyle}>
                <option value="">選択してください</option>
                <option value="あり">あり</option>
                <option value="なし">なし</option>
              </select>
            </Field>

            <Field label="エレベーターの有無">
              <select name="elevator" value={form.elevator} onChange={handleChange} style={inputStyle}>
                <option value="">選択してください</option>
                <option value="あり">あり</option>
                <option value="なし">なし</option>
              </select>
            </Field>

            <SectionTitle label="ご希望内容" />

            <Field label="ご希望サービス" required>
              <select name="service" value={form.service} onChange={handleChange} style={inputStyle}>
                <option value="">選択してください</option>
                <option value="不用品回収">不用品回収</option>
                <option value="部屋を丸ごと片付け">部屋を丸ごと片付け</option>
                <option value="引越し">引越し</option>
              </select>
            </Field>

            {form.service === "引越し" && (
              <>
                <SectionTitle label="引越し先住所" />
                <Field label="郵便番号">
                  <input name="movePostalCode" value={form.movePostalCode} onChange={handleChange} style={inputStyle} />
                </Field>
                <Field label="都道府県">
                  <input name="movePrefecture" value={form.movePrefecture} onChange={handleChange} style={inputStyle} />
                </Field>
                <Field label="市区町村">
                  <input name="moveCity" value={form.moveCity} onChange={handleChange} style={inputStyle} />
                </Field>
                <Field label="番地・建物名">
                  <input name="moveAddress1" value={form.moveAddress1} onChange={handleChange} style={inputStyle} />
                </Field>
              </>
            )}

            <Field label="回収・引越しする物の種類・個数">
              <textarea name="items" value={form.items} onChange={handleChange} rows={3} style={inputStyle} />
            </Field>

            <Field label="添付画像">
              <input type="file" multiple accept="image/*" onChange={handleFileChange} />
            </Field>

            <SectionTitle label="お引き取り希望日時" />

            <Field label="第1希望" required>
              <input type="datetime-local" name="pickupDate1" value={form.pickupDate1} onChange={handleChange} style={inputStyle} />
            </Field>

            <Field label="第2希望">
              <input type="datetime-local" name="pickupDate2" value={form.pickupDate2} onChange={handleChange} style={inputStyle} />
            </Field>

            <Field label="第3希望">
              <input type="datetime-local" name="pickupDate3" value={form.pickupDate3} onChange={handleChange} style={inputStyle} />
            </Field>

            <Field label="やり取り方法">
              <select name="contactMethod" value={form.contactMethod} onChange={handleChange} style={inputStyle}>
                <option value="LINE">LINEでやり取りしたい</option>
                <option value="電話">電話でやり取りしたい</option>
              </select>
            </Field>

            <button type="submit" disabled={submitting} style={submitStyle}>
              {submitting ? "送信中..." : "この内容で送信する"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

/* ===== 共通UI ===== */

const SectionTitle = ({ label }: { label: string }) => (
  <h2 style={{ fontSize: 13, fontWeight: 700, margin: "18px 0 6px" }}>{label}</h2>
);

const Field = ({ label, required, children }: any) => (
  <div style={{ marginBottom: 10 }}>
    <label style={{ fontSize: 12, fontWeight: 600 }}>
      {label}
      {required && <span style={{ color: "#d00" }}>＊</span>}
    </label>
    {children}
  </div>
);

const ErrorBox = ({ children }: any) => (
  <div style={{ background: "#ffe5e5", color: "#b00020", padding: 8, borderRadius: 6 }}>{children}</div>
);

const InfoBox = ({ children }: any) => (
  <div style={{ background: "#e6f7ff", color: "#0050b3", padding: 8, borderRadius: 6 }}>{children}</div>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ddd",
  fontSize: 13,
};

const submitStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 12,
  padding: "10px 16px",
  borderRadius: 999,
  border: "none",
  background: "#00c300",
  color: "white",
  fontWeight: 700,
  fontSize: 15,
};
