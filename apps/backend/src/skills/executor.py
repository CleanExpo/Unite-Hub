"""Skill executor for running SKILL.md defined logic."""

from typing import Any

from src.utils import get_logger

from .loader import SkillLoader
from .parser import extract_code_blocks, extract_sections

logger = get_logger(__name__)


class SkillExecutor:
    """Executes skills based on SKILL.md definitions."""

    def __init__(self, skill_loader: SkillLoader | None = None) -> None:
        self.loader = skill_loader or SkillLoader()
        self._loaded_skills: dict[str, dict[str, Any]] = {}

    def load_skill(self, skill_path: str) -> bool:
        """Load a skill for execution.

        Args:
            skill_path: Path to the skill file

        Returns:
            True if loaded successfully
        """
        skill_data = self.loader.load_skill(skill_path)
        if skill_data:
            self._loaded_skills[skill_data["name"]] = skill_data
            return True
        return False

    def get_skill_prompt(self, skill_name: str) -> str | None:
        """Get the prompt/instructions from a skill.

        Args:
            skill_name: Name of the skill

        Returns:
            The skill's content as a prompt
        """
        if skill_name not in self._loaded_skills:
            skill = self.loader.get_skill_by_name(skill_name)
            if skill:
                self._loaded_skills[skill_name] = skill
            else:
                return None

        skill_data = self._loaded_skills[skill_name]
        return skill_data.get("content", "")

    def get_skill_sections(self, skill_name: str) -> dict[str, str]:
        """Get parsed sections from a skill.

        Args:
            skill_name: Name of the skill

        Returns:
            Dictionary of section name to content
        """
        prompt = self.get_skill_prompt(skill_name)
        if prompt:
            return extract_sections(prompt)
        return {}

    def get_verification_steps(self, skill_name: str) -> list[str]:
        """Extract verification steps from a skill.

        Args:
            skill_name: Name of the skill

        Returns:
            List of verification step descriptions
        """
        sections = self.get_skill_sections(skill_name)

        # Look for verification-related sections
        verification_content = ""
        for key in ["verification", "verification_checklist", "checklist"]:
            if key in sections:
                verification_content = sections[key]
                break

        if not verification_content:
            return []

        # Extract checklist items
        steps = []
        for line in verification_content.split("\n"):
            line = line.strip()
            if line.startswith("- [ ]") or line.startswith("- [x]"):
                step = line[5:].strip()
                if step:
                    steps.append(step)
            elif line.startswith("- "):
                step = line[2:].strip()
                if step:
                    steps.append(step)

        return steps

    def get_code_examples(self, skill_name: str) -> list[dict[str, str]]:
        """Extract code examples from a skill.

        Args:
            skill_name: Name of the skill

        Returns:
            List of code blocks with language and code
        """
        prompt = self.get_skill_prompt(skill_name)
        if prompt:
            return extract_code_blocks(prompt)
        return []

    def find_skills_for_task(self, task_description: str) -> list[dict[str, Any]]:
        """Find relevant skills for a task.

        Args:
            task_description: Description of the task

        Returns:
            List of relevant skills sorted by priority
        """
        task_lower = task_description.lower()

        # Keywords to trigger mapping
        trigger_keywords = {
            "frontend": ["frontend", "component", "ui", "react", "next"],
            "backend": ["backend", "api", "python", "agent"],
            "database": ["database", "sql", "migration", "supabase"],
            "devops": ["docker", "deploy", "ci", "cd"],
        }

        matching_triggers = []
        for trigger, keywords in trigger_keywords.items():
            if any(kw in task_lower for kw in keywords):
                matching_triggers.append(trigger)

        if not matching_triggers:
            matching_triggers = ["any_task"]

        # Find skills that match any of the triggers
        matching_skills = []
        for trigger in matching_triggers:
            skills = self.loader.get_skills_by_trigger(trigger)
            for skill in skills:
                if skill not in matching_skills:
                    matching_skills.append(skill)

        return matching_skills
