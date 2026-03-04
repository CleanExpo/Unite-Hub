"""Tests for workflow node handlers (node_handlers.py).

Covers:
- handle_start / handle_end
- handle_code (sandbox, security violations, syntax errors)
- handle_conditional (operator-based and expression-based)
- handle_loop (collection, max_iterations)
- handle_verification (rules, strict mode)
- _validate_ast (blocked names, attrs, imports)
- _safe_eval_condition / _evaluate_operator / _check_rule
- execute_node (dispatch, unknown type, timing)
- _resolve_string (template interpolation)

External-service handlers (LLM, agent, HTTP, tool, knowledge) are
excluded — they require mocked providers tested separately.
"""

import ast
from uuid import uuid4

import pytest

from src.workflow.node_handlers import (
    SecurityError,
    _check_rule,
    _evaluate_operator,
    _resolve_string,
    _safe_eval_condition,
    _validate_ast,
    execute_node,
    handle_code,
    handle_conditional,
    handle_end,
    handle_loop,
    handle_start,
    handle_verification,
)
from src.workflow.state import ExecutionState

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def state() -> ExecutionState:
    return ExecutionState(
        execution_id=uuid4(),
        workflow_id=uuid4(),
        variables={"name": "Alice", "limit": 10},
        input_data={"query": "test search", "score": 85},
        node_outputs={
            "prev_node": {"result": "ok", "count": 3},
        },
    )


# ---------------------------------------------------------------------------
# handle_start
# ---------------------------------------------------------------------------

class TestHandleStart:
    @pytest.mark.asyncio
    async def test_passes_input_data(self, state: ExecutionState):
        result = await handle_start({}, state)
        assert result["started"] is True
        assert result["query"] == "test search"
        assert result["score"] == 85


# ---------------------------------------------------------------------------
# handle_end
# ---------------------------------------------------------------------------

class TestHandleEnd:
    @pytest.mark.asyncio
    async def test_no_mapping_returns_all_outputs(self, state: ExecutionState):
        result = await handle_end({}, state)
        assert "outputs" in result
        assert result["outputs"] == state.node_outputs

    @pytest.mark.asyncio
    async def test_output_mapping_resolves_variables(self, state: ExecutionState):
        config = {
            "output_mapping": {
                "final_result": "{{prev_node.result}}",
                "static_value": "hardcoded",
            }
        }
        result = await handle_end(config, state)
        assert result["final_result"] == "ok"
        assert result["static_value"] == "hardcoded"


# ---------------------------------------------------------------------------
# handle_code
# ---------------------------------------------------------------------------

