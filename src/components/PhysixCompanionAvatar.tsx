import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { CompanionEmotion, CompanionPointTarget } from '../types/companion';

interface PhysixCompanionAvatarProps {
  emotion: CompanionEmotion;
  pointTarget?: CompanionPointTarget;
  /** Normalized 0..1 speech amplitude driving mouth lip-sync */
  amplitude?: number;
  size?: number;
  reducedMotion?: boolean;
  className?: string;
}

export const PhysixCompanionAvatar: React.FC<PhysixCompanionAvatarProps> = ({
  emotion,
  pointTarget = 'none',
  amplitude = 0,
  size = 64,
  reducedMotion = false,
  className = '',
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Subtle organic eye blinking
  useEffect(() => {
    if (reducedMotion) return;
    let blinkTimeout: number | undefined;
    let openTimeout: number | undefined;

    const scheduleBlink = () => {
      const waitMs = 2800 + Math.floor(Math.random() * 2200);
      blinkTimeout = window.setTimeout(() => {
        setIsBlinking(true);
        openTimeout = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 145);
      }, waitMs);
    };

    scheduleBlink();
    return () => {
      if (blinkTimeout) window.clearTimeout(blinkTimeout);
      if (openTimeout) window.clearTimeout(openTimeout);
    };
  }, [reducedMotion]);

  const pupilOffset =
    pointTarget === 'left_canvas'
      ? { x: -2.2, y: 0.4 }
      : pointTarget === 'right_controls'
        ? { x: 2.2, y: 0.4 }
        : emotion === 'thinking'
          ? { x: 1.5, y: -1.6 }
          : { x: 0, y: 0 };

  const mouthLevel = emotion === 'speaking' ? Math.max(0.15, amplitude) : amplitude;

  // Lip-sync mouth SVG geometry driven by real amplitude
  const renderMouth = () => {
    if (emotion === 'celebrating') {
      return (
        <path
          d="M 41 56 Q 50 66 59 56 Z"
          fill="#6F4E37"
          stroke="#302820"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      );
    }
    if (mouthLevel > 0.58) {
      return (
        <ellipse
          cx="50"
          cy="57.5"
          rx="5.2"
          ry="4.2"
          fill="#6F4E37"
          stroke="#302820"
          strokeWidth="1.5"
        />
      );
    }
    if (mouthLevel > 0.28) {
      return (
        <ellipse
          cx="50"
          cy="57.2"
          rx="4.6"
          ry="2.5"
          fill="#6F4E37"
          stroke="#302820"
          strokeWidth="1.4"
        />
      );
    }
    if (mouthLevel > 0.08) {
      return (
        <path
          d="M 44 56.5 Q 50 60 56 56.5"
          fill="none"
          stroke="#302820"
          strokeWidth="2"
          strokeLinecap="round"
        />
      );
    }
    if (emotion === 'thinking') {
      return (
        <path
          d="M 45.5 57.5 Q 50 56 54.5 57.5"
          fill="none"
          stroke="#302820"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      );
    }
    if (emotion === 'excited') {
      return (
        <path
          d="M 42 55.5 Q 50 63.5 58 55.5"
          fill="none"
          stroke="#302820"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      );
    }
    if (emotion === 'encouraging') {
      return (
        <path
          d="M 43 56.2 Q 50 61.5 57 56.2"
          fill="none"
          stroke="#302820"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      );
    }
    return (
      <path
        d="M 44 56.5 Q 50 61 56 56.5"
        fill="none"
        stroke="#302820"
        strokeWidth="2"
        strokeLinecap="round"
      />
    );
  };

  const renderEyes = () => {
    if (emotion === 'celebrating') {
      return (
        <>
          <path
            d="M 35 45 Q 39 40 43 45"
            fill="none"
            stroke="#302820"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M 57 45 Q 61 40 65 45"
            fill="none"
            stroke="#302820"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </>
      );
    }

    if (isBlinking) {
      return (
        <>
          <line x1="35" y1="45" x2="43" y2="45" stroke="#302820" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="57" y1="45" x2="65" y2="45" stroke="#302820" strokeWidth="2.2" strokeLinecap="round" />
        </>
      );
    }

    return (
      <>
        <ellipse cx="39" cy="44.5" rx="4.2" ry="4.8" fill="#FFFFFF" stroke="#6F4E37" strokeWidth="1.2" />
        <ellipse cx="61" cy="44.5" rx="4.2" ry="4.8" fill="#FFFFFF" stroke="#6F4E37" strokeWidth="1.2" />
        <circle cx={39 + pupilOffset.x} cy={44.5 + pupilOffset.y} r="2.35" fill="#302820" />
        <circle cx={61 + pupilOffset.x} cy={44.5 + pupilOffset.y} r="2.35" fill="#302820" />
        <circle cx={38.2 + pupilOffset.x} cy={43.5 + pupilOffset.y} r="0.9" fill="#FFFFFF" />
        <circle cx={60.2 + pupilOffset.x} cy={43.5 + pupilOffset.y} r="0.9" fill="#FFFFFF" />
      </>
    );
  };

  const armRotateLeft =
    pointTarget === 'left_canvas'
      ? -52
      : pointTarget === 'wave' || emotion === 'celebrating'
        ? -125
        : -8;
  const armRotateRight =
    pointTarget === 'right_controls'
      ? 52
      : emotion === 'celebrating'
        ? 125
        : 8;

  return (
    <motion.div
      style={{ width: size, height: size }}
      animate={
        reducedMotion
          ? undefined
          : emotion === 'celebrating'
            ? { y: [0, -4, 0], scale: [1, 1.04, 1] }
            : { y: [0, -2.5, 0] }
      }
      transition={
        reducedMotion
          ? undefined
          : {
              duration: emotion === 'celebrating' ? 1.2 : 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }
      }
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        role="presentation"
      >
        {/* Soft Lavender Aura Ring */}
        <circle
          cx="50"
          cy="52"
          r="43"
          fill="#E6E0F0"
          stroke="#D8D1CA"
          strokeWidth="1.5"
        />

        {/* Orbiting Celebration Accents when celebrating or excited */}
        {(emotion === 'celebrating' || emotion === 'excited') && (
          <g fill="#6F4E37">
            <circle cx="17" cy="24" r="2.3" />
            <circle cx="83" cy="22" r="2.6" />
            <path d="M 86 42 L 88 46 L 92 48 L 88 50 L 86 54 L 84 50 L 80 48 L 84 46 Z" />
          </g>
        )}

        {/* Thinking indicator dots */}
        {emotion === 'thinking' && (
          <g fill="#6F4E37" opacity="0.8">
            <circle cx="77" cy="24" r="2" />
            <circle cx="83" cy="18" r="2.8" />
          </g>
        )}

        {/* Scholar Coat Shoulders / Torso */}
        <path
          d="M 27 89 C 28 73, 38 69, 50 69 C 62 69, 72 73, 73 89 Z"
          fill="#6F4E37"
          stroke="#302820"
          strokeWidth="1.6"
        />
        <path
          d="M 41 69 L 50 79 L 59 69 Z"
          fill="#F7F5F2"
          stroke="#302820"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Lab Pin */}
        <circle cx="60" cy="80" r="2.6" fill="#E6E0F0" stroke="#302820" strokeWidth="1" />

        {/* Left Articulated Pointer / Waving Arm */}
        <motion.g
          style={{
            transformOrigin: '28px 76px',
          }}
          animate={
            reducedMotion
              ? { rotate: armRotateLeft }
              : pointTarget === 'wave'
                ? { rotate: [-110, -142, -104, -140, -112] }
                : { rotate: armRotateLeft }
          }
          transition={
            reducedMotion
              ? { duration: 0 }
              : pointTarget === 'wave'
                ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.22, ease: 'easeOut' }
          }
        >
          <path
            d="M 28 76 C 18 76, 13 80, 11 85"
            fill="none"
            stroke="#6F4E37"
            strokeWidth="6.2"
            strokeLinecap="round"
          />
          <circle cx="10.5" cy="85.5" r="3.4" fill="#F7F5F2" stroke="#302820" strokeWidth="1.3" />
        </motion.g>

        {/* Right Articulated Pointer Arm */}
        <g
          style={{
            transform: `rotate(${armRotateRight}deg)`,
            transformOrigin: '72px 76px',
            transition: reducedMotion ? 'none' : 'transform 220ms ease-out',
          }}
        >
          <path
            d="M 72 76 C 82 76, 87 80, 89 85"
            fill="none"
            stroke="#6F4E37"
            strokeWidth="6.2"
            strokeLinecap="round"
          />
          <circle cx="89.5" cy="85.5" r="3.4" fill="#F7F5F2" stroke="#302820" strokeWidth="1.3" />
        </g>

        {/* Head / Helmet Dome */}
        <rect
          x="26"
          y="25"
          width="48"
          height="42"
          rx="20"
          fill="#F7F5F2"
          stroke="#302820"
          strokeWidth="1.8"
        />

        {/* Antennae / Scientific Crest */}
        <line x1="50" y1="25" x2="50" y2="17" stroke="#6F4E37" strokeWidth="2.4" strokeLinecap="round" />
        <circle
          cx="50"
          cy="14.5"
          r="3.8"
          fill={emotion === 'speaking' || emotion === 'excited' || emotion === 'celebrating' ? '#E6E0F0' : '#6F4E37'}
          stroke="#302820"
          strokeWidth="1.3"
        />

        {/* Science Goggle Rim on Forehead */}
        <rect
          x="29"
          y="27"
          width="42"
          height="10"
          rx="5"
          fill="#6F4E37"
          stroke="#302820"
          strokeWidth="1.2"
        />
        <rect x="33" y="29" width="14" height="6" rx="3" fill="#E6E0F0" />
        <rect x="53" y="29" width="14" height="6" rx="3" fill="#E6E0F0" />

        {/* Subtle Cheek Warmth */}
        <ellipse cx="32" cy="52" rx="3.2" ry="1.8" fill="#E8B4A0" opacity="0.55" />
        <ellipse cx="68" cy="52" rx="3.2" ry="1.8" fill="#E8B4A0" opacity="0.55" />

        {/* Eyes & Lip-Synced Mouth */}
        {renderEyes()}
        {renderMouth()}
      </svg>
    </motion.div>
  );
};
