"use client";

import React, { useState, useRef } from "react";
import { Upload, File, X, Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react";

interface EducatorDocumentUploadProps {
  onQuizGenerated: (quizData: any) => void;
  onCancel?: () => void;
  classroomId: number;
}

export function EducatorDocumentUpload({ onQuizGenerated, onCancel, classroomId }: EducatorDocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [questionsPerTopic, setQuestionsPerTopic] = useState(5);
  const [generatedData, setGeneratedData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Reset previous states
    setError("");
    setSuccess(false);
    setGeneratedData(null);

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError("Only PDF files are supported");
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`File size exceeds 10MB limit. Your file: ${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
    setSuccess(false);
    setGeneratedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadAndGenerate = async () => {
    if (!file) return;

    setIsUploading(true);
    setError("");
    setUploadProgress("Uploading document...");

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);

      // Call the simple endpoint that does everything in one step
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const url = new URL(`${apiUrl}/api/quiz/generate-from-document-simple`);
      url.searchParams.append("questions_per_topic", questionsPerTopic.toString());

      setUploadProgress("Extracting text from PDF...");

      const response = await fetch(url.toString(), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate quiz from document");
      }

      setUploadProgress("Analyzing content and generating questions...");

      const data = await response.json();

      if (data.success && data.quiz) {
        setSuccess(true);
        setUploadProgress("Quiz generated successfully!");
        
        // Ensure quiz has required fields for flat subtopic structure
        const quizData = data.quiz;
        if (!quizData.subtopics && quizData.topics) {
          // Fallback for old nested structure - flatten it
          quizData.subtopics = [];
          quizData.topics.forEach((topic: any) => {
            if (topic.subtopics) {
              quizData.subtopics.push(...topic.subtopics);
            }
          });
        }
        
        // Store generated data and show review before applying
        setGeneratedData(quizData);
      } else {
        throw new Error("Invalid response from server");
      }

    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to generate quiz. Please try again.");
      setUploadProgress("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyQuiz = () => {
    if (generatedData) {
      onQuizGenerated(generatedData);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'grid',
      placeItems: 'center',
      zIndex: 1000,
      padding: 'var(--space-8)'
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-black)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <FileText size={24} color="var(--primary)" /> Generate from PDF
            </h2>
            <p style={{ color: 'var(--muted)', marginTop: 'var(--space-1)' }}>AI will analyze content and create quiz questions</p>
          </div>
          <button
            onClick={onCancel}
            style={{
              border: 'none',
              background: 'var(--surface-low)',
              color: 'var(--ink-secondary)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-bold)',
              cursor: 'pointer',
              fontSize: 'var(--text-lg)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Drag and drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            position: 'relative',
            border: '2px dashed',
            borderColor: isDragging ? 'var(--primary)' : 'var(--outline)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-8)',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            background: isDragging ? 'var(--primary-soft)' : file ? 'var(--success-soft)' : error ? 'var(--error-soft)' : 'var(--surface-low)',
            cursor: file ? 'default' : 'pointer'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {!file ? (
            <>
              <Upload size={32} style={{ margin: '0 auto var(--space-4)', color: isDragging ? 'var(--primary)' : 'var(--muted)' }} />
              <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--ink)', margin: '0 0 var(--space-1)' }}>
                Drop your PDF here or click to browse
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '0 0 var(--space-4)' }}>
                Maximum 10MB
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary)',
                  color: 'var(--surface)',
                  padding: 'var(--space-3) var(--space-6)',
                  fontWeight: 'var(--font-bold)',
                  cursor: 'pointer'
                }}
              >
                Select PDF
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <File size={24} color="var(--primary)" />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: 'var(--font-bold)', color: 'var(--ink)', margin: 0 }}>{file.name}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 'var(--space-1) 0 0' }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                style={{
                  border: 'none',
                  background: 'var(--surface-low)',
                  color: 'var(--ink-secondary)',
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-md)',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.5 : 1
                }}
                disabled={isUploading}
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--error-soft)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <AlertCircle size={20} color="var(--error)" style={{ flexShrink: 0, marginTop: 'var(--space-1)' }} />
            <p style={{ color: 'var(--error)', margin: 0, fontSize: 'var(--text-sm)' }}>{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: 'var(--space-1)' }} />
            <p style={{ color: 'var(--success)', margin: 0, fontSize: 'var(--text-sm)' }}>Quiz generated successfully!</p>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && uploadProgress && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--info-soft)', border: '1px solid var(--info)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Loader2 size={20} color="var(--info)" style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--info)', margin: 0, fontSize: 'var(--text-sm)' }}>{uploadProgress}</p>
          </div>
        )}

        {/* Questions per topic setting */}
        {file && !isUploading && !success && (
          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--ink)', marginBottom: 'var(--space-2)' }}>
              Questions per topic
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={questionsPerTopic}
              onChange={(e) => setQuestionsPerTopic(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '1px solid var(--outline)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                outline: 'none'
              }}
            />
            <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Number of questions to generate per topic (1-10)
            </p>
          </div>
        )}

        {/* Generated data preview */}
        {generatedData && success && (
          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--ink)', margin: '0 0 var(--space-3)' }}>Preview</h3>
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>Topic</p>
                <p style={{ fontWeight: 'var(--font-bold)', color: 'var(--ink)', margin: 'var(--space-1) 0 0' }}>{generatedData.topic || 'Not set'}</p>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>Subtopics ({(generatedData.subtopics || []).length})</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  {(generatedData.subtopics || []).slice(0, 5).map((st: string, i: number) => (
                    <span key={i} style={{ display: 'inline-block', background: 'var(--primary)', color: 'var(--surface)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)' }}>
                      {st}
                    </span>
                  ))}
                  {(generatedData.subtopics || []).length > 5 && (
                    <span style={{ display: 'inline-block', background: 'var(--surface-high)', color: 'var(--muted)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)' }}>
                      +{(generatedData.subtopics || []).length - 5} more
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 0 }}>Questions</p>
                <p style={{ fontWeight: 'var(--font-bold)', color: 'var(--ink)', margin: 'var(--space-1) 0 0' }}>{(generatedData.questions || []).length} questions generated</p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
          {!success && (
            <button
              onClick={onCancel}
              disabled={isUploading}
              style={{
                flex: 1,
                padding: 'var(--space-3)',
                border: '1px solid var(--outline)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                fontWeight: 'var(--font-bold)',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.5 : 1
              }}
              disabled={isUploading}
            >
              Cancel
            </button>
          )}
          <button
            onClick={success ? handleApplyQuiz : handleUploadAndGenerate}
            disabled={!file || (isUploading && !success) || (!success && !file)}
            style={{
              flex: 1,
              padding: 'var(--space-3)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary)',
              color: 'var(--surface)',
              fontWeight: 'var(--font-bold)',
              cursor: !file || (isUploading && !success) || (!success && !file) ? 'not-allowed' : 'pointer',
              opacity: !file || (isUploading && !success) || (!success && !file) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)'
            }}
            disabled={!file || (isUploading && !success) || (!success && !file)}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Generating...
              </>
            ) : success ? (
              'Apply to Quiz Form'
            ) : (
              'Generate Quiz'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
