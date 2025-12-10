"use client";

import React, { useState, useEffect } from "react";
import liff from "@line/liff";
import styles from "./page.module.css";

const LIFF_ID = "2008636045-8572KPnd"; // ★本番用 LIFF ID に変更

type FormData = {
  name: string;
  lineName: string;
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
  movePostalCode: string;
  movePrefecture: string;
  moveCity: string;
  moveAddress1: string;
  pickupDate1: string;
  pickupDate2: string;
  pickupDate3: string;
};

const initialFormData: FormData = {
  name: "",
  lineName: "",
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
  movePostalCode: "",
  movePrefecture: "",
  moveCity: "",
  moveAddress1: "",
  pickupDate1: "",
  pickupDate2: "",
  pickupDate3: "",
};

export default function Home() {
  const [form, setForm] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [postalStatus, setPostalStatus] = useState<string | null>(null);
  const [movePostalStatus, setMovePostalStatus] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // 🔰 LIFF 初期化（LINE名だけ自動取得）
  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();

        setForm((prev) => ({
          ...prev,
          lineName: prev.lineName || profile.displayName,
        }));
      } catch (e) {
        console.error("LIFF init error", e);
        setLiffError(
          "LINEとの連携に失敗しましたが、フォームの入力・送信は可能です。"
        );
      }
    };

    if (typeof window !== "undefined") {
      initLiff();
    }
  }, []);

  // 郵便番号 → 回収現場住所
  const lookupAddressFromPostalCode = async (zipcode: string) => {
    if (!zipcode || zipcode.length !== 7) return;
    setPostalStatus("住所を検索しています…");

    try {
      const res = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${encodeURIComponent(
          zipcode
        )}`
      );
      const data = await res.json();

      if (data.status === 200 && data.results && data.results[0]) {
        const r = data.results[0];
        const prefecture = r.address1 || "";
        const city = `${r.address2 || ""}${r.address3 || ""}`.trim();

        setForm((prev) => ({
          ...prev,
          prefecture: prev.prefecture || prefecture,
          city: prev.city || city,
        }));
        setPostalStatus(null);
      } else {
        setPostalStatus("住所が見つかりませんでした。手入力してください。");
      }
    } catch (e) {
      console.error(e);
      setPostalStatus("住所検索に失敗しました。手入力してください。");
    }
  };

  // 郵便番号 → 引越し先住所
  const lookupMoveAddressFromPostalCode = async (zipcode: string) => {
    if (!zipcode || zipcode.length !== 7) return;
    setMovePostalStatus("住所を検索しています…");

    try {
      const res = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${encodeURIComponent(
          zipcode
        )}`
      );
      const data = await res.json();

      if (data.status === 200 && data.results && data.results[0]) {
        const r = data.results[0];
        const prefecture = r.address1 || "";
        const city = `${r.address2 || ""}${r.address3 || ""}`.trim();

        setForm((prev) => ({
          ...prev,
          movePrefecture: prev.movePrefecture || prefecture,
          moveCity: prev.moveCity || city,
        }));
        setMovePostalStatus(null);
      } else {
        setMovePostalStatus(
          "住所が見つかりませんでした。手入力してください。"
        );
      }
    } catch (e) {
      console.error(e);
      setMovePostalStatus("住所検索に失敗しました。手入力してください。");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "postalCode") {
      const digits = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, postalCode: digits }));

      if (digits.length === 7) {
        lookupAddressFromPostalCode(digits);
      } else {
        setPostalStatus(null);
      }
      return;
    }

    if (name === "movePostalCode") {
      const digits = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, movePostalCode: digits }));

      if (digits.length === 7) {
        lookupMoveAddressFromPostalCode(digits);
      } else {
        setMovePostalStatus(null);
      }
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({
      ...prev,
      images: files,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.phone || !form.service) {
      setError("お名前・電話番号・ご希望サービスは必須です。");
      return;
    }

    try {
      setSubmitting(true);

      // ✏️ トークに流すまとめテキストを生成
      const summaryLines = [
        "💬 お問い合わせありがとうございます！",
        "",
        "以下の内容でご相談を承りました。",
        "",
        `【お名前】${form.name}`,
        `【LINE名】${form.lineName || "（未入力）"}`,
        `【電話番号】${form.phone}`,
        "",
        "■ 回収現場住所",
        `〒${form.postalCode || "（未入力）"}`,
        `${form.prefecture || ""}${form.city || ""}${form.address1 || ""}`,
        `${form.building || ""}`,
        "",
        `【建物種類】${form.buildingType || "（未入力）"}`,
        `【駐車場】${form.parking || "（未入力）"}`,
        `【エレベーター】${form.elevator || "（未入力）"}`,
        "",
        `■ ご希望サービス：${form.service}`,
      ];

      if (form.service === "引越し") {
        summaryLines.push(
          "",
          "■ 引越し先住所",
          `〒${form.movePostalCode || "（未入力）"}`,
          `${form.movePrefecture || ""}${form.moveCity || ""}${
            form.moveAddress1 || ""
          }`
        );
      }

      summaryLines.push(
        "",
        "■ お引き取り希望日時",
        `第1希望：${form.pickupDate1 || "（未入力）"}`,
        `第2希望：${form.pickupDate2 || "（未入力）"}`,
        `第3希望：${form.pickupDate3 || "（未入力）"}`
      );

      if (form.note) {
        summaryLines.push("", "■ ご相談内容・回収希望物", form.note);
      }

      if (form.images.length > 0) {
        summaryLines.push(
          "",
          `■ 添付画像枚数：${form.images.length}枚`
        );
      }

      const summaryText = summaryLines.join("\n");

      console.log("送信データ（デバッグ用）:", {
        ...form,
        images: form.images.map((f) => f.name),
      });

      // 🔔 LINEトークにユーザー名義でメッセージ送信
      if (liff.isInClient()) {
        try {
          await liff.sendMessages([
            {
              type: "text",
              text: summaryText,
            },
          ]);
        } catch (err) {
          console.error("liff.sendMessages error", err);
        }
      } else {
        console.log("LINEアプリ外からのアクセスのため、sendMessagesはスキップ");
      }

      // （このあと /api/form や kintone 連携を追加予定）

      await new Promise((resolve) => setTimeout(resolve, 400));

      setSubmitted(true);
      setForm(initialFormData);
      setFileInputKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      setError(
        "送信中にエラーが発生しました。時間をおいて再度お試しください。"
      );
    } finally {
      setSubmitting(false);
    }
  };

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

          {liffError && (
            <div
              style={{
                background: "#fff7e6",
                color: "#ad6800",
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              {liffError}
            </div>
          )}

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
              送信ありがとうございました。トーク画面のメッセージと、担当者からの返信をお待ちください。
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* お客様情報 */}
            <SectionTitle label="お客様情報" />

            <Field label="お名前（本名）" required>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                type="text"
                placeholder="山田 太郎"
                style={inputStyle}
              />
            </Field>

            <Field label="LINEのお名前（自動取得）">
              <input
                name="lineName"
                value={form.lineName}
                onChange={handleChange}
                type="text"
                placeholder="LINE上の表示名"
                style={inputStyle}
              />
            </Field>

            <Field label="電話番号" required>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                placeholder="09012345678"
                style={inputStyle}
              />
            </Field>

            {/* 回収現場住所 */}
            <SectionTitle label="回収現場住所" />

            <Field label="郵便番号（7桁）">
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                type="text"
                placeholder="1234567"
                style={inputStyle}
              />
              {postalStatus && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: "#888",
                  }}
                >
                  {postalStatus}
                </div>
              )}
            </Field>

            <Field label="都道府県">
              <input
                name="prefecture"
                value={form.prefecture}
                onChange={handleChange}
                type="text"
                placeholder="栃木県"
                style={inputStyle}
              />
            </Field>

            <Field label="市区町村">
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                type="text"
                placeholder="大田原市 浅香"
                style={inputStyle}
              />
            </Field>

            <Field label="番地">
              <input
                name="address1"
                value={form.address1}
                onChange={handleChange}
                type="text"
                placeholder="2-3391-11"
                style={inputStyle}
              />
            </Field>

            <Field label="建物名・部屋番号（任意）">
              <input
                name="building"
                value={form.building}
                onChange={handleChange}
                type="text"
                placeholder="DIシオンスクエア302"
                style={inputStyle}
              />
            </Field>

            <Field label="建物種類">
              <select
                name="buildingType"
                value={form.buildingType}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">選択してください</option>
                <option value="戸建て">戸建て</option>
                <option value="マンション・アパート">
                  マンション・アパート
                </option>
                <option value="事務所・店舗">事務所・店舗</option>
                <option value="その他">その他</option>
              </select>
            </Field>

            <Field label="駐車場の有無">
              <select
                name="parking"
                value={form.parking}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">選択してください</option>
                <option value="あり">あり</option>
                <option value="なし">なし</option>
              </select>
            </Field>

            <Field label="エレベーターの有無">
              <select
                name="elevator"
                value={form.elevator}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">選択してください</option>
                <option value="あり">あり</option>
                <option value="なし">なし</option>
              </select>
            </Field>

            {/* ご希望内容 */}
            <SectionTitle label="ご希望のサービス" />

            <Field label="サービス内容" required>
              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">選択してください</option>
                <option value="不用品回収">不用品回収</option>
                <option value="遺品整理・生前整理">遺品整理・生前整理</option>
                <option value="ゴミ屋敷片付け">ゴミ屋敷片付け</option>
                <option value="引越し">引越し</option>
                <option value="その他">その他</option>
              </select>
            </Field>

            {form.service === "引越し" && (
              <>
                <SectionTitle label="引越し先住所" />

                <Field label="引越し先 郵便番号（7桁）">
                  <input
                    name="movePostalCode"
                    value={form.movePostalCode}
                    onChange={handleChange}
                    type="text"
                    placeholder="1234567"
                    style={inputStyle}
                  />
                  {movePostalStatus && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        color: "#888",
                      }}
                    >
                      {movePostalStatus}
                    </div>
                  )}
                </Field>

                <Field label="引越し先 都道府県">
                  <input
                    name="movePrefecture"
                    value={form.movePrefecture}
                    onChange={handleChange}
                    type="text"
                    placeholder="東京都"
                    style={inputStyle}
                  />
                </Field>

                <Field label="引越し先 市区町村">
                  <input
                    name="moveCity"
                    value={form.moveCity}
                    onChange={handleChange}
                    type="text"
                    placeholder="新宿区 西新宿"
                    style={inputStyle}
                  />
                </Field>

                <Field label="引越し先 番地・建物名">
                  <input
                    name="moveAddress1"
                    value={form.moveAddress1}
                    onChange={handleChange}
                    type="text"
                    placeholder="1-2-3 ○○マンション101"
                    style={inputStyle}
                  />
                </Field>
              </>
            )}

            {/* 希望日時 */}
            <SectionTitle label="お引き取り希望日時" />

            <Field label="第1希望（任意）">
              <input
                name="pickupDate1"
                value={form.pickupDate1}
                onChange={handleChange}
                type="datetime-local"
                style={dateTimeInputStyle}
              />
            </Field>

            <Field label="第2希望（任意）">
              <input
                name="pickupDate2"
                value={form.pickupDate2}
                onChange={handleChange}
                type="datetime-local"
                style={dateTimeInputStyle}
              />
            </Field>

            <Field label="第3希望（任意）">
              <input
                name="pickupDate3"
                value={form.pickupDate3}
                onChange={handleChange}
                type="datetime-local"
                style={dateTimeInputStyle}
              />
            </Field>

            <Field label="ご相談内容・回収希望物（任意）">
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows={4}
                placeholder="間取り（例：2DK）やおおよその荷物量、希望日程などをご記入ください。"
              />
            </Field>

            <Field label="添付画像（任意・複数可）">
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                style={inputStyle}
              />
              {form.images.length > 0 && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: "#555",
                  }}
                >
                  選択中:
                  {form.images.map((f) => f.name).join(" / ")}
                </div>
              )}
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

// 小コンポーネント
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

const SectionTitle: React.FC<{ label: string }> = ({ label }) => (
  <h2
    style={{
      fontSize: 13,
      fontWeight: 700,
      marginTop: 18,
      marginBottom: 6,
      borderLeft: "3px solid #00c300",
      paddingLeft: 8,
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
};

const dateTimeInputStyle: React.CSSProperties = {
  ...inputStyle,
  width: "96%",
  margin: "0 auto",
};