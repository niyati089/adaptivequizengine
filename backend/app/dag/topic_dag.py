import networkx as nx
import httpx
from groq import Groq
import json
import logging

logger = logging.getLogger(__name__)

class TopicDAGEngine:
    """
    Manages topic dependencies using a Directed Acyclic Graph and LLM generation.
    """
    
    def __init__(self, api_key: str):
        self.graph = nx.DiGraph()
        self.api_key = api_key.strip()
        
    def generate_dag_and_notes(self, topic: str) -> dict:
        client = Groq(
            api_key=self.api_key,
            http_client=httpx.Client(verify=False)
        )
        prompt = f"""You are an expert educator. The user wants to learn about: "{topic}"

Return ONLY this exact JSON structure (no markdown, no explanation, no extra keys):

{{
  "dag": {{
    "nodes": [
      {{"id": "n1", "label": "Subtopic Name", "level": 0}},
      {{"id": "n2", "label": "Another Subtopic", "level": 1}}
    ],
    "edges": [
      {{"from": "n1", "to": "n2"}}
    ]
  }},
  "subtopics": [
    {{"id": "n1", "title": "Subtopic Name", "level": 0}},
    {{"id": "n2", "title": "Another Subtopic", "level": 1}}
  ]
}}

Rules:
- 5 to 8 subtopics, ordered from fundamentals (level 0) to advanced (higher level)
- Edges point from prerequisite to dependent (prerequisite → dependent)
- Every node in dag.nodes must also appear in subtopics with matching id
- Topic: "{topic}"
- RESPOND ONLY WITH JSON. NO OTHER TEXT."""

        last_error = None
        for attempt in range(3):
            try:
                message = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    max_tokens=1500,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                )

                raw = message.choices[0].message.content.strip()

                # Strip markdown fences if model adds them despite instruction
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                raw = raw.strip()

                # Extract the outermost JSON object
                start_idx = raw.find('{')
                end_idx = raw.rfind('}')
                if start_idx == -1 or end_idx == -1:
                    raise ValueError("No JSON object found in LLM response")

                data = json.loads(raw[start_idx:end_idx + 1], strict=False)

                # Validate required keys exist
                if "subtopics" not in data or not isinstance(data["subtopics"], list):
                    raise ValueError(f"Missing or invalid 'subtopics' key. Got keys: {list(data.keys())}")

                if len(data["subtopics"]) == 0:
                    raise ValueError("subtopics list is empty")

                # Ensure every subtopic has required fields
                cleaned_subtopics = []
                for i, st in enumerate(data["subtopics"]):
                    cleaned_subtopics.append({
                        "id": st.get("id", f"n{i}"),
                        "title": st.get("title") or st.get("label") or st.get("name") or f"Subtopic {i+1}",
                        "level": st.get("level", i),
                    })
                data["subtopics"] = cleaned_subtopics

                # Ensure dag key exists
                if "dag" not in data:
                    data["dag"] = {
                        "nodes": [{"id": s["id"], "label": s["title"], "level": s["level"]} for s in cleaned_subtopics],
                        "edges": []
                    }

                logger.info(f"DAG generated successfully for '{topic}' on attempt {attempt + 1}")
                return data

            except Exception as e:
                last_error = e
                logger.warning(f"DAG generation attempt {attempt + 1} failed: {e}")
                continue

        raise RuntimeError(f"Failed to generate DAG after 3 attempts: {last_error}")

    def add_dependency(self, prerequisite: str, target: str):
        """Add a prerequisite edge between topics."""
        self.graph.add_edge(prerequisite, target)
        
    def get_next_topic(self, current_topic: str, mastery_level: float) -> str:
        """Find the next optimal topic based on mastery level."""
        pass
