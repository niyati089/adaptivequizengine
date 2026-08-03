from app.agents.mermaid_utils import sanitize_mermaid


def test_empty_input_returns_empty_string():
    assert sanitize_mermaid("") == ""
    assert sanitize_mermaid(None) == ""


def test_adds_missing_diagram_header():
    result = sanitize_mermaid('A["Start"] --> B["End"]')
    assert result.lower().startswith("flowchart td")


def test_preserves_existing_header():
    result = sanitize_mermaid('graph LR\nA["Start"] --> B["End"]')
    assert result.startswith("graph LR")
    assert result.count("flowchart") == 0


def test_strips_markdown_code_fences():
    raw = '```mermaid\nflowchart TD\nA["Start"] --> B["End"]\n```'
    result = sanitize_mermaid(raw)
    assert "```" not in result


def test_converts_single_dash_arrows_to_double():
    raw = 'flowchart TD\nA["Start"] -> B["End"]'
    result = sanitize_mermaid(raw)
    assert "-->" in result
    assert "->" not in result.replace("-->", "")


def test_quotes_unquoted_node_labels():
    raw = "flowchart TD\nA[Start] --> B[End]"
    result = sanitize_mermaid(raw)
    assert 'A["Start"]' in result
    assert 'B["End"]' in result


def test_leaves_already_quoted_labels_untouched():
    raw = 'flowchart TD\nA["Start"] --> B["End"]'
    result = sanitize_mermaid(raw)
    assert 'A["Start"]' in result
    assert 'B["End"]' in result


def test_quotes_edge_labels_containing_special_characters():
    raw = 'flowchart TD\nA["Node"] --> |yes: x=1| B["Other"]'
    result = sanitize_mermaid(raw)
    assert '|"yes: x=1"|' in result


def test_handles_multiple_lines():
    raw = "A[Start] -> B[Middle]\nB[Middle] -> C[End]"
    result = sanitize_mermaid(raw)
    lines = [l for l in result.split("\n") if l.strip()]
    # header + 2 connection lines
    assert len(lines) == 3
    assert all("-->" in l for l in lines[1:])
