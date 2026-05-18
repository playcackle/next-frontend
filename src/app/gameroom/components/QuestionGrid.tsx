"use client";

import React, { useState } from "react";
import { Slot } from "../types/state";
import styles from "./QuestionGrid.module.css";

interface QuestionGridProps {
  slots: Slot[];
}

type ViewMode = "list" | "carousel";

export const QuestionGrid: React.FC<QuestionGridProps> = ({ slots }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const totalSlots = slots.length;
  const currentSlot = slots[carouselIndex] ?? null;

  function handlePrev() {
    setCarouselIndex((i) => (i - 1 + totalSlots) % totalSlots);
  }

  function handleNext() {
    setCarouselIndex((i) => (i + 1) % totalSlots);
  }

  return (
    <div className={styles.questionGridContainer}>
      {/* View mode toggle */}
      <div className={styles.viewToggleBar}>
        <span className={styles.viewToggleLabel}>Questions</span>
        <div className={styles.viewTogglePills}>
          <button
            className={`${styles.viewTogglePill} ${viewMode === "list" ? styles.viewTogglePillActive : ""}`}
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <rect x="0" y="1" width="14" height="2" rx="1" fill="currentColor" />
              <rect x="0" y="6" width="14" height="2" rx="1" fill="currentColor" />
              <rect x="0" y="11" width="14" height="2" rx="1" fill="currentColor" />
            </svg>
            List
          </button>
          <button
            className={`${styles.viewTogglePill} ${viewMode === "carousel" ? styles.viewTogglePillActive : ""}`}
            onClick={() => setViewMode("carousel")}
            aria-pressed={viewMode === "carousel"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <rect x="2" y="1" width="10" height="12" rx="2" fill="currentColor" opacity="0.3" />
              <rect x="0" y="3" width="2" height="8" rx="1" fill="currentColor" opacity="0.5" />
              <rect x="12" y="3" width="2" height="8" rx="1" fill="currentColor" opacity="0.5" />
              <rect x="3" y="3" width="8" height="8" rx="1" fill="currentColor" />
            </svg>
            One at a time
          </button>
        </div>
      </div>

      {/* List view */}
      {viewMode === "list" && (
        <div className={styles.questionList}>
          {slots.length === 0 && (
            <p className={styles.emptyState}>No questions yet — waiting for the round to start.</p>
          )}
          {slots.map((slot, index) => (
            <div
              key={slot.id}
              className={`${styles.questionListItem} ${slot.is_snapped ? styles.questionListItemSnapped : ""} ${slot.is_rare ? styles.questionListItemRare : ""}`}
            >
              <span className={styles.questionListIndex}>{index + 1}</span>
              <div className={styles.questionListContent}>
                <span className={styles.questionListText}>
                  {slot.is_snapped
                    ? slot.canonical_text
                    : slot.text_preview
                      ? slot.text_preview
                      : "???"}
                </span>
                {slot.is_snapped && slot.snapped_by_display_name && (
                  <span className={styles.questionListSnappedBy}>
                    {slot.snapped_by_display_name}
                  </span>
                )}
              </div>
              {slot.is_rare && (
                <span className={styles.questionListBadge}>2x</span>
              )}
              {slot.is_snapped && (
                <span className={styles.questionListCheck} aria-label="Found">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Carousel view */}
      {viewMode === "carousel" && (
        <div className={styles.carousel}>
          {slots.length === 0 ? (
            <p className={styles.emptyState}>No questions yet — waiting for the round to start.</p>
          ) : (
            <>
              <div className={styles.carouselTrack}>
                <button
                  className={styles.carouselArrow}
                  onClick={handlePrev}
                  aria-label="Previous question"
                  disabled={totalSlots <= 1}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div
                  className={`${styles.carouselCard} ${currentSlot?.is_snapped ? styles.carouselCardSnapped : ""} ${currentSlot?.is_rare ? styles.carouselCardRare : ""}`}
                >
                  {currentSlot ? (
                    <>
                      <span className={styles.carouselCounter}>
                        {carouselIndex + 1} / {totalSlots}
                      </span>
                      <p className={styles.carouselQuestion}>
                        {currentSlot.is_snapped
                          ? currentSlot.canonical_text
                          : currentSlot.text_preview
                            ? currentSlot.text_preview
                            : "???"}
                      </p>
                      {currentSlot.is_rare && (
                        <span className={styles.carouselBonusBadge}>2x Bonus</span>
                      )}
                      {currentSlot.is_snapped && (
                        <div className={styles.carouselSnappedInfo}>
                          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>
                            {currentSlot.snapped_by_display_name
                              ? `Found by ${currentSlot.snapped_by_display_name}`
                              : "Found!"}
                          </span>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>

                <button
                  className={styles.carouselArrow}
                  onClick={handleNext}
                  aria-label="Next question"
                  disabled={totalSlots <= 1}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Dot pagination */}
              <div className={styles.carouselDots} role="tablist" aria-label="Question navigation">
                {slots.map((slot, i) => (
                  <button
                    key={slot.id}
                    role="tab"
                    aria-selected={i === carouselIndex}
                    aria-label={`Question ${i + 1}`}
                    className={`${styles.carouselDot} ${i === carouselIndex ? styles.carouselDotActive : ""} ${slot.is_snapped ? styles.carouselDotSnapped : ""}`}
                    onClick={() => setCarouselIndex(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(QuestionGrid);
