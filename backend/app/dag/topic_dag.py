import networkx as nx
from groq import Groq
import json

class TopicDAGEngine:
    """
    Manages topic dependencies using a Directed Acyclic Graph and LLM generation.
    """
    
    def __init__(self, api_key: str):
        self.graph = nx.DiGraph()
        self.api_key = api_key
        
    def generate_dag_and_notes(self, topic: str) -> dict:
        client = Groq(api_key=self.api_key)
        prompt = f"""You are an expert educator. The user wants to learn about: "{topic}"

Generate a comprehensive learning structure. Respond ONLY with valid JSON (no markdown, no backticks):

{{
  "dag": {{
    "nodes": [
      {{"id": "node_id", "label": "Subtopic Name", "level": 0, "bloom": "remember"}}
    ],
    "edges": [
      {{"from": "node_id_1", "to": "node_id_2"}}
    ]
  }},
  "subtopics": [
    {{
      "id": "node_id",
      "title": "Subtopic Title",
      "level": 0,
      "bloom": "remember",
      "notes": "Detailed markdown notes for this subtopic (300-500 words). Include definitions, examples, key formulas/code if relevant."
    }}
  ]
}}

Rules:
- Create 5-8 subtopics ordered from fundamentals to advanced
- level 0 = prerequisite/foundation, higher = more advanced
- DAG edges show prerequisites (from=prerequisite, to=dependent)
- bloom levels: remember → understand → apply → analyze → evaluate → create
- notes must be genuinely educational, not placeholder text
- Include code examples in markdown code blocks where relevant
- Topic: {topic}"""

        message = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        raw = message.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        return json.loads(raw, strict=False)

    def add_dependency(self, prerequisite: str, target: str):
        """
        TODO: Implement adding topic dependencies.
        """
        pass
        
    def get_next_topic(self, current_topic: str, mastery_level: float) -> str:
        """
        TODO: Implement logic to find next optimal topic.
        """
        pass
