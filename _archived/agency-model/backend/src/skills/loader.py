"""Skill file loader."""

from pathlib import Path
from typing import Any

from src.utils import get_logger

from .parser import parse_skill_frontmatter

logger = get_logger(__name__)


class SkillLoader:
    """Loads SKILL.md files from the skills directory."""

    def __init__(self, skills_dir: str | Path | None = None) -> None:
        if skills_dir is None:
            # Default to project root / skills
            self.skills_dir = Path(__file__).parent.parent.parent.parent.parent / "skills"
        else:
            self.skills_dir = Path(skills_dir)

        self._cache: dict[str, dict[str, Any]] = {}

    def load_skill(self, skill_path: str) -> dict[str, Any] | None:
        """Load a single skill file.

        Args:
            skill_path: Path relative to skills directory (e.g., "core/VERIFICATION.md")

        Returns:
            Parsed skill data or None if not found
        """
        if skill_path in self._cache:
            return self._cache[skill_path]

        full_path = self.skills_dir / skill_path

        if not full_path.exists():
            logger.warning("Skill file not found", path=str(full_path))
            return None

        try:
            content = full_path.read_text(encoding="utf-8")
            skill_data = parse_skill_frontmatter(content)
            skill_data["path"] = skill_path
            skill_data["full_path"] = str(full_path)

            self._cache[skill_path] = skill_data
            logger.info("Loaded skill", name=skill_data.get("name"), path=skill_path)
            return skill_data

        except Exception as e:
            logger.error("Failed to load skill", path=skill_path, error=str(e))
            return None

    def load_all_skills(self) -> list[dict[str, Any]]:
        """Load all skill files in the skills directory.

        Returns:
            List of parsed skill data
        """
        skills = []

        if not self.skills_dir.exists():
            logger.warning("Skills directory not found", path=str(self.skills_dir))
            return skills

        for skill_file in self.skills_dir.rglob("*.md"):
            rel_path = skill_file.relative_to(self.skills_dir)
            skill_data = self.load_skill(str(rel_path))
            if skill_data:
                skills.append(skill_data)

        # Sort by priority (lower number = higher priority)
        skills.sort(key=lambda s: s.get("priority", 99))

        return skills

    def get_skill_by_name(self, name: str) -> dict[str, Any] | None:
        """Find a skill by its name.

        Args:
            name: The skill name from frontmatter

        Returns:
            Skill data or None if not found
        """
        all_skills = self.load_all_skills()
        for skill in all_skills:
            if skill.get("name") == name:
                return skill
        return None

    def get_skills_by_trigger(self, trigger: str) -> list[dict[str, Any]]:
        """Find skills that match a trigger.

        Args:
            trigger: The trigger to match

        Returns:
            List of matching skills
        """
        matching = []
        all_skills = self.load_all_skills()

        for skill in all_skills:
            triggers = skill.get("triggers", [])
            if trigger in triggers or "any_task" in triggers:
                matching.append(skill)

        return matching
