"""Document processing service for extracting text from PDF files."""

from typing import List, Dict, Optional
import PyPDF2
import io
import re


class DocumentProcessor:
    """Handles PDF text extraction and intelligent chunking for LLM processing."""
    
    MAX_CHUNK_SIZE = 8000  # Conservative limit for LLM context
    
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """
        Extract all text from a PDF file.
        
        Args:
            file_bytes: PDF file content as bytes
            
        Returns:
            Extracted text as a single string
            
        Raises:
            ValueError: If PDF is invalid or empty
        """
        try:
            pdf_file = io.BytesIO(file_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            if len(pdf_reader.pages) == 0:
                raise ValueError("PDF contains no pages")
            
            extracted_text = []
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    text = page.extract_text()
                    if text.strip():
                        extracted_text.append(f"--- Page {page_num + 1} ---\n{text}")
                except Exception as e:
                    print(f"Warning: Could not extract text from page {page_num + 1}: {e}")
                    continue
            
            full_text = "\n\n".join(extracted_text)
            
            if not full_text.strip():
                raise ValueError("No text could be extracted from PDF")
            
            return full_text
            
        except PyPDF2.errors.PdfReadError as e:
            raise ValueError(f"Invalid or corrupted PDF file: {e}")
        except Exception as e:
            raise ValueError(f"Error processing PDF: {e}")
    
    @staticmethod
    def detect_sections(text: str) -> List[Dict[str, str]]:
        """
        Detect sections/chapters in document based on common heading patterns.
        
        Args:
            text: Full document text
            
        Returns:
            List of sections with title and content
        """
        sections = []
        
        # Common heading patterns (numbered sections, all caps, etc.)
        heading_patterns = [
            r'^(\d+\.?\s+[A-Z][^\n]{10,80})$',  # "1. Introduction" or "1 Introduction"
            r'^([A-Z][A-Z\s]{3,50})$',           # "INTRODUCTION" (all caps)
            r'^(Chapter\s+\d+[:\.]?\s+.{5,80})$', # "Chapter 1: Title"
            r'^(Section\s+\d+[:\.]?\s+.{5,80})$', # "Section 1: Title"
        ]
        
        lines = text.split('\n')
        current_section = {"title": "Introduction", "content": []}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line matches any heading pattern
            is_heading = False
            for pattern in heading_patterns:
                if re.match(pattern, line, re.MULTILINE):
                    # Save previous section
                    if current_section["content"]:
                        current_section["content"] = "\n".join(current_section["content"])
                        sections.append(current_section)
                    
                    # Start new section
                    current_section = {"title": line, "content": []}
                    is_heading = True
                    break
            
            if not is_heading:
                current_section["content"].append(line)
        
        # Add final section
        if current_section["content"]:
            current_section["content"] = "\n".join(current_section["content"])
            sections.append(current_section)
        
        # If no sections detected, return entire document as one section
        if not sections:
            sections = [{"title": "Document Content", "content": text}]
        
        return sections
    
    @staticmethod
    def chunk_text(text: str, max_chunk_size: int = MAX_CHUNK_SIZE) -> List[str]:
        """
        Split text into chunks that fit within LLM context limits.
        Tries to preserve paragraph boundaries.
        
        Args:
            text: Text to chunk
            max_chunk_size: Maximum characters per chunk
            
        Returns:
            List of text chunks
        """
        if len(text) <= max_chunk_size:
            return [text]
        
        chunks = []
        paragraphs = text.split('\n\n')
        current_chunk = []
        current_size = 0
        
        for para in paragraphs:
            para_size = len(para)
            
            # If single paragraph exceeds limit, split by sentences
            if para_size > max_chunk_size:
                sentences = re.split(r'([.!?]+\s+)', para)
                for sentence in sentences:
                    if current_size + len(sentence) > max_chunk_size and current_chunk:
                        chunks.append('\n\n'.join(current_chunk))
                        current_chunk = []
                        current_size = 0
                    current_chunk.append(sentence)
                    current_size += len(sentence)
            
            # Normal paragraph processing
            elif current_size + para_size > max_chunk_size and current_chunk:
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = [para]
                current_size = para_size
            else:
                current_chunk.append(para)
                current_size += para_size + 2  # +2 for \n\n
        
        # Add remaining content
        if current_chunk:
            chunks.append('\n\n'.join(current_chunk))
        
        return chunks
    
    @staticmethod
    def extract_metadata(text: str) -> Dict[str, Optional[str]]:
        """
        Extract basic metadata from document text (title, author, etc.).
        
        Args:
            text: Document text
            
        Returns:
            Dictionary with metadata fields
        """
        lines = text.split('\n')[:20]  # Check first 20 lines
        
        metadata = {
            "title": None,
            "author": None,
            "date": None
        }
        
        for line in lines:
            line = line.strip()
            
            # Try to detect title (usually first substantial line)
            if not metadata["title"] and len(line) > 10 and len(line) < 150:
                if not line.startswith('Page') and not line.startswith('---'):
                    metadata["title"] = line
            
            # Try to detect author
            if not metadata["author"]:
                author_match = re.search(r'(?:by|author|written by)[:\s]+(.{3,50})', line, re.IGNORECASE)
                if author_match:
                    metadata["author"] = author_match.group(1).strip()
            
            # Try to detect date
            if not metadata["date"]:
                date_match = re.search(r'\b(20\d{2}|19\d{2})\b', line)
                if date_match:
                    metadata["date"] = date_match.group(1)
        
        return metadata
    
    @staticmethod
    def process_pdf_for_quiz_generation(file_bytes: bytes) -> Dict:
        """
        Complete pipeline: extract text, detect structure, and prepare for quiz generation.
        
        Args:
            file_bytes: PDF file content as bytes
            
        Returns:
            Dictionary with processed document data
        """
        # Extract full text
        full_text = DocumentProcessor.extract_text_from_pdf(file_bytes)
        
        # Extract metadata
        metadata = DocumentProcessor.extract_metadata(full_text)
        
        # Detect sections
        sections = DocumentProcessor.detect_sections(full_text)
        
        # Chunk if document is very large
        chunks = DocumentProcessor.chunk_text(full_text)
        
        return {
            "full_text": full_text,
            "metadata": metadata,
            "sections": sections,
            "chunks": chunks,
            "num_pages": full_text.count("--- Page"),
            "total_chars": len(full_text),
            "needs_chunking": len(chunks) > 1
        }
