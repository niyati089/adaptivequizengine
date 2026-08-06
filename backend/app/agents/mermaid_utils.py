"""
Best-effort cleanup for Mermaid.js syntax produced by an LLM.

LLMs reliably make the same handful of mistakes when asked for Mermaid
syntax: omitting quotes around node labels, using a single-dash `->` instead
of `-->`, forgetting the diagram-type header, or wrapping the whole thing in
a markdown code fence. This module fixes those specific, well-known issues.
It is intentionally not a full Mermaid parser -- it's a pragmatic filter that
turns "almost-valid" LLM output into valid Mermaid syntax for the common
flowchart/graph case.
"""

import httpx
import asyncio

_DIAGRAM_HEADERS = [
    "graph td", "graph lr", "flowchart td", "flowchart lr",
    "sequencediagram", "classdiagram", "statediagram",
]

_MERMAID_INK_URL = "https://mermaid.ink/img/"


def sanitize_node_def(node_str: str) -> str:
    """Ensure a node definition like `A[Label]` becomes `A["Label"]`."""
    node_str = node_str.strip()
    bracket_index = -1
    bracket_char = ""
    closing_char = ""
    for i, char in enumerate(node_str):
        if char in ["[", "(", "{"]:
            bracket_index = i
            bracket_char = char
            closing_char = "]" if char == "[" else (")" if char == "(" else "}")
            break

    if bracket_index != -1:
        node_id = node_str[:bracket_index].strip()
        last_closing = node_str.rfind(closing_char)
        if last_closing > bracket_index:
            label = node_str[bracket_index + 1:last_closing].strip()
            if not (label.startswith('"') and label.endswith('"')):
                label_escaped = label.replace('"', '\\"')
                new_node = f'{node_id}{bracket_char}"{label_escaped}"{closing_char}'
                if last_closing + 1 < len(node_str):
                    new_node += node_str[last_closing + 1:]
                node_str = new_node
    return node_str


def sanitize_part(part_str: str) -> str:
    """Sanitize one side of a `-->` connection, including an optional `|label|`."""
    part_str = part_str.strip()
    if not part_str:
        return ""

    if part_str.startswith("|"):
        second_pipe = part_str.find("|", 1)
        if second_pipe != -1:
            label = part_str[1:second_pipe].strip()
            node_def = part_str[second_pipe + 1:].strip()

            if label and not (label.startswith('"') and label.endswith('"')):
                if any(c in label for c in ["[", "]", "(", ")", "{", "}", ",", ":", "+", "=", "-"]):
                    escaped_label = label.replace('"', '\\"')
                    label = f'"{escaped_label}"'

            node_def = sanitize_node_def(node_def)
            return f"|{label}| {node_def}"

    return sanitize_node_def(part_str)


def sanitize_mermaid(syntax: str) -> str:
    """Clean up common LLM Mermaid mistakes; returns '' if input is empty."""
    if not syntax:
        return ""

    lines = syntax.split("\n")
    cleaned_lines = [line for line in lines if not line.strip().startswith("```")]
    syntax = "\n".join(cleaned_lines).strip()

    # Pre-process lines: split comma-separated statements and strip trailing commas
    raw_lines = []
    for line in syntax.split("\n"):
        line_str = line.strip()
        if not line_str:
            continue
        
        # Split on commas that are not inside quotes or node bracket shapes
        parts = []
        current = []
        in_quotes = False
        in_bracket = False
        
        for char in line_str:
            if char == '"':
                in_quotes = not in_quotes
                current.append(char)
            elif char in ["[", "(", "{"] and not in_quotes:
                in_bracket = True
                current.append(char)
            elif char in ["]", ")", "}"] and not in_quotes:
                in_bracket = False
                current.append(char)
            elif char == "," and not in_quotes and not in_bracket:
                parts.append("".join(current).strip())
                current = []
            else:
                current.append(char)
        if current:
            parts.append("".join(current).strip())
        
        for p in parts:
            p_clean = p.rstrip(",").strip()
            if p_clean:
                raw_lines.append(p_clean)

    lower_syntax = "\n".join(raw_lines).lower()
    has_header = any(lower_syntax.startswith(header) for header in _DIAGRAM_HEADERS)
    if not has_header:
        raw_lines.insert(0, "flowchart TD")

    final_lines = []
    for line_str in raw_lines:
        line_str = line_str.strip().rstrip(",")
        if not line_str:
            continue

        if any(line_str.lower().startswith(header) for header in _DIAGRAM_HEADERS):
            final_lines.append(line_str)
            continue

        # Normalize arrows: single-dash -> double-dash, avoid triple-dash artifacts.
        line_str = line_str.replace("->", "-->")
        line_str = line_str.replace("--->", "-->")
        line_str = line_str.replace(" |>", "|")
        line_str = line_str.replace("|>", "|")

        parts = line_str.split("-->")
        new_parts = [sanitize_part(part) for part in parts]

        line_str = " --> ".join(new_parts)
        final_lines.append(line_str)

    return "\n".join(final_lines).strip()


async def compile_mermaid_to_url(syntax: str) -> str | None:
    """
    Compile Mermaid syntax to a URL using Mermaid Ink API.
    Returns None if compilation fails or syntax is invalid.
    """
    if not syntax:
        return None
    
    try:
        import base64
        encoded_syntax = base64.urlsafe_b64encode(syntax.encode('utf-8')).decode('utf-8')
        diagram_url = f"https://mermaid.ink/svg/{encoded_syntax}"
        
        # Verify the diagram is valid by making a GET request
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(diagram_url)
            if response.status_code == 200:
                return diagram_url
            return None
    except Exception:
        # If compilation fails for any reason, return None
        return None
