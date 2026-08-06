"""Quiz generation service from document content using LLM."""

from typing import List, Dict, Optional
import json
from groq import Groq
import httpx


class DocumentQuizGenerator:
    """Generates adaptive quiz questions from document content using LLM."""
    
    def __init__(self, api_key: str):
        """
        Initialize the quiz generator with Groq API client.
        
        Args:
            api_key: Groq API key
        """
        self.client = Groq(
            api_key=api_key,
            http_client=httpx.Client(verify=False)
        )
    
    def extract_topics_and_subtopics(self, document_text: str, max_topics: int = 1) -> Dict:
        """
        Analyze document and extract main topics with maximum 10 most important subtopics.
        
        Args:
            document_text: Full or chunked document text
            max_topics: Maximum number of main topics to extract (default 1 for flat list)
            
        Returns:
            Dictionary with topics and their subtopics (max 10 total)
        """
        prompt = f"""Analyze this educational document CAREFULLY and extract the MOST IMPORTANT subtopics.

CRITICAL INSTRUCTIONS:
1. Extract a FLAT LIST of MAXIMUM 10 most important subtopics from the entire document
2. Do NOT organize by topics - just give 10 key learning objectives/concepts
3. Each subtopic should be DISTINCT, IMPORTANT, and represent a core concept
4. Focus on: key concepts, principles, methods, applications, critical skills
5. Prioritize subtopics by importance and frequency in the document
6. Each subtopic should be specific and testable
7. Format as a simple flat list, not nested by topics

Document:
{document_text[:6000]}

Respond ONLY with valid JSON (no markdown, no backticks):
{{
  "document_title": "Brief title describing the document",
  "subtopics": [
    {{
      "name": "Important Subtopic 1",
      "description": "Brief description"
    }},
    {{
      "name": "Important Subtopic 2",
      "description": "Brief description"
    }},
    {{
      "name": "Important Subtopic 3",
      "description": "Brief description"
    }},
    {{
      "name": "Important Subtopic 4",
      "description": "Brief description"
    }},
    {{
      "name": "Important Subtopic 5",
      "description": "Brief description"
    }}
  ]
}}

Maximum 10 subtopics total. Quality over quantity. Only the most important concepts."""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            raw = response.choices[0].message.content.strip()
            
            # Clean up potential markdown artifacts
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()
            
            return json.loads(raw, strict=False)
            
        except Exception as e:
            print(f"Error extracting topics: {e}")
            # Fallback structure with flat list
            return {
                "document_title": "Document Content",
                "subtopics": [
                    {"name": "Key Concepts", "description": "Main concepts from the document"},
                    {"name": "Definitions", "description": "Important definitions"},
                    {"name": "Applications", "description": "Practical applications"},
                    {"name": "Examples", "description": "Examples and case studies"},
                    {"name": "Best Practices", "description": "Best practices and recommendations"}
                ]
            }
    
    def generate_questions_for_topic(
        self,
        topic: str,
        subtopic: str,
        document_text: str,
        num_questions: int = 5,
        difficulty_range: tuple = (-1.5, 1.5),
        bloom_levels: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Generate quiz questions for a specific topic/subtopic from document.
        
        Args:
            topic: Main topic name
            subtopic: Subtopic name
            document_text: Relevant document text
            num_questions: Number of questions to generate
            difficulty_range: IRT difficulty range (min, max)
            bloom_levels: List of Bloom's taxonomy levels to cover
            
        Returns:
            List of question dictionaries
        """
        if bloom_levels is None:
            bloom_levels = ["Remember", "Understand", "Apply", "Analyze"]
        
        # Distribute questions across difficulty levels
        difficulties = self._generate_difficulty_distribution(num_questions, difficulty_range)
        
        # Select bloom levels for each question
        bloom_distribution = [bloom_levels[i % len(bloom_levels)] for i in range(num_questions)]
        
        prompt = f"""Generate {num_questions} multiple-choice questions based on this document content.

Topic: {topic}
Subtopic: {subtopic}

Document Content:
{document_text[:5000]}

IMPORTANT: Generate questions that:
1. Test understanding of concepts from the document
2. Vary in difficulty: {difficulties}
3. Cover Bloom's levels: {bloom_distribution}
4. Have 4 options (A, B, C, D) with one correct answer
5. Include misconceptions for wrong answers
6. CRITICAL: Vary the position of the correct answer across A, B, C, D - do NOT always put it in B, A, or C
7. Make option lengths varied - do NOT make the longest sentence always be correct
8. Mix up option lengths randomly across all options

Respond ONLY with valid JSON (no markdown, no backticks):
{{
  "questions": [
    {{
      "question": "Question text based on document content",
      "concept": "Specific concept being tested",
      "options": {{
        "A": "Option A text - varied length",
        "B": "Option B text - can be short or long",
        "C": "Option C text - different length from others",
        "D": "Option D text - another variation"
      }},
      "correct_answer": "A",
      "explanation": "Why this answer is correct and what makes it the best choice",
      "difficulty": -0.5,
      "bloom_level": "Understand",
      "misconceptions": {{
        "A": "Not used if A is correct",
        "B": "Common misconception for option B",
        "C": "Common misconception for option C",
        "D": "Common misconception for option D"
      }},
      "hint": "Helpful hint without giving away the answer",
      "document_reference": "Brief reference to relevant part of document"
    }}
  ]
}}

Difficulty calibration guide:
- Beginner (-3 to -1.5): recall facts, identify concepts from document
- Elementary (-1.5 to -0.5): understand relationships explained in document
- Intermediate (-0.5 to 0.5): apply concepts to new scenarios
- Advanced (0.5 to 1.5): analyze and compare concepts from document
- Expert (1.5 to 3): evaluate and synthesize information

REMEMBER: Correct answer position must be random (A, B, C, or D) - vary it!"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                max_tokens=3000,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            raw = response.choices[0].message.content.strip()
            
            # Clean up potential markdown artifacts
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()
            
            data = json.loads(raw, strict=False)
            questions = data.get("questions", [])
            
            # Validate and add default fields
            validated_questions = []
            for q in questions:
                if self._validate_question(q):
                    # Ensure all required fields exist
                    q.setdefault("hint", "Review the relevant section in the document")
                    q.setdefault("document_reference", "See document content")
                    validated_questions.append(q)
            
            return validated_questions
            
        except Exception as e:
            print(f"Error generating questions: {e}")
            return []
    
    def generate_complete_quiz(
        self,
        document_text: str,
        sections: List[Dict],
        questions_per_topic: int = 5
    ) -> Dict:
        """
        Generate a complete quiz from document with subtopics and questions.
        
        Args:
            document_text: Full document text
            sections: Document sections with titles and content
            questions_per_topic: Number of questions per subtopic
            
        Returns:
            Complete quiz structure
        """
        # Extract subtopics from document (flat list, max 10)
        topics_data = self.extract_topics_and_subtopics(document_text)
        
        quiz_structure = {
            "title": topics_data.get("document_title", "Document Quiz"),
            "source": "document_upload",
            "subtopics": []
        }
        
        # Generate questions for each subtopic
        for subtopic_info in topics_data.get("subtopics", [])[:10]:  # Max 10
            subtopic_name = subtopic_info["name"]
            
            # Find relevant document sections
            relevant_text = self._find_relevant_content(
                document_text,
                sections,
                subtopic_name,
                subtopic_name
            )
            
            # Generate questions for this subtopic
            questions = self.generate_questions_for_topic(
                topic="Main Topic",
                subtopic=subtopic_name,
                document_text=relevant_text,
                num_questions=questions_per_topic
            )
            
            quiz_structure["subtopics"].append({
                "name": subtopic_name,
                "description": subtopic_info.get("description", ""),
                "questions": questions
            })
        
        return quiz_structure
    
    @staticmethod
    def _generate_difficulty_distribution(num_questions: int, difficulty_range: tuple) -> List[float]:
        """Generate evenly distributed difficulty values."""
        min_diff, max_diff = difficulty_range
        step = (max_diff - min_diff) / max(num_questions - 1, 1)
        return [round(min_diff + (i * step), 2) for i in range(num_questions)]
    
    @staticmethod
    def _validate_question(question: Dict) -> bool:
        """Validate question structure."""
        required_fields = ["question", "options", "correct_answer", "explanation"]
        
        if not all(field in question for field in required_fields):
            return False
        
        options = question.get("options", {})
        if not isinstance(options, dict) or set(options.keys()) != {"A", "B", "C", "D"}:
            return False
        
        if question.get("correct_answer") not in {"A", "B", "C", "D"}:
            return False
        
        return True
    
    @staticmethod
    def _find_relevant_content(
        full_text: str,
        sections: List[Dict],
        topic: str,
        subtopic: str
    ) -> str:
        """
        Find document content most relevant to the topic/subtopic.
        
        Args:
            full_text: Complete document text
            sections: Document sections
            topic: Topic name
            subtopic: Subtopic name
            
        Returns:
            Relevant text excerpt
        """
        # Try to find section matching topic or subtopic
        topic_lower = topic.lower()
        subtopic_lower = subtopic.lower()
        
        for section in sections:
            title_lower = section["title"].lower()
            if topic_lower in title_lower or subtopic_lower in title_lower:
                return section["content"][:6000]  # Limit to prevent context overflow
        
        # If no specific section found, return beginning of document
        return full_text[:6000]