class TestHandleCode:
    @pytest.mark.asyncio
    async def test_simple_code_execution(self, state: ExecutionState):
        config = {"code": "result = 2 + 3", "language": "python"}
        result = await handle_code(config, state)
        assert result["success"] is True
        assert result["result"] == 5

    @pytest.mark.asyncio
    async def test_code_accesses_inputs(self, state: ExecutionState):
        config = {
            "code": "result = input_data['query'].upper()",
            "language": "python",
        }
        result = await handle_code(config, state)
        assert result["success"] is True
        assert result["result"] == "TEST SEARCH"

    @pytest.mark.asyncio
    async def test_code_accesses_variables(self, state: ExecutionState):
        config = {
            "code": "result = variables['name']",
            "language": "python",
        }
        result = await handle_code(config, state)
        assert result["success"] is True
        assert result["result"] == "Alice"

    @pytest.mark.asyncio
    async def test_unsupported_language_rejected(self, state: ExecutionState):
        config = {"code": "console.log('hi')", "language": "javascript"}
        result = await handle_code(config, state)
        assert "error" in result
        assert "not supported" in result["error"]

    @pytest.mark.asyncio
    async def test_syntax_error_caught(self, state: ExecutionState):
        config = {"code": "def broken(:", "language": "python"}
        result = await handle_code(config, state)
        assert result["success"] is False
        assert "Syntax error" in result["error"]

    @pytest.mark.asyncio
    async def test_import_blocked(self, state: ExecutionState):
        config = {"code": "import os\nresult = os.getcwd()", "language": "python"}
        result = await handle_code(config, state)
        assert result["success"] is False
        assert "Security violation" in result["error"]

    @pytest.mark.asyncio
    async def test_eval_blocked(self, state: ExecutionState):
        config = {"code": "result = eval('1+1')", "language": "python"}
        result = await handle_code(config, state)
        assert result["success"] is False
        assert "Security violation" in result["error"]

    @pytest.mark.asyncio
    async def test_exec_blocked(self, state: ExecutionState):
        config = {"code": "exec('x = 1')", "language": "python"}
        result = await handle_code(config, state)
        assert result["success"] is False
        assert "Security violation" in result["error"]

    @pytest.mark.asyncio
    async def test_open_blocked(self, state: ExecutionState):
        config = {"code": "f = open('/etc/passwd')", "language": "python"}
        result = await handle_code(config, state)
        assert result["success"] is False
        assert "Security violation" in result["error"]

    @pytest.mark.asyncio
    async def test_dunder_class_blocked(self, state: ExecutionState):
        config = {"code": "result = ''.__class__", "language": "python"}
        result = await handle_code(config, state)
        assert result["success"] is False
        assert "Security violation" in result["error"]

    @pytest.mark.asyncio
    async def test_safe_builtins_available(self, state: ExecutionState):
        config = {
            "code": "result = len([1, 2, 3]) + max(4, 5)",
            "language": "python",
        }
        result = await handle_code(config, state)
        assert result["success"] is True
        assert result["result"] == 8

    @pytest.mark.asyncio
    async def test_runtime_error_caught(self, state: ExecutionState):
        config = {"code": "result = 1 / 0", "language": "python"}
        result = await handle_code(config, state)
        assert result["success"] is False
        assert "error" in result


# ---------------------------------------------------------------------------
# _validate_ast
# ---------------------------------------------------------------------------

class TestValidateAst:
    def test_valid_code_passes(self):
        tree = ast.parse("x = 1 + 2", mode="exec")
        _validate_ast(tree)  # should not raise

    def test_import_raises(self):
        tree = ast.parse("import sys", mode="exec")
        with pytest.raises(SecurityError, match="[Ii]mport"):
            _validate_ast(tree)

    def test_from_import_raises(self):
        tree = ast.parse("from os import path", mode="exec")
        with pytest.raises(SecurityError, match="[Ii]mport"):
            _validate_ast(tree)

    def test_globals_blocked(self):
        tree = ast.parse("x = globals()", mode="exec")
        with pytest.raises(SecurityError, match="globals"):
            _validate_ast(tree)

    def test_dunder_subclasses_blocked(self):
        tree = ast.parse("x = object.__subclasses__()", mode="exec")
        with pytest.raises(SecurityError, match="__subclasses__"):
            _validate_ast(tree)


# ---------------------------------------------------------------------------
# handle_conditional
# ---------------------------------------------------------------------------

