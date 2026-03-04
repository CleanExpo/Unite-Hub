"""YAML frontmatter parser for SKILL.md files."""

import re
from typing import Any

import yaml

from src.utils import get_logger

logger = get_logger(__name__)

FRONTMATTER_PATTERN = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def parse_skill_frontmatter(content: str) -> dict[str, Any]:
    """Parse a SKILL.md file and extract frontmatter and content.

    Args:
        content: The full content of the markdown file

    Returns:
        Dictionary with frontmatter fields and 'content' containing the markdown body
    """
    result: dict[str, Any] = {
        "name": "",
        "version": "1.0.0",
        "description": "",
        "author": "",
        "priority": 99,
        "triggers": [],
        "requires": [],
        "content": "",
    }

    match = FRONTMATTER_PATTERN.match(content)

    if match:
        frontmatter_str = match.group(1)
        try:
            frontmatter = yaml.safe_load(frontmatter_str)
            if isinstance(frontmatter, dict):
                result.update(frontmatter)
        except yaml.YAMLError as e:
            logger.warning("Failed to parse YAML frontmatter", error=str(e))

        # Extract content after frontmatter
        result["content"] = content[match.end():].strip()
    else:
        # No frontmatter, entire content is markdown
        result["content"] = content.strip()

    return result


def extract_sections(content: str) -> dict[str, str]:
    """Extract markdown sections from skill content.

    Args:
        content: The markdown content (without frontmatter)

    Returns:
        Dictionary mapping section headers to their content
    """
    sections: dict[str, str] = {}
    current_section = "introduction"
    current_content: list[str] = []

    for line in content.split("\n"):
        if line.startswith("## "):
            # Save previous section
            if current_content:
                sections[current_section] = "\n".join(current_content).strip()

            # Start new section
            current_section = line[3:].strip().lower().replace(" ", "_")
            current_content = []
        else:
            current_content.append(line)

    # Save last section
    if current_content:
        sections[current_section] = "\n".join(current_content).strip()

    return sections


def extract_code_blocks(content: str) -> list[dict[str, str]]:
    """Extract code blocks from markdown content.

    Args:
        content: The markdown content

    Returns:
        List of code blocks with 'language' and 'code' keys
    """
    code_blocks: list[dict[str, str]] = []
    pattern = re.compile(r"```(\w*)\n(.*?)```", re.DOTALL)

    for match in pattern.finditer(content):
        code_blocks.append({
            "language": match.group(1) or "text",
            "code": match.group(2).strip(),
        })

    return code_blocks
