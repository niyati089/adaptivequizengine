"use client";

import React, { useState, useRef } from "react";
import { Upload, File, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface DocumentUploadProps {
  onQuizGenerated: (quizData: any) => void;
  onCancel?: () => void;
  apiKey?: string;
}

export function DocumentUpload({ onQuizGenerated, onCancel, apiKey }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [questionsPerTopic, setQuestionsPerTopic] = useState(5);
  
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
      if (apiKey) {
        url.searchParams.append("api_key", apiKey);
      }

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
        
        // Pass the generated quiz data to parent component
        setTimeout(() => {
          onQuizGenerated(quizData);
        }, 500);
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

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Generate Quiz from Document</h2>
        <p className="text-gray-600">Upload a PDF document to automatically generate an adaptive quiz</p>
      </div>

      {/* Drag and drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"}
          ${file ? "border-green-500 bg-green-50" : ""}
          ${error ? "border-red-500 bg-red-50" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!file ? (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your PDF here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Maximum file size: 10MB
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Select PDF File
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between p-4 bg-white rounded-lg">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isUploading}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700">Quiz generated successfully!</p>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && uploadProgress && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
          <p className="text-blue-700">{uploadProgress}</p>
        </div>
      )}

      {/* Questions per topic setting */}
      {file && !isUploading && !success && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Questions per topic
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={questionsPerTopic}
            onChange={(e) => setQuestionsPerTopic(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Number of questions to generate per topic (1-10)
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleUploadAndGenerate}
          disabled={!file || isUploading || success}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </span>
          ) : success ? (
            "Generated!"
          ) : (
            "Generate Quiz"
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload your study material or lecture notes in PDF format</li>
          <li>• AI analyzes the content and extracts key topics</li>
          <li>• Questions are generated with varying difficulty levels</li>
          <li>• Quiz follows your existing adaptive learning framework</li>
        </ul>
      </div>
    </div>
  );
}