class TestHandleConditional:
    @pytest.mark.asyncio
    async def test_operator_eq_true(self, state: ExecutionState):
        config = {"operator": "eq", "left_value": "hello", "right_value": "hello"}
        result = await handle_conditional(config, state)
        assert result["condition"] is True

    @pytest.mark.asyncio
    async def test_operator_eq_false(self, state: ExecutionState):
        config = {"operator": "eq", "left_value": "hello", "right_value": "world"}
        result = await handle_conditional(config, state)
        assert result["condition"] is False

    @pytest.mark.asyncio
    async def test_operator_gt(self, state: ExecutionState):
        config = {"operator": "gt", "left_value": "100", "right_value": "50"}
        result = await handle_conditional(config, state)
        assert result["condition"] is True

    @pytest.mark.asyncio
    async def test_operator_lt(self, state: ExecutionState):
        config = {"operator": "lt", "left_value": "10", "right_value": "50"}
        result = await handle_conditional(config, state)
        assert result["condition"] is True

    @pytest.mark.asyncio
    async def test_operator_contains(self, state: ExecutionState):
        config = {"operator": "contains", "left_value": "hello world", "right_value": "world"}
        result = await handle_conditional(config, state)
        assert result["condition"] is True

    @pytest.mark.asyncio
    async def test_operator_not_contains(self, state: ExecutionState):
        config = {"operator": "not_contains", "left_value": "hello world", "right_value": "xyz"}
        result = await handle_conditional(config, state)
        assert result["condition"] is True

    @pytest.mark.asyncio
    async def test_operator_is_empty_true(self, state: ExecutionState):
        config = {"operator": "is_empty", "left_value": ""}
        result = await handle_conditional(config, state)
        assert result["condition"] is True

    @pytest.mark.asyncio
    async def test_operator_is_not_empty(self, state: ExecutionState):
        config = {"operator": "is_not_empty", "left_value": "something"}
        result = await handle_conditional(config, state)
        assert result["condition"] is True

    @pytest.mark.asyncio
    async def test_operator_with_variable_resolution(self, state: ExecutionState):
        config = {
            "operator": "gt",
            "left_value": "{{input.score}}",
            "right_value": "50",
        }
        result = await handle_conditional(config, state)
        assert result["condition"] is True

    @pytest.mark.asyncio
    async def test_expression_based_true(self, state: ExecutionState):
        config = {"condition": "10 > 5"}
        result = await handle_conditional(config, state)
        assert result["condition"] is True

    @pytest.mark.asyncio
    async def test_expression_based_false(self, state: ExecutionState):
        config = {"condition": "10 < 5"}
        result = await handle_conditional(config, state)
        assert result["condition"] is False

    @pytest.mark.asyncio
    async def test_expression_default_false(self, state: ExecutionState):
        config = {"condition": "False"}
        result = await handle_conditional(config, state)
        assert result["condition"] is False

    @pytest.mark.asyncio
    async def test_unknown_operator_returns_false(self, state: ExecutionState):
        config = {"operator": "nonsense", "left_value": "a", "right_value": "b"}
        result = await handle_conditional(config, state)
        assert result["condition"] is False


# ---------------------------------------------------------------------------
# _evaluate_operator
# ---------------------------------------------------------------------------

class TestEvaluateOperator:
    def test_eq(self):
        assert _evaluate_operator("eq", 1, 1) is True
        assert _evaluate_operator("equals", "a", "a") is True

    def test_ne(self):
        assert _evaluate_operator("ne", 1, 2) is True
        assert _evaluate_operator("not_equals", "a", "b") is True

    def test_gt(self):
        assert _evaluate_operator("gt", "10", "5") is True
        assert _evaluate_operator("greater_than", "3", "7") is False

    def test_gte(self):
        assert _evaluate_operator("gte", "10", "10") is True

    def test_lt(self):
        assert _evaluate_operator("lt", "3", "7") is True

    def test_lte(self):
        assert _evaluate_operator("lte", "5", "5") is True

    def test_contains(self):
        assert _evaluate_operator("contains", "hello world", "world") is True

    def test_not_contains(self):
        assert _evaluate_operator("not_contains", "hello world", "xyz") is True

    def test_is_empty(self):
        assert _evaluate_operator("is_empty", "", None) is True
        assert _evaluate_operator("is_empty", "x", None) is False

    def test_is_not_empty(self):
        assert _evaluate_operator("is_not_empty", "x", None) is True

    def test_invalid_op(self):
        assert _evaluate_operator("unknown_op", 1, 2) is False

    def test_type_error_returns_false(self):
        assert _evaluate_operator("gt", "not_a_number", "5") is False


# ---------------------------------------------------------------------------
# _safe_eval_condition
# ---------------------------------------------------------------------------

