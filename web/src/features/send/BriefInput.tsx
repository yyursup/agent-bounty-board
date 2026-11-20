"use client";

import { useState, type DragEvent } from "react";

import { ATTACHMENT_MAX_LABEL, ATTACHMENT_TYPES } from "@/lib/bounty/brief";
import { formatBytes } from "@/lib/format";

import styles from "./SendJob.module.css";
import type { SendForm } from "./useSendForm";

/** The brief, written out or attached as a file dropped into an envelope. */
export function BriefInput({ form }: { form: SendForm }) {
  const { mode, text, summary, file } = form.fields;
  return (
    <div className={styles.field}>
      <div className={styles.briefHead}>
        <span id="brief-label" className={styles.labelText}>
          The brief
        </span>
        <div role="radiogroup" aria-labelledby="brief-label" className={styles.segment}>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "write"}
            onClick={() => form.set.mode("write")}
          >
            Write it
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "attach"}
            onClick={() => form.set.mode("attach")}
          >
            <PaperclipIcon />
            Attach a file
          </button>
        </div>
      </div>

      {mode === "write" ? (
        <textarea
          aria-labelledby="brief-label"
          className={styles.input}
          rows={5}
          value={text}
          onChange={(e) => form.set.text(e.target.value)}
        />
      ) : (
        <>
          {file ? (
            <div className={styles.fileCard}>
              <span className={styles.fileBadge} aria-hidden="true">
                {file.name.split(".").pop()?.toUpperCase().slice(0, 4)}
              </span>
              <span className={styles.fileName}>
                <strong>{file.name}</strong>
                <span className="mono">{formatBytes(file.size)} · ready to pin</span>
              </span>
              <button type="button" className={styles.remove} onClick={() => form.set.file(null)}>
                Remove
              </button>
            </div>
          ) : (
            <Dropzone onFile={form.set.file} />
          )}
          <label className={styles.field}>
            <span className={styles.labelText}>
              A line for the stamp{" "}
              <span className={styles.note}>agents read this before opening the file</span>
            </span>
            <input
              className={styles.input}
              type="text"
              value={summary}
              placeholder="e.g. Summarize the attached paper for non-developers"
              onChange={(e) => form.set.summary(e.target.value)}
            />
          </label>
        </>
      )}
      <span className={styles.note}>
        Written or attached, the brief is pinned to IPFS when you post and anyone can read it. Don’t
        include anything private.
      </span>
    </div>
  );
}

/** A drop target shaped like an envelope whose flap opens while a file hovers over it. */
function Dropzone({ onFile }: { onFile: (file: File | null) => string | null }) {
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const take = (f: File | undefined) => {
    setOver(false);
    if (f) setError(onFile(f));
  };

  return (
    <>
      <label
        className={`${styles.drop} ${over ? styles.dropOver : ""}`}
        onDragOver={(e: DragEvent) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={(e: DragEvent) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
        }}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          take(e.dataTransfer.files[0]);
        }}
      >
        <input
          type="file"
          className="visually-hidden"
          accept={ATTACHMENT_TYPES.join(",")}
          onChange={(e) => take(e.target.files?.[0])}
        />
        <svg
          className={styles.envelope}
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="8"
            y="20"
            width="40"
            height="28"
            rx="3"
            fill="#fff"
            stroke="var(--cobalt)"
            strokeWidth="2"
          />
          <path d="M8 46l15-12M48 46L33 34" stroke="var(--cobalt)" strokeWidth="2" />
          <path className={styles.flap} d="M8 20h40L28 36z" fill="var(--cobalt)" />
          <circle cx="46" cy="14" r="8" fill="var(--coral)" />
          <path d="M46 10.5v7M42.5 14h7" stroke="#fff" strokeWidth="2" />
        </svg>
        <strong>
          {over ? "Let go, the envelope is open" : "Drop the brief here, or choose a file"}
        </strong>
        <span className="mono">PDF, DOC, DOCX, MD or TXT · up to {ATTACHMENT_MAX_LABEL}</span>
      </label>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </>
  );
}

function PaperclipIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M13.5 7.5l-5.6 5.6a3.2 3.2 0 01-4.5-4.5l5.9-5.9a2.1 2.1 0 013 3l-5.8 5.8a1 1 0 01-1.5-1.5l5.2-5.2" />
    </svg>
  );
}
