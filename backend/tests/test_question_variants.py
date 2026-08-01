"""Tests for anti-cheat question variant generation."""
import json
from unittest.mock import Mock, patch

import pytest

from app.agents.question_gen import _shuffle_options, _validate_variant, generate_variant


@pytest.fixture
def base_question():
    """A valid base question with all required fields."""
    return {
        "question": "What is 2 + 2?",
        "options": {
            "A": "3",
            "B": "4",
            "C": "5",
            "D": "22"
        },
        "correct_answer": "B",
        "explanation": "2 + 2 equals 4",
        "difficulty": 0.5,
        "bloom_level": "Remembering",
        "misconceptions": {
            "A": "Off by one error",
            "C": "Calculation error",
            "D": "Concatenation instead of addition"
        },
        "hint": "Think about basic arithmetic"
    }


class TestShuffleOptions:
    """Tests for the option shuffling function."""
    
    def test_shuffle_preserves_all_keys(self, base_question):
        """Shuffled variant should have the same option keys A-D."""
        shuffled = _shuffle_options(base_question)
        assert set(shuffled["options"].keys()) == {"A", "B", "C", "D"}
    
    def test_shuffle_preserves_all_values(self, base_question):
        """Shuffled variant should preserve all option values."""
        shuffled = _shuffle_options(base_question)
        original_values = set(base_question["options"].values())
        shuffled_values = set(shuffled["options"].values())
        assert original_values == shuffled_values
    
    def test_shuffle_remaps_correct_answer(self, base_question):
        """The correct answer letter should be remapped after shuffling."""
        shuffled = _shuffle_options(base_question)
        # The value that was at key B should now be at whatever key correct_answer points to
        original_correct_value = base_question["options"][base_question["correct_answer"]]
        new_correct_value = shuffled["options"][shuffled["correct_answer"]]
        assert original_correct_value == new_correct_value
    
    def test_shuffle_remaps_misconceptions(self, base_question):
        """Misconception mappings should follow their options."""
        shuffled = _shuffle_options(base_question)
        # Every option that had a misconception should still have one
        assert len(shuffled["misconceptions"]) == len(base_question["misconceptions"])
        
        # Verify the misconception text followed its option
        for new_key, new_value in shuffled["options"].items():
            # Find which old key had this value
            old_key = [k for k, v in base_question["options"].items() if v == new_value][0]
            if old_key in base_question["misconceptions"]:
                assert new_key in shuffled["misconceptions"]
                assert shuffled["misconceptions"][new_key] == base_question["misconceptions"][old_key]
    
    def test_shuffle_marks_as_variant(self, base_question):
        """Shuffled result should have is_variant=True."""
        shuffled = _shuffle_options(base_question)
        assert shuffled["is_variant"] is True


class TestValidateVariant:
    """Tests for variant validation."""
    
    def test_valid_variant_passes(self, base_question):
        """A properly structured variant should pass validation."""
        assert _validate_variant(base_question) is True
    
    def test_missing_options_fails(self, base_question):
        """Variant with no options dict should fail."""
        invalid = {**base_question, "options": None}
        assert _validate_variant(invalid) is False
    
    def test_wrong_option_keys_fails(self, base_question):
        """Variant with wrong option keys (not A-D) should fail."""
        invalid = {**base_question, "options": {"X": "a", "Y": "b"}}
        assert _validate_variant(invalid) is False
    
    def test_invalid_correct_answer_fails(self, base_question):
        """Variant with correct_answer not in A-D should fail."""
        invalid = {**base_question, "correct_answer": "X"}
        assert _validate_variant(invalid) is False
    
    def test_empty_question_text_fails(self, base_question):
        """Variant with empty question text should fail."""
        invalid = {**base_question, "question": ""}
        assert _validate_variant(invalid) is False