class TestSafeEvalCondition:
    def test_simple_comparison(self):
        assert _safe_eval_condition("10 > 5") is True
        assert _safe_eval_condition("3 > 7") is False

    def test_equality(self):
        assert _safe_eval_condition("42 == 42") is True
        assert _safe_eval_condition("42 != 43") is True

    def test_boolean_and(self):
        assert _safe_eval_condition("True and True") is True
        assert _safe_eval_condition("True and False") is False

    def test_boolean_or(self):
        assert _safe_eval_condition("False or True") is True

    def test_not(self):
        assert _safe_eval_condition("not False") is True

    def test_arithmetic(self):
        assert _safe_eval_condition("2 + 3 == 5") is True

    def test_invalid_expression_returns_false(self):
        assert _safe_eval_condition("not a valid expr %%%") is False

    def test_string_comparison(self):
        assert _safe_eval_condition("'abc' == 'abc'") is True


# ---------------------------------------------------------------------------
# _check_rule
# ---------------------------------------------------------------------------

class TestCheckRule:
    def test_required_present(self):
        assert _check_rule("required", "hello", None) is True

    def test_required_missing(self):
        assert _check_rule("required", None, None) is False
        assert _check_rule("required", "", None) is False

    def test_equals(self):
        assert _check_rule("equals", 42, 42) is True
        assert _check_rule("equals", 42, 43) is False

    def test_not_equals(self):
        assert _check_rule("not_equals", "a", "b") is True

    def test_contains(self):
        assert _check_rule("contains", "hello world", "world") is True
        assert _check_rule("contains", None, "world") is False

    def test_type_check(self):
        assert _check_rule("type", 42, "int") is True
        assert _check_rule("type", "hello", "str") is True
        assert _check_rule("type", 42, "str") is False

    def test_min_length(self):
        assert _check_rule("min_length", "hello", 3) is True
        assert _check_rule("min_length", "hi", 5) is False

    def test_max_length(self):
        assert _check_rule("max_length", "hi", 5) is True
        assert _check_rule("max_length", "hello world", 5) is False

    def test_unknown_rule_passes(self):
        assert _check_rule("unknown_check", "anything", None) is True


# ---------------------------------------------------------------------------
# handle_loop
# ---------------------------------------------------------------------------

class TestHandleLoop:
    @pytest.mark.asyncio
    async def test_list_collection(self, state: ExecutionState):
        config = {"collection": [1, 2, 3]}
        result = await handle_loop(config, state)
        assert result["items"] == [1, 2, 3]
        assert result["total_count"] == 3

    @pytest.mark.asyncio
    async def test_variable_collection(self, state: ExecutionState):
        state.node_outputs["data_node"] = {"items": ["a", "b", "c"]}
        config = {"collection": "{{data_node.items}}"}
        result = await handle_loop(config, state)
        assert result["items"] == ["a", "b", "c"]

    @pytest.mark.asyncio
    async def test_max_iterations_limit(self, state: ExecutionState):
        config = {"collection": list(range(200)), "max_iterations": 10}
        result = await handle_loop(config, state)
        assert result["total_count"] == 10
        assert len(result["items"]) == 10

    @pytest.mark.asyncio
    async def test_empty_collection(self, state: ExecutionState):
        config = {"collection": "[]"}
        result = await handle_loop(config, state)
        assert result["items"] == []
        assert result["total_count"] == 0

    @pytest.mark.asyncio
    async def test_item_variable_default(self, state: ExecutionState):
        config = {"collection": [1]}
        result = await handle_loop(config, state)
        assert result["item_variable"] == "item"

    @pytest.mark.asyncio
    async def test_custom_item_variable(self, state: ExecutionState):
        config = {"collection": [1], "item_variable": "record"}
        result = await handle_loop(config, state)
        assert result["item_variable"] == "record"


# ---------------------------------------------------------------------------
# handle_verification
# ---------------------------------------------------------------------------

