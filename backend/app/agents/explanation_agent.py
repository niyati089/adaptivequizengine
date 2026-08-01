import json
from app.core.groq_client import get_groq_client
from app.core.config import config

def sanitize_node_def(node_str: str) -> str:
    node_str = node_str.strip()
    bracket_index = -1
    bracket_char = ''
    closing_char = ''
    for i, char in enumerate(node_str):
        if char in ['[', '(', '{']:
            bracket_index = i
            bracket_char = char
            closing_char = ']' if char == '[' else (')' if char == '(' else '}')
            break
            
    if bracket_index != -1:
        node_id = node_str[:bracket_index].strip()
        last_closing = node_str.rfind(closing_char)
        if last_closing > bracket_index:
            label = node_str[bracket_index+1:last_closing].strip()
            if not (label.startswith('"') and label.endswith('"')):
                label_escaped = label.replace('"', '\\"')
                new_node = f"{node_id}{bracket_char}\"{label_escaped}\"{closing_char}"
                if last_closing + 1 < len(node_str):
                    new_node += node_str[last_closing+1:]
                node_str = new_node
    return node_str

def sanitize_part(part_str: str) -> str:
    part_str = part_str.strip()
    if not part_str:
        return ""
        
    if part_str.startswith("|"):
        second_pipe = part_str.find("|", 1)
        if second_pipe != -1:
            label = part_str[1:second_pipe].strip()
            node_def = part_str[second_pipe+1:].strip()
            
            if label and not (label.startswith('"') and label.endswith('"')):
                if any(c in label for c in ['[', ']', '(', ')', '{', '}', ',', ':', '+', '=', '-']):
                    escaped_label = label.replace('"', '\\"')
                    label = f'"{escaped_label}"'
                    
            node_def = sanitize_node_def(node_def)
            return f"|{label}| {node_def}"
            
    return sanitize_node_def(part_str)

def sanitize_mermaid(syntax: str) -> str:
    if not syntax:
        return ""
    lines = syntax.split("\n")
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            continue
        cleaned_lines.append(line)
    syntax = "\n".join(cleaned_lines).strip()
    
    has_header = False
    lower_syntax = syntax.lower()
    headers = ["graph td", "graph lr", "flowchart td", "flowchart lr", "sequencediagram", "classdiagram", "statediagram"]
    for header in headers:
        if lower_syntax.startswith(header):
            has_header = True
            break
            
    if not has_header:
        syntax = "flowchart TD\n" + syntax
        
    final_lines = []
    for line in syntax.split("\n"):
        line_str = line.strip()
        if not line_str:
            continue
        
        is_header = False
        for header in headers:
            if line_str.lower().startswith(header):
                is_header = True
                break
        
        if is_header:
            final_lines.append(line_str)
            continue
            
        # Clean up arrows - replace -> with --> but avoid triple dashes
        line_str = line_str.replace("->", "-->")
        line_str = line_str.replace("--->", "-->")
        line_str = line_str.replace(" |>", "|")
        line_str = line_str.replace("|>", "|")
        
        parts = line_str.split("-->")
        new_parts = [sanitize_part(part) for part in parts]
        
        line_str = " --> ".join(new_parts)
        final_lines.append(line_str)
        
    return "\n".join(final_lines).strip()

class ExplanationAgent:
    def __init__(self):
        self.client = get_groq_client()

    async def generate_explanation(self, question: str, correct_answer: str, difficulty: str) -> dict:
        prompt = f"""
You are an expert tutor. Provide a learner-friendly explanation for the following question and answer.
Adjust your explanation depth based on the provided difficulty level: {difficulty}.

Question: {question}
Correct Answer: {correct_answer}

Respond strictly in JSON format with the following keys:
- "explanation": A detailed explanation tailored to the difficulty.
- "key_takeaway": A short, memorable summary or key takeaway.
- "mermaid_diagram": (Optional) Valid Mermaid.js flowchart or graph syntax (TD or LR) representing the visual workflow, process, or relationship described in the explanation. Set this to null if the question is simple recall, factual trivia, or if a diagram does not add genuine educational value (e.g. "What is the capital of India?").

Strict Mermaid Syntax Rules (Crucial!):
1. Every node ID must be a simple alphanumeric word (e.g., A, B, C).
2. You MUST enclose ALL node labels in double quotes inside the shape brackets. For example: A["Label text here"] or B("Another label"). NEVER omit the double quotes for labels.
3. Always use double-dashes `-->` for connections. NEVER use single-dash `->`.
4. Do not include markdown code block backticks (```mermaid) inside the JSON value.
"""
        response = await self.client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful tutor."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content.strip()
        try:
            data = json.loads(content)
            mermaid_syntax = data.get("mermaid_diagram")
            
            # Clean and sanitize the syntax
            mermaid_syntax = sanitize_mermaid(mermaid_syntax)
            
            if mermaid_syntax and isinstance(mermaid_syntax, str) and mermaid_syntax.lower() != "null":
                import base64
                import httpx
                try:
                    # URL-safe Base64 encode the RAW string directly
                    encoded = base64.urlsafe_b64encode(mermaid_syntax.encode('utf-8')).decode('utf-8')
                    diagram_url = f"https://mermaid.ink/svg/{encoded}"
                    
                    # Verify if the diagram compiles successfully on mermaid.ink
                    async with httpx.AsyncClient() as client:
                        verify_res = await client.get(diagram_url, timeout=3.0)
                        if verify_res.status_code == 200:
                            data["diagram_url"] = diagram_url
                        else:
                            print(f"Mermaid validation failed (status {verify_res.status_code}): {mermaid_syntax}")
                            data["diagram_url"] = None
                except Exception as e:
                    print(f"Failed to encode or verify mermaid diagram: {e}")
                    data["diagram_url"] = None
            else:
                data["diagram_url"] = None
            return data
        except json.JSONDecodeError:
            return {
                "explanation": content,
                "key_takeaway": "Always review the core concepts carefully.",
                "diagram_url": None
            }