class TestGenerateVariant:
    """Integration tests for full variant generation."""
    
    @patch("app.agents.question_gen.Groq")
    def test_successful_variant_generation(self, mock_groq_class, base_question):
        """When LLM returns valid JSON, variant should be generated successfully."""
        # Mock the Groq API response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "question": "What is 3 + 3?",  # Different numbers
            "options": {
                "A": "5",
                "B": "6",
                "C": "7",
                "D": "33"
            },
            "correct_answer": "B",
            "explanation": "3 + 3 equals 6",
            "difficulty": 0.5,
            "bloom_level": "Remembering",
            "misconceptions": {
                "A": "Off by one error",
                "C": "Calculation error",
                "D": "Concatenation instead of addition"
            },
            "hint": "Think about basic arithmetic"
        })
        
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_groq_class.return_value = mock_client
        
        variant = generate_variant(base_question, "fake-api-key")
        
        # Should be marked as a variant
        assert variant["is_variant"] is True
        # Should have different question text
        assert variant["question"] != base_question["question"]
        # Should have all required keys
        assert set(variant["options"].keys()) == {"A", "B", "C", "D"}
        # Correct answer should be valid
        assert variant["correct_answer"] in ["A", "B", "C", "D"]
    
    @patch("app.agents.question_gen.Groq")
    def test_json_parse_failure_returns_base(self, mock_groq_class, base_question):
        """When LLM returns invalid JSON, should fall back to base question."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "This is not valid JSON!"
        
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_groq_class.return_value = mock_client
        
        variant = generate_variant(base_question, "fake-api-key")
        
        # Should return base question with is_variant=False
        assert variant["is_variant"] is False
        assert variant["question"] == base_question["question"]
    
    @patch("app.agents.question_gen.Groq")
    def test_invalid_structure_returns_base(self, mock_groq_class, base_question):
        """When LLM returns JSON with invalid structure, should fall back."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "question": "Valid question",
            "options": {"X": "wrong", "Y": "keys"},  # Wrong keys
            "correct_answer": "X"
        })
        
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_groq_class.return_value = mock_client
        
        variant = generate_variant(base_question, "fake-api-key")
        
        assert variant["is_variant"] is False
        assert variant["question"] == base_question["question"]
    
    @patch("app.agents.question_gen.Groq")
    def test_network_error_returns_base(self, mock_groq_class, base_question):
        """When Groq API fails, should gracefully fall back to base."""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("Network error")
        mock_groq_class.return_value = mock_client
        
        variant = generate_variant(base_question, "fake-api-key")
        
        assert variant["is_variant"] is False
        assert variant["question"] == base_question["question"]
    
    @patch("app.agents.question_gen.Groq")
    def test_strips_code_fences(self, mock_groq_class, base_question):
        """Should strip markdown code fences if LLM includes them."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        # LLM sometimes returns JSON wrapped in markdown code blocks
        mock_response.choices[0].message.content = "```json\n" + json.dumps({
            "question": "What is 4 + 4?",
            "options": {"A": "7", "B": "8", "C": "9", "D": "44"},
            "correct_answer": "B",
            "explanation": "4 + 4 = 8",
            "difficulty": 0.5,
            "bloom_level": "Remembering",
            "misconceptions": {"A": "Off by one", "C": "Error", "D": "Concatenation"},
            "hint": "Basic math"
        }) + "\n```"
        
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_groq_class.return_value = mock_client
        
        variant = generate_variant(base_question, "fake-api-key")
        
        # Should successfully parse despite code fences
        assert variant["is_variant"] is True
        assert variant["question"] == "What is 4 + 4?"
    
    @patch("app.agents.question_gen.Groq")
    def test_preserves_misconception_categories(self, mock_groq_class, base_question):
        """Variant should maintain recognizable misconception categories."""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "question": "What is 5 + 5?",
            "options": {"A": "9", "B": "10", "C": "11", "D": "55"},
            "correct_answer": "B",
            "explanation": "5 + 5 = 10",
            "difficulty": 0.5,
            "bloom_level": "Remembering",
            "misconceptions": {
                "A": "Off by one error in counting",  # Should still match "off_by_one"
                "C": "Simple calculation mistake",     # Should match "calculation_error"
                "D": "String concatenation confusion"  # Should match category
            },
            "hint": "Add carefully"
        })
        
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_groq_class.return_value = mock_client
        
        variant = generate_variant(base_question, "fake-api-key")
        
        assert variant["is_variant"] is True
        # Misconceptions should be present and non-empty
        assert "misconceptions" in variant
        assert len(variant["misconceptions"]) >= 3
        # Text should contain recognizable patterns
        all_text = " ".join(variant["misconceptions"].values()).lower()
        # At least one of our canonical patterns should appear
        patterns = ["off by one", "calculation", "concatenat", "error"]
        assert any(pattern in all_text for pattern in patterns)