class TestHandleVerification:
    @pytest.mark.asyncio
    async def test_all_rules_pass(self, state: ExecutionState):
        config = {
            "rules": [
                {"field": "query", "check": "required"},
                {"field": "score", "check": "type", "expected": "int"},
            ]
        }
        # Set input_data fields as variables so they resolve
        state.variables["query"] = "test search"
        state.variables["score"] = 85
        result = await handle_verification(config, state)
        assert result["passed"] is True
        assert result["violations"] == []

    @pytest.mark.asyncio
    async def test_rule_failure(self, state: ExecutionState):
        config = {
            "rules": [
                {"field": "missing_field", "check": "required", "message": "Field is required"},
            ]
        }
        result = await handle_verification(config, state)
        assert result["passed"] is False
        assert len(result["violations"]) == 1
        assert "Field is required" in result["violations"][0]

    @pytest.mark.asyncio
    async def test_strict_mode_stops_early(self, state: ExecutionState):
        config = {
            "strict": True,
            "rules": [
                {"field": "missing1", "check": "required", "message": "Missing 1"},
                {"field": "missing2", "check": "required", "message": "Missing 2"},
            ],
        }
        result = await handle_verification(config, state)
        assert result["passed"] is False
        # Strict mode stops after first failure
        assert len(result["violations"]) == 1

    @pytest.mark.asyncio
    async def test_non_strict_collects_all(self, state: ExecutionState):
        config = {
            "strict": False,
            "rules": [
                {"field": "missing1", "check": "required", "message": "Missing 1"},
                {"field": "missing2", "check": "required", "message": "Missing 2"},
            ],
        }
        result = await handle_verification(config, state)
        assert result["passed"] is False
        assert len(result["violations"]) == 2

    @pytest.mark.asyncio
    async def test_variable_field_resolution(self, state: ExecutionState):
        """Fields using {{}} syntax are resolved from state."""
        config = {
            "rules": [
                {"field": "{{input.query}}", "check": "required"},
            ]
        }
        result = await handle_verification(config, state)
        assert result["passed"] is True


# ---------------------------------------------------------------------------
# execute_node (dispatch)
# ---------------------------------------------------------------------------

class TestExecuteNode:
    @pytest.mark.asyncio
    async def test_dispatches_start(self, state: ExecutionState):
        result = await execute_node("start", {}, state)
        assert result["started"] is True
        assert "_duration_ms" in result

    @pytest.mark.asyncio
    async def test_dispatches_trigger(self, state: ExecutionState):
        result = await execute_node("trigger", {}, state)
        assert result["started"] is True

    @pytest.mark.asyncio
    async def test_dispatches_end(self, state: ExecutionState):
        result = await execute_node("end", {}, state)
        assert "outputs" in result

    @pytest.mark.asyncio
    async def test_unknown_type_returns_skipped(self, state: ExecutionState):
        result = await execute_node("unknown_type", {}, state)
        assert result["skipped"] is True
        assert "unknown_type" in result["reason"].lower()

    @pytest.mark.asyncio
    async def test_duration_tracked(self, state: ExecutionState):
        result = await execute_node("start", {}, state)
        assert isinstance(result["_duration_ms"], int)
        assert result["_duration_ms"] >= 0


# ---------------------------------------------------------------------------
# _resolve_string
# ---------------------------------------------------------------------------

class TestResolveString:
    def test_single_variable(self, state: ExecutionState):
        assert _resolve_string("Hello {{vars.name}}", state) == "Hello Alice"

    def test_multiple_variables(self, state: ExecutionState):
        text = "{{vars.name}} searched for {{input.query}}"
        result = _resolve_string(text, state)
        assert result == "Alice searched for test search"

    def test_no_templates_passthrough(self, state: ExecutionState):
        assert _resolve_string("plain text", state) == "plain text"

    def test_missing_variable_replaced_empty(self, state: ExecutionState):
        result = _resolve_string("value: {{vars.nonexistent}}", state)
        assert result == "value: "
