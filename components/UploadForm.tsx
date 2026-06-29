"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X, Music } from "lucide-react";
import { UploadSchema, UploadFormData, VOICE_OPTIONS } from "@/lib/zod";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = "Processing your book...",
}) => {
  if (!isVisible) return null;

  return (
    <div className="loading-wrapper">
      <div className="loading-shadow-wrapper bg-white">
        <div className="loading-shadow">
          <div className="loading-animation">
            <Music size={32} className="text-[#663820]" />
          </div>
          <div className="loading-title">{message}</div>
          <div className="loading-progress">
            <div className="loading-progress-item">
              <div className="loading-progress-status" />
              <span>Uploading files...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(UploadSchema),
    mode: "onBlur",
  });

  const selectedVoiceId = watch("voiceId");

  const onSubmit = async (data: UploadFormData) => {
    try {
      setIsSubmitting(true);
      // Here you would handle the form submission
      // For now, we'll just log the data and wait a moment
      console.log("Form submitted:", data);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Reset form after successful submission
      setPdfFileName(null);
      setCoverFileName(null);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFileName(file.name);
      setValue("pdfFile", file, { shouldValidate: true });
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFileName(file.name);
      setValue("coverImage", file, { shouldValidate: true });
    }
  };

  const removePdf = () => {
    setPdfFileName(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  const removeCover = () => {
    setCoverFileName(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  return (
    <>
      <LoadingOverlay
        isVisible={isSubmitting}
        message="Processing your book..."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="new-book-wrapper">
        {/* PDF Upload Dropzone */}
        <div className="space-y-2">
          <label className="form-label">Upload PDF *</label>
          <div
            className={`upload-dropzone ${
              pdfFileName ? "upload-dropzone-uploaded" : ""
            } border-2 border-dashed border-[#8B7355]`}
            onClick={() => pdfInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) {
                setPdfFileName(file.name);
                setValue("pdfFile", file, { shouldValidate: true });
              }
            }}
          >
            {pdfFileName ? (
              <div className="flex items-center justify-between w-full px-4">
                <span className="upload-dropzone-text">{pdfFileName}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePdf();
                  }}
                  className="upload-dropzone-remove"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="upload-dropzone-icon" />
                <p className="upload-dropzone-text">Click to upload PDF</p>
                <p className="upload-dropzone-hint">PDF file (max 50MB)</p>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={pdfInputRef}
            onChange={handlePdfChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          {errors.pdfFile && (
            <p className="text-red-500 text-sm">{errors.pdfFile.message}</p>
          )}
        </div>

        {/* Cover Image Upload Dropzone */}
        <div className="space-y-2">
          <label className="form-label">Cover Image (Optional)</label>
          <div
            className={`upload-dropzone ${
              coverFileName ? "upload-dropzone-uploaded" : ""
            } border-2 border-dashed border-[#8B7355]`}
            onClick={() => coverInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) {
                setCoverFileName(file.name);
                setValue("coverImage", file, { shouldValidate: true });
              }
            }}
          >
            {coverFileName ? (
              <div className="flex items-center justify-between w-full px-4">
                <span className="upload-dropzone-text">{coverFileName}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCover();
                  }}
                  className="upload-dropzone-remove"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="upload-dropzone-icon" />
                <p className="upload-dropzone-text">
                  Click to upload cover image
                </p>
                <p className="upload-dropzone-hint">
                  Leave empty to auto-generate from PDF
                </p>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverChange}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
          />
          {errors.coverImage && (
            <p className="text-red-500 text-sm">{errors.coverImage.message}</p>
          )}
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <label className="form-label">Title *</label>
          <input
            type="text"
            placeholder="ex: Rich Dad Poor Dad"
            className="form-input border border-[#8B7355]"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title.message}</p>
          )}
        </div>

        {/* Author Input */}
        <div className="space-y-2">
          <label className="form-label">Author Name *</label>
          <input
            type="text"
            placeholder="ex: Robert Kiyosaki"
            className="form-input border border-[#8B7355]"
            {...register("author")}
          />
          {errors.author && (
            <p className="text-red-500 text-sm">{errors.author.message}</p>
          )}
        </div>

        {/* Voice Selector */}
        <div className="space-y-4">
          <label className="form-label">Choose Assistant Voice *</label>

          {/* Male Voices */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#212a3b]">
              Male Voices
            </h3>
            <div className="voice-selector-options">
              {VOICE_OPTIONS.male.map((voice) => (
                <label
                  key={voice.id}
                  className={`voice-selector-option ${
                    selectedVoiceId === voice.id
                      ? "voice-selector-option-selected"
                      : "voice-selector-option-default"
                  }`}
                >
                  <input
                    type="radio"
                    value={voice.id}
                    {...register("voiceId")}
                    className="hidden"
                  />
                  <div className="flex-1 text-center">
                    <p className="font-semibold text-[#212a3b]">{voice.name}</p>
                    <p className="text-sm text-[#3d485e]">
                      {voice.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Female Voices */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#212a3b]">
              Female Voices
            </h3>
            <div className="voice-selector-options">
              {VOICE_OPTIONS.female.map((voice) => (
                <label
                  key={voice.id}
                  className={`voice-selector-option ${
                    selectedVoiceId === voice.id
                      ? "voice-selector-option-selected"
                      : "voice-selector-option-default"
                  }`}
                >
                  <input
                    type="radio"
                    value={voice.id}
                    {...register("voiceId")}
                    className="hidden"
                  />
                  <div className="flex-1 text-center">
                    <p className="font-semibold text-[#212a3b]">{voice.name}</p>
                    <p className="text-sm text-[#3d485e]">
                      {voice.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {errors.voiceId && (
            <p className="text-red-500 text-sm">{errors.voiceId.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="form-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Begin Synthesis
        </button>
      </form>
    </>
  );
};

export default UploadForm;
