"use client";

import React, { useState, useEffect } from "react";
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

/* =========================
   メイン
========================= */

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

  /* =========================
     郵便番号検索
  ========================= */

  const lookupAddressFromPostalCode = async (zipcode: string) => {
    if (!/^\d{7}$/.test(zipcode)) return;

    setPostalStatus("住所を検索しています…");
    try {
      const res = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`
      );
      const data = await res.json();

      if (data.status === 200 && data.results?.[0]) {
        const r = data.results[0];
        setForm((p) => ({
          ...p,
          prefecture: r.address1,
          city: `${r.address2}${r.address3}`,
        }));
        setPostalStatus(null);
      } else {
        setPostalStatus("住所が見つかりませんでした");
      }
    } catch {
      setPostalStatus("住所検索に失敗しました");
    }
  };

  const lookupMoveAddressFromPostalCode = async (zipcode: string) => {
    if (!/^\d{7}$/.test(zipcode)) return;

    setMovePostalStatus("住所を検索しています…");
    try {
      const res = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`
      );
      const data = await res.json();

      if (data.status === 200 && data.results?.[0]) {
        const r = data.results[0];
        setForm((p) => ({
          ...p,
          movePrefecture: r.address1,
          moveCity: `${r.address2}${r.address3}`,
        }));
        setMovePostalStatus(null);
      } else {
        setMovePostalStatus("住所が見つかりませんでした");
      }
    } catch {
      setMovePostalStatus("住所検索に失敗しました");
    }
  };

  /* =========================
     入力処理
  ========================= */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "postalCode") {
      const v = value.replace(/\D/g, "");
      setForm((p) => ({ ...p, postalCode: v }));
      if (v.length === 7) lookupAddressFromPostalCode(v);
      return;
    }

    if (name === "movePostalCode") {
      const v = value.replace(/\D/g, "");
      setForm((p) => ({ ...p, movePostalCode: v }));
      if (v.length === 7) lookupMoveAddressFromPostalCode(v);
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

  /* =========================
     送信
  ========================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.phone || !form.service || !form.pickupDate1) {
      setError("お名前・電話番号・ご希望サービス・第1希望日時は必須です。");
      return;
    }

    if (
      !form.postalCode ||
      !/^\d{7}$/.test(form.postalCode) ||
      !form.prefecture ||
      !form.city ||
      !form.address1
    ) {
      setError("回収現場住所はすべて必須です。");
      return;
    }

    if (
      form.service === "引越し" &&
      (!form.movePostalCode ||
        !/^\d{7}$/.test(form.movePostalCode) ||
        !form.movePrefecture ||
        !form.moveCity ||
        !form.moveAddress1)
    ) {
      setError("引越し先住所はすべて必須です。");
      return;
    }

    if (!form.items.trim()) {
      setError("回収・引越しする物の種類・個数は必須です。");
      return;
    }

    const summaryText = [
      "📩 お問い合わせを受け付けました",
      "",
      `【お名前】${form.name}`,
      `【電話番号】${form.phone}`,
      `【やり取り】${form.contactMethod}`,
      "",
      "■ ご希望サービス",
      form.service,
      "",
      "■ 回収現場住所",
      `〒${form.postalCode}`,
      `${form.prefecture}${form.city}${form.address1}`,
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
      form.items,
      "",
      `■ 添付画像：${form.images.length}枚`,
    ].join("\n");

    try {
      setSubmitting(true);
      if (liff.isInClient()) {
        await liff.sendMessages([{ type: "text", text: summaryText }]);
      }
      setSubmitted(true);
      setForm(initialFormData);
    } catch {
      setError("送信中にエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     UI
  ========================= */

  return (
    <main
      className={styles.main}
      style={{ minHeight: "100vh", background: "#f5f5f5", padding: 16 }}
    >
      <div
        className={styles.center}
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
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
          {/* UI本体（ここはあなたの貼ってくれた構造そのまま） */}
          {/* …以降は省略せず、今のUIコードをそのまま使用してください */}
        </div>
      </div>
    </main>
  );
}

/* =========================
   共通コンポーネント
========================= */

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

const Field: React.FC<FieldProps> = ({ label, required, children }) => (
  <div style={{ marginBottom: 10 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
      {label}
      {required && <span style={{ color: "#d00", marginLeft: 4 }}>＊</span>}
    </label>
    {children}
  </div>
);

const SectionTitle: React.FC<{ label: string }> = ({ label }) => (
  <h2
    style={{
      fontSize: 13,
      fontWeight: 700,
      marginTop: 18,
      marginBottom: 6,
      borderLeft: "3px solid #00c300",
      paddingLeft: 8,
      color: "#111",
    }}
  >
    {label}
  </h2>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ddd",
  fontSize: 13,
  boxSizing: "border-box",
  background: "#fff",
  color: "#111",
};

const dateTimeInputStyle: React.CSSProperties = {
  ...inputStyle,
};

const submitButtonStyle = (submitting: boolean): React.CSSProperties => ({
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
});
