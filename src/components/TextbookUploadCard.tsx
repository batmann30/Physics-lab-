import React, { useRef, useState } from 'react';
import { Camera, Upload, RotateCw, Trash2, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import type { LanguageCode, TextbookAnalysisResult } from '../types/physics';
import type { TranslationBundle } from '../i18n/translations';
import {
  analyzeTextbookPage,
  isSupportedImageFile,
  prepareTextbookImage,
  type PreparedImagePayload,
} from '../services/textbookApi';

interface TextbookUploadCardProps {
  language: LanguageCode;
  t: TranslationBundle;
  geminiConfigured: boolean | null;
  onAnalysisComplete: (
    result: TextbookAnalysisResult,
    fileName: string,
    previewUrl: string,
    rawImage?: { base64: string; mimeType: string }
  ) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const TextbookUploadCard: React.FC<TextbookUploadCardProps> = ({
  language,
  t,
  geminiConfigured,
  onAnalysisComplete,
  fileInputRef: externalInputRef,
}) => {
  const internalFileRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const browseInputRef = externalInputRef ?? internalFileRef;
  const inFlightRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const [prepared, setPrepared] = useState<PreparedImagePayload | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoNote, setInfoNote] = useState<string | null>(null);

  const handleSelectedFile = async (file: File | undefined) => {
    if (!file || inFlightRef.current) return;
    setErrorMsg(null);
    setInfoNote(null);

    if (file.size === 0) {
      setErrorMsg(t.upload.emptyUploadError);
      return;
    }

    if (!isSupportedImageFile(file)) {
      setErrorMsg(t.upload.unsupportedTypeError);
      return;
    }

    setIsPreparing(true);
    try {
      const payload = await prepareTextbookImage(file);
      setPrepared(payload);
      setFileName(file.name);
      if (payload.wasResized) {
        setInfoNote(t.upload.fileTooLargeWarning);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.upload.fileReadError;
      setErrorMsg(message);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (inFlightRef.current || isAnalyzing) return;
    const file = e.dataTransfer.files?.[0];
    void handleSelectedFile(file);
  };

  const handleClear = () => {
    if (inFlightRef.current || isAnalyzing) return;
    setPrepared(null);
    setFileName('');
    setUploadProgress(0);
    setErrorMsg(null);
    setInfoNote(null);
    if (browseInputRef.current) browseInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (inFlightRef.current || isAnalyzing) return;
    if (!prepared) {
      setErrorMsg(t.upload.emptyUploadError);
      return;
    }

    inFlightRef.current = true;
    setErrorMsg(null);
    setIsAnalyzing(true);
    setUploadProgress(0);

    try {
      const result = await analyzeTextbookPage(
        {
          imageBase64: prepared.base64,
          mimeType: prepared.mimeType,
          language,
        },
        (pct) => setUploadProgress(pct)
      );
      onAnalysisComplete(result, fileName, prepared.previewDataUrl, {
        base64: prepared.base64,
        mimeType: prepared.mimeType,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to analyze textbook image.';
      setErrorMsg(msg);
    } finally {
      inFlightRef.current = false;
      setIsAnalyzing(false);
    }
  };

  const formattedSize = prepared
    ? prepared.fileSizeBytes >= 1024 * 1024
      ? `${(prepared.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(prepared.fileSizeBytes / 1024)} KB`
    : '';

  return (
    <section
      id="textbook-upload-section"
      aria-labelledby="upload-card-title"
      className="bg-white rounded-2xl border border-[#D8D1CA] shadow-xs p-6 sm:p-8 flex flex-col justify-between"
    >
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <h2 id="upload-card-title" className="text-xl sm:text-2xl font-semibold text-[#302820]">
            {t.upload.title}
          </h2>
          <span className="text-xs font-medium text-[#756B63]">
            JPG · JPEG · PNG · WEBP
          </span>
        </div>
        <p className="text-sm text-[#756B63] mb-5 leading-relaxed">
          {t.upload.subtitle}
        </p>

        {/* Hidden File Inputs */}
        <input
          ref={browseInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => void handleSelectedFile(e.target.files?.[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => void handleSelectedFile(e.target.files?.[0])}
        />

        {/* Drop Zone or Preview */}
        {!prepared ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed transition-colors duration-150 p-7 sm:p-9 text-center ${
              isDragging
                ? 'border-[#6F4E37] bg-[#E6E0F0]/35'
                : 'border-[#D8D1CA] bg-[#F7F5F2]/70 hover:border-[#6F4E37]/60'
            }`}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#E6E0F0] text-[#6F4E37] flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>

            {isPreparing ? (
              <p className="text-sm font-medium text-[#302820]">{t.upload.optimizingImage}</p>
            ) : (
              <>
                <p className="text-sm sm:text-base font-medium text-[#302820] mb-1.5">
                  {t.upload.dropHint}
                </p>
                <p className="text-xs text-[#756B63] mb-6">{t.upload.supportedFormats}</p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => browseInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#6F4E37] text-white text-sm font-medium hover:bg-[#5C402C] transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{t.upload.browseButton}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E6E0F0] text-[#302820] text-sm font-medium hover:bg-[#DCD3EA] transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Camera className="w-4 h-4 text-[#6F4E37]" />
                    <span>{t.upload.cameraButton}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[#D8D1CA] bg-[#F7F5F2] overflow-hidden">
            <div className="relative bg-[#E5E4E2]/50 flex items-center justify-center max-h-72 overflow-hidden">
              <img
                src={prepared.previewDataUrl}
                alt="Uploaded NCERT physics textbook preview"
                className="max-h-72 w-full object-contain"
              />
            </div>

            <div className="p-4 border-t border-[#D8D1CA] bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#302820] truncate max-w-[240px] sm:max-w-xs">
                  {fileName}
                </p>
                <p className="text-xs text-[#756B63] font-mono-tabular">
                  {prepared.width} × {prepared.height} px · {formattedSize}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => browseInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D8D1CA] text-xs font-medium text-[#302820] hover:bg-[#F7F5F2] disabled:opacity-50 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{t.upload.replaceButton}</span>
                </button>
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D8D1CA] text-xs font-medium text-[#756B63] hover:text-[#302820] hover:bg-[#F7F5F2] disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.upload.removeButton}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Note / Resizing Feedback */}
        {infoNote && (
          <p className="mt-3 text-xs text-[#756B63] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#6F4E37] shrink-0" />
            <span>{infoNote}</span>
          </p>
        )}

        {/* Error Display */}
        {errorMsg && (
          <div
            role="alert"
            className="mt-4 p-3.5 rounded-xl bg-[#FDF2F0] border border-[#E5B8B0] text-sm text-[#7A271A] flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload & AI Progress Bar */}
        {isAnalyzing && (
          <div className="mt-4 space-y-2 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] p-3">
            <div className="flex items-center justify-between text-xs font-medium text-[#302820]">
              <span>
                {uploadProgress < 100
                  ? `1/3 · ${t.upload.uploadingLabel}`
                  : `2/3 · ${t.upload.analyzingLabel}`}
              </span>
              <span className="font-mono-tabular">{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#E5E4E2] overflow-hidden">
              <div
                className="h-full bg-[#6F4E37] transition-all duration-200"
                style={{ width: `${Math.max(12, uploadProgress)}%` }}
              />
            </div>
            <p className="text-[11px] text-[#756B63]">
              {uploadProgress < 100
                ? 'Sending compressed textbook image to PHYSIX AI vision pipeline...'
                : 'Identifying physics concepts, apparatus, equations, and checking existing NCERT simulations...'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Row */}
      <div className="mt-6 pt-5 border-t border-[#D8D1CA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-[#756B63] leading-relaxed">
          {geminiConfigured === false
            ? t.upload.aiStatusMissingKey
            : t.upload.aiStatusReady}
        </p>

        <button
          type="button"
          disabled={!prepared || isAnalyzing || isPreparing}
          onClick={() => void handleAnalyze()}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#6F4E37] text-white text-sm font-semibold hover:bg-[#5C402C] disabled:bg-[#D8D1CA] disabled:text-[#756B63] disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[44px]"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAnalyzing ? t.upload.analyzingLabel : t.upload.analyzeButton}</span>
        </button>
      </div>
    </section>
  );
};
