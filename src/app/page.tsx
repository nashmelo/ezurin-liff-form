"use client";

import React, { useEffect, useState } from "react";
import liff from "@line/liff";
import styles from "./page.module.css";

const LIFF_ID = "2008636045-8572KPnd";

/* =========================
   型定義
========================= */
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

/* =========================
   初期値
========================= */
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

  /* =========================
     LIFF 初期化
  ========================= */
  useEffect(() => {
    liff.init({ liffId: LIFF_ID }).catch(console.error);
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

    if (
      !form.name ||
      !form.phone ||
      !form.service ||
      !form.pickupDate1 ||
      !form.buildingType ||
      !form.parking ||
      !form.elevator
    ) {
      setError("必須項目が未入力です。");
      return;
    }

    const summaryText = [
      "📩 お問い合わせを受け付けました",
      "",
      "以下の内容で承りました。",
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
      `〒${form.postalCode || "未入力"}`,
      `${form.prefecture}${form.city}${form.address1}`,
      "",
      `建物種類：${form.buildingType}`,
      `駐車場：${form.parking}`,
      `エレベーター：${form.elevator}`,
      "",
      form.service === "引越し"
        ? [
            "■ 引越し先住所",
            `〒${form.movePostalCode || "未入力"}`,
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
      "このトークでそのままやり取りできます。",
      "———",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      setSubmitting(true);

      if (liff.isInClient()) {
        await liff.sendMessages([
          {
            type: "text",
            text: summaryText,
          },
        ]);
      }

      setSubmitted(true);
      setForm(initialFormData);
    } catch (err) {
      console.error(err);
      setError("送信に失敗しました。");
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
        <div className={styles.card}>
          <h1>不用品回収・片付け ご相談フォーム</h1>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {submitted && <p>送信しました。LINEをご確認ください。</p>}

          <form onSubmit={handleSubmit}>
            <input name="name" placeholder="お名前" value={form.name} onChange={handleChange} />
            <input name="phone" placeholder="電話番号（ハイフンなし）" value={form.phone} onChange={handleChange} />

            <input name="postalCode" placeholder="郵便番号" value={form.postalCode} onChange={handleChange} />
            <input name="prefecture" placeholder="都道府県" value={form.prefecture} onChange={handleChange} />
            <input name="city" placeholder="市区町村" value={form.city} onChange={handleChange} />
            <input name="address1" placeholder="番地・建物名" value={form.address1} onChange={handleChange} />

            <select name="buildingType" value={form.buildingType} onChange={handleChange}>
              <option value="">建物種類</option>
              <option value="戸建て">戸建て</option>
              <option value="マンション・アパート">マンション・アパート</option>
              <option value="倉庫">倉庫</option>
              <option value="オフィス">オフィス</option>
              <option value="その他">その他</option>
            </select>

            <select name="parking" value={form.parking} onChange={handleChange}>
              <option value="">駐車場の有無</option>
              <option value="あり">あり</option>
              <option value="なし">なし</option>
            </select>

            <select name="elevator" value={form.elevator} onChange={handleChange}>
              <option value="">エレベーターの有無</option>
              <option value="あり">あり</option>
              <option value="なし">なし</option>
            </select>

            <select name="service" value={form.service} onChange={handleChange}>
              <option value="">ご希望のサービス</option>
              <option value="不用品回収">不用品回収</option>
              <option value="部屋を丸ごと片付け">部屋を丸ごと片付け</option>
              <option value="引越し">引越し</option>
            </select>

            {form.service === "引越し" && (
              <>
                <h3>引越し先住所</h3>
                <input name="movePostalCode" placeholder="郵便番号" value={form.movePostalCode} onChange={handleChange} />
                <input name="movePrefecture" placeholder="都道府県" value={form.movePrefecture} onChange={handleChange} />
                <input name="moveCity" placeholder="市区町村" value={form.moveCity} onChange={handleChange} />
                <input name="moveAddress1" placeholder="番地・建物名" value={form.moveAddress1} onChange={handleChange} />
              </>
            )}

            <textarea
              name="items"
              placeholder="回収・引越しする物の種類・個数"
              value={form.items}
              onChange={handleChange}
            />

            <input type="file" multiple accept="image/*" onChange={handleFileChange} />

            <input type="datetime-local" name="pickupDate1" value={form.pickupDate1} onChange={handleChange} />
            <input type="datetime-local" name="pickupDate2" value={form.pickupDate2} onChange={handleChange} />
            <input type="datetime-local" name="pickupDate3" value={form.pickupDate3} onChange={handleChange} />

            <select name="contactMethod" value={form.contactMethod} onChange={handleChange}>
              <option value="LINE">LINEでやり取りしたい</option>
              <option value="電話">電話でやり取りしたい</option>
            </select>

            <button type="submit" disabled={submitting}>
              {submitting ? "送信中…" : "この内容で送信する"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
