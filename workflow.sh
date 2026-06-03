#!/bin/sh
# ============================================================================
# workflow.sh — Programming Flow Automation Script
# ============================================================================
#
# PURPOSE:
#   Automates the software development workflow using AI agents and a
#   file-based state machine. Follows the Unix philosophy where
#   "everything is a file" — instructions, proposals, plans, state,
#   and approvals are all represented as files on disk.
#
# CORE CYCLE:
#   Instruction → Proposal → Approval → Plan → Approval → Execution → Verification
#
# PHILOSOPHY:
#   - Everything is a file: state, queue, artifacts, approvals
#   - Recursive: invokes itself for each step of the cycle
#   - Human-in-the-loop: approval via touch .approve / .reject
#   - Auditable: every action is logged with timestamp
#   - Self-documenting: help mode shows complete usage
#
# ARCHITECTURE:
#   The workflow is a state machine. Each transition creates or modifies a file.
#   The script calls itself recursively to advance through the cycle steps.
#   Environment flags control automation level (DRY_RUN, AUTO_APPROVE).
#
# USAGE: ./workflow.sh <mode> [arguments]
#
# MODES:
#   propose  <text>           Step 1-2: Generate proposal from instruction
#   plan     <file>           Step 4-5: Generate plan from approved proposal
#   execute  <file>           Step 7-8: Execute plan step by step
#   verify                    Step 9:   Run validations and generate report
#   full     [--auto] <text>  Complete cycle: propose → plan → execute → verify
#   analyze  <text>           Scan source code and generate context
#   ai       <text>           Generate AI proposal via opencode
#   train    <subcmd>         Manage training examples
#     naming  <pattern>       Set file naming pattern
#     example <file> [result] Register training example
#     list                    List all training examples
#     show    <id>            Show specific training example
#   listen                    Watch inbox/ for incoming instructions
#   status                    Show current workflow state
#   clean                     Reset workflow state
#   clean-all                 Reset state and remove all generated files
#   help                      Show this help message
#
# ENVIRONMENT FLAGS:
#   DRY_RUN=true           Preview commands without executing
#   CONTINUE_ON_ERROR=true Continue execution after step failure
#   AUTO_APPROVE=true      Auto-approve proposals and plans without human review
#
# FILES:
#   .workflow/state               Current state (idle, proposing, planning, etc.)
#   .workflow/cycle               Current cycle number
#   .workflow/lock                PID lock for concurrency safety
#   .workflow/workflow.log        Audit log
#   .workflow/checkpoint          Resume-from step for interrupted execution
#   .workflow/naming.cfg          File naming pattern configuration
#   .workflow/context.md          Dynamic project context for AI
#   .workflow/inbox/              Instruction queue (drop .md files here)
#   .workflow/outbox/             Generated artifacts (proposals, plans, results)
#   .workflow/training/           Training examples directory
#   .workflow/training/examples.jsonl  Training examples database
# ============================================================================

# ============================================================================
# CONSTANTS
# ============================================================================
SCRIPT="$(realpath "$0")"
PROJECT_ROOT="$(dirname "$SCRIPT")"
WORKFLOW_DIR="$PROJECT_ROOT/.workflow"
INBOX_DIR="$WORKFLOW_DIR/inbox"
OUTBOX_DIR="$WORKFLOW_DIR/outbox"
STATE_FILE="$WORKFLOW_DIR/state"
CYCLE_FILE="$WORKFLOW_DIR/cycle"
LOCK_FILE="$WORKFLOW_DIR/lock"
LOG_FILE="$WORKFLOW_DIR/workflow.log"
PID_FILE="$WORKFLOW_DIR/listen.pid"
CHECKPOINT_FILE="$WORKFLOW_DIR/checkpoint"
NAMING_CONFIG_FILE="$WORKFLOW_DIR/naming.cfg"
TRAINING_DIR="$WORKFLOW_DIR/training"
TRAINING_EXAMPLES_FILE="$TRAINING_DIR/examples.jsonl"

# ============================================================================
# ENVIRONMENT FLAGS
# ============================================================================
DRY_RUN="${DRY_RUN:-false}"
CONTINUE_ON_ERROR="${CONTINUE_ON_ERROR:-false}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

# --- Log a message to both log file and stderr ---
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
    echo "$*" >&2
}

# --- Output a message to stdout (for piping/capturing) ---
output() {
    echo "$*"
}

# --- Initialize workflow directories and files ---
init() {
    mkdir -p "$INBOX_DIR" "$OUTBOX_DIR" "$TRAINING_DIR"
    touch "$STATE_FILE" "$CYCLE_FILE" "$LOG_FILE" "$TRAINING_EXAMPLES_FILE"

    if [ ! -f "$NAMING_CONFIG_FILE" ]; then
        cat > "$NAMING_CONFIG_FILE" <<-CFG
naming_pattern={type}_{label}_v1_0_{state}.md
CFG
    fi
}

# --- Handle a fatal error: log, set state, and exit ---
handle_error() {
    message="$1"
    exit_code="${2:-1}"
    log "ERROR: $message"
    set_state "error"
    exit "$exit_code"
}

# ============================================================================
# STATE MANAGEMENT
# ============================================================================

# --- Get current workflow state (default: idle) ---
get_state() {
    cat "$STATE_FILE" 2>/dev/null || echo "idle"
}

# --- Set current workflow state ---
set_state() {
    echo "$1" > "$STATE_FILE"
    log "STATE → $1"
}

# --- Get current cycle number (default: 0) ---
get_cycle() {
    cat "$CYCLE_FILE" 2>/dev/null || echo "0"
}

# --- Increment cycle number ---
inc_cycle() {
    current=$(get_cycle)
    next=$((current + 1))
    echo "$next" > "$CYCLE_FILE"
    log "CYCLE → $next"
}

# ============================================================================
# LOCK MANAGEMENT
# ============================================================================

# --- Acquire a PID lock to prevent concurrent execution ---
acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        pid=$(cat "$LOCK_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log "ERROR: process $pid is already running. Aborting."
            exit 1
        fi
        log "WARN: removing stale lock from dead process $pid"
    fi
    echo "$$" > "$LOCK_FILE"
    trap 'rm -f "$LOCK_FILE"' EXIT
}

# ============================================================================
# NAMING AND FILE HELPERS
# ============================================================================

# --- Sanitize a string for use in filenames (uppercase, underscores) ---
sanitize_slug() {
    echo "$1" | tr '[:lower:]' '[:upper:]' | sed 's/[^A-Z0-9]/_/g; s/_\+/_/g; s/^_//; s/_$//'
}

# --- Get the current naming pattern from config file ---
get_naming_pattern() {
    grep '^naming_pattern=' "$NAMING_CONFIG_FILE" 2>/dev/null | cut -d= -f2- || echo '{type}_{label}_v1_0_{state}.md'
}

# --- Generate a filename using the configured naming pattern ---
# Usage: make_filename <type> <label> [version] [state] [module]
make_filename() {
    type="$1"
    label="$2"
    version="${3:-1_0}"
    state="${4:-DRAFT}"
    module="${5:-CORE}"
    pattern=$(get_naming_pattern)

    if [ -z "$label" ]; then
        label="CICLO_$(get_cycle)"
    fi

    slug=$(sanitize_slug "$label")

    filename=$(printf '%s' "$pattern" | sed \
        -e "s/{type}/$type/g" \
        -e "s/{label}/$slug/g" \
        -e "s/{version}/$version/g" \
        -e "s/{state}/$state/g" \
        -e "s/{module}/$module/g")

    echo "$filename"
}

# --- Set the naming pattern in config file ---
set_naming_pattern() {
    pattern="$1"

    if [ -z "$pattern" ]; then
        log "ERROR: naming pattern cannot be empty"
        return 1
    fi

    mkdir -p "$(dirname "$NAMING_CONFIG_FILE")"
    grep -v '^naming_pattern=' "$NAMING_CONFIG_FILE" 2>/dev/null > "$NAMING_CONFIG_FILE.tmp" || true
    printf 'naming_pattern=%s\n' "$pattern" >> "$NAMING_CONFIG_FILE.tmp"
    mv "$NAMING_CONFIG_FILE.tmp" "$NAMING_CONFIG_FILE"
    log "OK: naming pattern set to '$pattern'"
}

# ============================================================================
# TRAINING FUNCTIONS
# ============================================================================

# --- Register a training example from a JSON file ---
train_example() {
    example_file="$1"
    result="${2:-}"

    if [ -z "$example_file" ]; then
        handle_error "missing example file argument"
    fi

    if [ ! -f "$example_file" ]; then
        handle_error "example file not found: $example_file"
    fi

    example_id="example_$(date +%s)_$(basename "$example_file" | sed 's/\.[^.]*$//' | tr '[:upper:]' '[:lower:]')"

    py_script="/tmp/train_example_$$.py"
    cat > "$py_script" <<-PYEOF
import json, sys, os
entry = {
    'id': os.environ.get('EX_ID', ''),
    'timestamp': os.environ.get('EX_TS', ''),
    'source': os.environ.get('EX_FILE', ''),
    'type': 'example',
    'result': os.environ.get('EX_RESULT', '')
}
with open(os.environ['EX_FILE']) as f:
    raw = f.read()
try:
    entry['content'] = json.loads(raw)
except json.JSONDecodeError:
    entry['content'] = raw
with open(os.environ['EX_TRAINING'], 'a') as f:
    f.write(json.dumps(entry, ensure_ascii=False) + '\n')
PYEOF

    EX_ID="$example_id" \
    EX_FILE="$example_file" \
    EX_TS="$(date -Iseconds)" \
    EX_RESULT="$result" \
    EX_TRAINING="$TRAINING_EXAMPLES_FILE" \
    python3 "$py_script"

    rm -f "$py_script"

    total_examples=$(wc -l < "$TRAINING_EXAMPLES_FILE")
    output "Example registered: $example_id"
    output "  Source: $example_file"
    output "  Total: $total_examples examples"
    log "OK: trained example $example_id from $example_file"
}

# --- List all registered training examples ---
train_list() {
    if [ ! -f "$TRAINING_EXAMPLES_FILE" ] || [ ! -s "$TRAINING_EXAMPLES_FILE" ]; then
        output "No training examples registered."
        return 0
    fi

    output "=== Training Examples ==="
    output ""
    printf "%-30s %-25s %-12s %s\n" "ID" "Timestamp" "Type" "Source"
    printf "%-30s %-25s %-12s %s\n" "---" "---------" "----" "------"

    python3 -c "
import json, sys
with open('$TRAINING_EXAMPLES_FILE') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            id_val = obj.get('id', '?')[:28]
            ts = obj.get('timestamp', '?')[:23]
            t = obj.get('type', '?')[:10]
            src = obj.get('source', '?')[:50]
            print(f'{id_val:<30} {ts:<25} {t:<12} {src}')
        except json.JSONDecodeError:
            pass
" 2>&1

    output ""
    total=$(wc -l < "$TRAINING_EXAMPLES_FILE")
    output "Total: $total examples"
}

# --- Show a specific training example by ID (partial match supported) ---
train_show() {
    search="$1"

    if [ -z "$search" ]; then
        output "Usage: $0 train show <id>"
        output "Use '$0 train list' to see available IDs"
        return 1
    fi

    if [ ! -f "$TRAINING_EXAMPLES_FILE" ]; then
        output "No training examples registered."
        return 1
    fi

    python3 -c "
import json, sys
search = '$search'.lower()
found = False
with open('$TRAINING_EXAMPLES_FILE') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            obj_id = obj.get('id', '')
            if search in obj_id.lower() or search == obj_id:
                print('=== Example:', obj_id, '===')
                print(json.dumps(obj, indent=2, ensure_ascii=False))
                found = True
                break
        except json.JSONDecodeError:
            pass
if not found:
    print('No example found with ID containing \"$search\"')
    sys.exit(1)
" 2>&1
}

# --- Dispatch training subcommands ---
train() {
    init
    subcommand="$1"
    shift 2>/dev/null || true

    case "$subcommand" in
        naming)
            pattern="$*"
            if [ -z "$pattern" ]; then
                output "Usage: $0 train naming '<pattern>'"
                exit 1
            fi
            set_naming_pattern "$pattern"
            echo "{\"timestamp\":\"$(date -Iseconds)\",\"type\":\"naming\",\"pattern\":\"$pattern\"}" >> "$TRAINING_EXAMPLES_FILE"
            ;;
        example)
            train_example "$@"
            ;;
        list)
            train_list
            ;;
        show)
            train_show "$@"
            ;;
        *)
            output "Usage: $0 train naming '<pattern>'"
            output "       $0 train example <file> [result]"
            output "       $0 train list"
            output "       $0 train show <id>"
            exit 1
            ;;
    esac
}

# ============================================================================
# CORE WORKFLOW FUNCTIONS
# ============================================================================

# --- Step 1-2: Generate a proposal from an instruction ---
propose() {
    acquire_lock
    set_state "proposing"
    inc_cycle
    cycle=$(get_cycle)
    instruction="$*"

    if [ -z "$instruction" ]; then
        handle_error "instruction cannot be empty"
    fi

    instruction_file="$INBOX_DIR/cycle_${cycle}_instruction.md"
    cat > "$instruction_file" <<-EOF
---
id: instruction_${cycle}
type: INSTRUCTION
actor: user
timestamp: $(date -Iseconds)
status: received
---

# Instruction — Cycle $cycle

$instruction
EOF
    log "OK: instruction written to $instruction_file"

    label="CICLO_${cycle}"
    proposal_file="$OUTBOX_DIR/$(make_filename PROPUESTA "$label" "1_0" "DRAFT")"
    context_file="$WORKFLOW_DIR/context.md"

    if [ -f "$context_file" ]; then
        context_block=$(head -c 1000 "$context_file")
    else
        context_block="$(echo "$instruction" | head -c 500)"
    fi

    cat > "$proposal_file" <<-EOF
---
id: propuesta_${cycle}
type: PROPUESTA
actor: system
timestamp: $(date -Iseconds)
status: DRAFT
source: ${instruction_file}
tags:
  - proposal
  - cycle-${cycle}
summary: "Proposal generated from instruction in cycle ${cycle}."
---

# Proposal — Cycle $cycle

## Context

$context_block

## Analysis

The instruction requests a change to the codebase:

- **Motivation:** (why this change is needed)
- **Files potentially affected:** (list relevant files)
- **Dependencies:** (services, modules, libraries involved)
- **Alternatives considered:** (briefly note discarded options)

## Approach

1. **Objective:** (what will be implemented/changed)
2. **Strategy:** (how it will be implemented)
3. **Testing:** (how it will be verified)
4. **Success criteria:** (what determines completion)

## Implications

- **Performance:** (expected impact)
- **Security:** (security considerations)
- **Database:** (schema changes if applicable)
- **Backward compatibility:** (breaking changes)
- **Maintainability:** (technical debt, test coverage)

---
_Generated by workflow.sh at $(date)_
EOF

    log "OK: proposal generated at $proposal_file"
    set_state "awaiting_review:proposal:$cycle"
    output "$proposal_file"
}

# --- Step 3: Wait for human approval of a proposal ---
await_proposal_approval() {
    proposal_file="$1"
    cycle="$2"
    approve_file="${proposal_file}.approve"
    reject_file="${proposal_file}.reject"

    if [ "$AUTO_APPROVE" = "true" ] && [ ! -f "$approve_file" ] && [ ! -f "$reject_file" ]; then
        touch "$approve_file"
        log "AUTO-APPROVE: proposal automatically approved"
    fi

    log "WAITING: human review for proposal: $proposal_file"
    log "  To APPROVE: touch \"$approve_file\""
    log "  To REJECT:  touch \"$reject_file\""

    while true; do
        if [ -f "$approve_file" ]; then
            log "OK: proposal APPROVED"
            rm -f "$reject_file" 2>/dev/null
            set_state "approved:proposal:$cycle"
            return 0
        fi
        if [ -f "$reject_file" ]; then
            log "OK: proposal REJECTED"
            rm -f "$approve_file" 2>/dev/null
            set_state "rejected:proposal:$cycle"
            return 1
        fi
        sleep 2
    done
}

# --- Step 4-5: Generate a plan from an approved proposal ---
plan() {
    acquire_lock
    proposal_file="$1"
    set_state "planning"

    if [ ! -f "$proposal_file" ]; then
        handle_error "proposal file not found: $proposal_file"
    fi

    cycle=$(get_cycle)
    label="CICLO_${cycle}"
    plan_file="$OUTBOX_DIR/$(make_filename PLAN "$label" "1_0" "DRAFT")"

    proposal_summary=$(grep "^summary:" "$proposal_file" 2>/dev/null | sed 's/summary: "//;s/"$//' || echo "")

    context_file="$WORKFLOW_DIR/context.md"
    if [ -f "$context_file" ]; then
        context_block=$(head -c 800 "$context_file")
    else
        context_block=""
    fi

    cat > "$plan_file" <<-EOF
---
id: plan_${cycle}
type: PLAN
actor: system
timestamp: $(date -Iseconds)
status: DRAFT
source: ${proposal_file}
dependencies: []
tags:
  - plan
  - cycle-${cycle}
summary: "Execution plan for proposal in cycle ${cycle}: ${proposal_summary}"
---

# Execution Plan — Cycle $cycle

## Analysis Context

$context_block

## Pre-flight Checks

- [ ] Branch created from main
- [ ] Dependencies installed (npm ci)
- [ ] Prisma Client generated (npm run db:generate)
- [ ] Environment variables verified

## Prerequisites

\`\`\`bash
npm ci
npm run db:generate
\`\`\`

## Steps

Atomic steps needed to complete the proposal.
Each step follows: files → action → verification.

### Step 1: [Action]

- **Files involved:**
- **Action:**
- **Commands:**
  \`\`\`bash
  # Commands to execute for this step
  \`\`\`
- **Verification:**

## Post-execution

- [ ] Run \`npm run build\`
- [ ] Run \`npm test\`
- [ ] Verify results

## Rollback

Procedure to revert each step on failure:

- **Step 1:** (how to revert step 1)
- **General rule:** If any step fails, stop execution and revert.
  Use \`git checkout\` for uncommitted changes and
  \`git revert\` for committed changes.

## Risks

- **Availability:** (external service outages)
- **Database:** (data loss, failed migrations)
- **Execution time:** (steps that may take longer than expected)
- **External dependencies:** (third-party APIs, libraries)

---
_Generated by workflow.sh at $(date)_
EOF

    log "OK: plan generated at $plan_file"
    set_state "awaiting_review:plan:$cycle"
    output "$plan_file"
}

# --- Step 6: Wait for human approval of a plan ---
await_plan_approval() {
    plan_file="$1"
    cycle="$2"
    approve_file="${plan_file}.approve"
    reject_file="${plan_file}.reject"

    if [ "$AUTO_APPROVE" = "true" ] && [ ! -f "$approve_file" ] && [ ! -f "$reject_file" ]; then
        touch "$approve_file"
        log "AUTO-APPROVE: plan automatically approved"
    fi

    log "WAITING: human review for plan: $plan_file"
    log "  To APPROVE: touch \"$approve_file\""
    log "  To REJECT:  touch \"$reject_file\""

    while true; do
        if [ -f "$approve_file" ]; then
            log "OK: plan APPROVED"
            rm -f "$reject_file" 2>/dev/null
            set_state "approved:plan:$cycle"
            return 0
        fi
        if [ -f "$reject_file" ]; then
            log "OK: plan REJECTED"
            rm -f "$approve_file" 2>/dev/null
            set_state "rejected:plan:$cycle"
            return 1
        fi
        sleep 2
    done
}

# --- Rollback uncommitted changes using git ---
rollback() {
    log "ROLLBACK: reverting uncommitted changes"
    if [ -n "$ROLLBACK_HASH" ]; then
        git checkout -- "$PROJECT_ROOT" 2>/dev/null || true
        log "ROLLBACK: files restored to $ROLLBACK_HASH"
    fi
}

# --- Step 7-8: Execute a plan step by step ---
execute() {
    acquire_lock
    plan_file="$1"
    set_state "executing"

    if [ ! -f "$plan_file" ]; then
        handle_error "plan file not found: $plan_file"
    fi

    cycle=$(get_cycle)
    result_file="$OUTBOX_DIR/$(make_filename RESULTADO "CICLO_${cycle}" "1_0" "EXECUTED")"

    # Git snapshot for rollback
    ROLLBACK_HASH=""
    if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
        ROLLBACK_HASH=$(git rev-parse HEAD)
        log "GIT: snapshot at $ROLLBACK_HASH"
    fi

    log "EXECUTING: plan $plan_file"

    # Checkpoint: resume from last completed step
    RESUME_FROM=""
    if [ -f "$CHECKPOINT_FILE" ]; then
        RESUME_FROM=$(cat "$CHECKPOINT_FILE")
        log "CHECKPOINT: resuming from step $RESUME_FROM"
    fi

    # Extract steps from plan (lines starting with "### Step N:")
    steps_file="$WORKFLOW_DIR/steps_$$.tmp"
    grep -E "^### Step [0-9]+:" "$plan_file" > "$steps_file" 2>/dev/null || true

    if [ ! -s "$steps_file" ]; then
        log "WARN: no steps found in plan (looking for '### Step N:' headers)"
    fi

    # Execution log
    execution_log="$OUTBOX_DIR/cycle_${cycle}_execution_log.md"
    cat > "$execution_log" <<-EOF
# Execution Log — Cycle $cycle

**Plan:** $plan_file
**Started:** $(date -Iseconds)

## Steps

EOF

    while read -r line; do
        step_number=$(echo "$line" | sed 's/^### Step \([0-9]*\):.*/\1/')
        step_name=$(echo "$line" | sed 's/^### Step [0-9]*: \(.*\)/\1/')

        if [ -z "$step_number" ]; then
            continue
        fi

        # Skip if already completed via checkpoint
        if [ -n "$RESUME_FROM" ] && [ "$step_number" -le "$RESUME_FROM" ]; then
            log "SKIP: step $step_number already completed (checkpoint)"
            echo "- **Step $step_number:** $step_name ✅ (from checkpoint)" >> "$execution_log"
            continue
        fi

        log "RUNNING: step $step_number: $step_name"

        # Extract bash commands from the step block
        step_content=$(sed -n "/^### Step $step_number:/,/^### Step /p" "$plan_file" 2>/dev/null | head -n -1 || true)
        commands=$(echo "$step_content" | sed -n '/```bash/,/```/p' | sed '1d;$d' 2>/dev/null || true)

        if [ -n "$commands" ]; then
            log "  commands found for step $step_number"
            {
                echo "### Execution Step $step_number: $step_name"
                echo '```bash'
                echo "$commands"
                echo '```'
            } >> "$execution_log"

            if [ "$DRY_RUN" != "true" ]; then
                if echo "$commands" | sh >> "$execution_log" 2>&1; then
                    echo "✅ Step $step_number completed" >> "$execution_log"
                    log "OK: step $step_number completed"
                    echo "$step_number" > "$CHECKPOINT_FILE"
                else
                    exit_code=$?
                    echo "❌ Step $step_number FAILED (exit: $exit_code)" >> "$execution_log"
                    log "ERROR: step $step_number failed (exit code: $exit_code)"
                    echo "- **Step $step_number:** $step_name ❌ FAILED" >> "$execution_log"

                    if [ "$CONTINUE_ON_ERROR" != "true" ]; then
                        log "ABORT: stopping execution due to step $step_number failure"
                        rollback
                        break
                    fi
                fi
            else
                log "DRY-RUN: commands for step $step_number (not executed)"
                echo "✅ Step $step_number: DRY-RUN (not executed)" >> "$execution_log"
            fi
        fi

        echo "- **Step $step_number:** $step_name ✅ COMPLETED" >> "$execution_log"
    done < "$steps_file"

    rm -f "$steps_file"
    rm -f "$CHECKPOINT_FILE"

    {
        echo ""
        echo "## Result"
        echo "- **Status:** EXECUTED"
    } >> "$execution_log"

    cat > "$result_file" <<-EOF
---
id: resultado_${cycle}
type: RESULTADO
actor: system
timestamp: $(date -Iseconds)
status: EXECUTED
source: ${plan_file}
---

# Execution Result — Cycle $cycle

**Plan:** $plan_file
**Execution log:** $execution_log
**Status:** PARTIALLY COMPLETED

Pending:
- [ ] Review the execution log to confirm each step completed
- [ ] Run manual validations if needed
- [ ] Run \`workflow.sh verify\` for automated validation
EOF

    log "OK: execution completed at $result_file"
    set_state "executed:$cycle"
    output "$result_file"
}

# --- Step 9: Run validations and generate verification report ---
verify() {
    acquire_lock
    set_state "verifying"
    cycle=$(get_cycle)
    report_file="$OUTBOX_DIR/$(make_filename VERIFICACION "CICLO_${cycle}" "1_0" "VERIFIED")"

    log "VERIFY: running validations..."

    {
        echo "---"
        echo "id: verificacion_${cycle}"
        echo "type: VERIFICACION"
        echo "actor: system"
        echo "timestamp: $(date -Iseconds)"
        echo "status: VERIFIED"
        echo "---"
        echo ""
        echo "# Verification Report — Cycle $cycle"
        echo ""
        echo "## Validations"
        echo ""

        if command -v npm >/dev/null 2>&1 && [ -f "$PROJECT_ROOT/package.json" ]; then
            echo "### Build"
            if npm run build >/dev/null 2>&1; then
                echo "- build: ✅ OK"
            else
                echo "- build: ❌ FAILED"
            fi

            echo ""
            echo "### Unit Tests"
            if npm test >/dev/null 2>&1; then
                echo "- test: ✅ OK"
            else
                echo "- test: ❌ FAILED"
            fi
        else
            echo "### Validation"
            echo "- npm not available — skipping automatic validations"
        fi

        echo ""
        echo "## Files modified in this cycle"
        echo ""
        ls -la "$OUTBOX_DIR/" 2>/dev/null | grep "cycle_${cycle}_" || echo "(no files registered)"
        echo ""
        echo "## Pending"
        echo ""
        echo "- [ ] Developer should visually confirm all changes"
        echo "- [ ] If OK: \`rm -rf $WORKFLOW_DIR\` to clean up"
        echo "- [ ] If issues: iterate from \`propose\`"
    } > "$report_file"

    log "OK: verification report at $report_file"
    set_state "verified:$cycle"
    output "$report_file"
}

# ============================================================================
# ANALYSIS AND AI FUNCTIONS
# ============================================================================

# --- Scan source code for context relevant to an instruction ---
analyze() {
    instruction="$*"
    context_file="$WORKFLOW_DIR/context.md"

    {
        echo "# Project Context"
        echo ""
        echo "Instruction: $instruction"
        echo ""

        echo "## Potentially Relevant Files"
        for word in $instruction; do
            [ "${#word}" -lt 4 ] && continue
            found=$(find "$PROJECT_ROOT/apps/api/src" -name "*.ts" -path "*${word}*" 2>/dev/null | head -5)
            if [ -n "$found" ]; then
                echo ""
                echo "### $word"
                echo "$found"
            fi
        done

        echo ""
        echo "## Controllers and Endpoints"
        grep -rn "@Controller\|@Public\|@Roles\|@Get\|@Post\|@Put\|@Patch\|@Delete" \
            "$PROJECT_ROOT/apps/api/src" --include="*.ts" 2>/dev/null | head -30

        echo ""
        echo "## Module Files"
        find "$PROJECT_ROOT/apps/api/src" -name "*.module.ts" 2>/dev/null | head -10
    } > "$context_file"

    log "OK: context generated at $context_file"
    output "$context_file"
}

# --- Generate a proposal using opencode AI ---
ai_propose() {
    instruction="$*"

    if [ -z "$instruction" ]; then
        handle_error "instruction cannot be empty for ai-propose"
    fi

    log "AI: analyzing source code..."
    analyze "$instruction" >/dev/null 2>&1

    cycle=$(get_cycle)
    label="CICLO_${cycle}"
    proposal_file="$OUTBOX_DIR/$(make_filename PROPUESTA "$label" "1_0" "DRAFT")"

    if ! command -v opencode >/dev/null 2>&1; then
        log "AI: opencode not available, using standard template"
        propose "$instruction"
        return
    fi

    context_file="$WORKFLOW_DIR/context.md"
    project_context=""
    if [ -f "$context_file" ]; then
        project_context=$(cat "$context_file")
    fi

    prompt="You are a software architect for @tienda/api (NestJS + Prisma + PostgreSQL + Redis)."
    prompt="$prompt

## User Instruction
$instruction

## Project Context
$project_context

## Output Format
Generate a .md file with YAML frontmatter and sections: Analysis, Proposal, Implications."

    log "AI: generating proposal with opencode..."
    echo "$prompt" | opencode --model big-pickle --quiet > "$proposal_file" 2>/dev/null

    if [ -f "$proposal_file" ] && [ -s "$proposal_file" ]; then
        log "OK: AI proposal generated at $proposal_file"
        set_state "awaiting_review:proposal:$cycle"
        output "$proposal_file"
    else
        log "WARN: AI generation failed, falling back to standard template"
        propose "$instruction"
    fi
}

# ============================================================================
# LISTEN MODE — Watch inbox directory for new instructions
# ============================================================================
listen() {
    init
    log "LISTEN: started (PID: $$)"
    echo "$$" > "$PID_FILE"
    set_state "listening"

    while true; do
        for instruction_file in "$INBOX_DIR"/*.md; do
            [ -f "$instruction_file" ] || continue

            base_name=$(basename "$instruction_file" .md)
            processing_file="${instruction_file%.md}.processing"

            if mv "$instruction_file" "$processing_file" 2>/dev/null; then
                log "LISTEN: new instruction detected: $base_name"

                # Extract instruction content from markdown
                instruction=$(grep -v "^---$" "$processing_file" | \
                    grep -v "^id:" | grep -v "^type:" | \
                    grep -v "^actor:" | grep -v "^timestamp:" | \
                    grep -v "^status:" | grep -v "^tags:" | \
                    grep -v "^- " | grep -v "^summary:" | \
                    tail -n +5 2>/dev/null || echo "")

                if [ -z "$instruction" ]; then
                    instruction=$(tail -n +20 "$processing_file" 2>/dev/null || echo "Instruction from file")
                fi

                # Recursive: call self to propose
                log "LISTEN: invoking propose recursively"
                proposal_file=$("$SCRIPT" propose "$instruction" 2>>"$LOG_FILE")

                if [ -n "$proposal_file" ] && [ -f "$proposal_file" ]; then
                    log "LISTEN: proposal ready. Waiting for human approval..."
                    if "$SCRIPT" await-propuesta "$proposal_file" 2>>"$LOG_FILE"; then
                        log "LISTEN: proposal approved. Generating plan..."
                        plan_file=$("$SCRIPT" plan "$proposal_file" 2>>"$LOG_FILE")

                        if [ -n "$plan_file" ] && [ -f "$plan_file" ]; then
                            log "LISTEN: plan ready. Waiting for human approval..."
                            if "$SCRIPT" await-plan "$plan_file" 2>>"$LOG_FILE"; then
                                log "LISTEN: plan approved. Executing..."
                                result_file=$("$SCRIPT" execute "$plan_file" 2>>"$LOG_FILE")
                                log "LISTEN: execution complete: $result_file"
                                "$SCRIPT" verify 2>>"$LOG_FILE"
                                log "LISTEN: cycle completed."
                            fi
                        fi
                    fi
                fi

                done_file="${processing_file%.processing}.done"
                mv "$processing_file" "$done_file" 2>/dev/null || true
                log "LISTEN: instruction processed: $done_file"
            fi
        done
        sleep 5
    done
}

# ============================================================================
# STATUS AND CLEANUP
# ============================================================================

# --- Display current workflow state ---
show_status() {
    output "=== Workflow Status ==="
    output "PID: $$"
    output "Script: $SCRIPT"
    output "Workflow directory: $WORKFLOW_DIR"
    output "State: $(get_state)"
    output "Cycle: $(get_cycle)"
    output ""
    output "=== Inbox ==="
    ls -la "$INBOX_DIR" 2>/dev/null || output "(empty)"
    output ""
    output "=== Outbox ==="
    ls -la "$OUTBOX_DIR" 2>/dev/null || output "(empty)"
    output ""
    output "=== Recent Log ==="
    tail -5 "$LOG_FILE" 2>/dev/null || output "(no log)"
}

# --- Reset workflow state ---
clean() {
    log "CLEAN: resetting workflow state..."

    if [ -f "$PID_FILE" ]; then
        pid=$(cat "$PID_FILE")
        kill "$pid" 2>/dev/null && log "CLEAN: stopped listener PID $pid" || true
        rm -f "$PID_FILE"
    fi

    rm -f "$LOCK_FILE" "$STATE_FILE" "$CYCLE_FILE"
    echo "idle" > "$STATE_FILE"
    echo "0" > "$CYCLE_FILE"

    log "OK: state reset to idle, cycle 0"
    output "Workflow cleaned. State: idle, Cycle: 0"
}

# --- Reset state and remove all generated files ---
clean_all() {
    clean
    rm -rf "$INBOX_DIR"/* "$OUTBOX_DIR"/* 2>/dev/null
    log "CLEAN: removed all inbox and outbox files"
    output "All generated files removed."
}

# ============================================================================
# FULL CYCLE — propose → plan → execute → verify
# ============================================================================
run_full_cycle() {
    auto_mode=false

    case "$1" in
        --auto) auto_mode=true; shift ;;
    esac

    instruction="$*"

    if [ -z "$instruction" ]; then
        output "Usage: $0 full [--auto] <instruction>"
        exit 1
    fi

    proposal_file=$("$SCRIPT" propose "$instruction")

    if [ "$auto_mode" != "true" ]; then
        output ""
        output "═══ Review the proposal ═══"
        output "  $proposal_file"
        output ""
        output "To APPROVE: touch \"${proposal_file}.approve\""
        output "To REJECT:  touch \"${proposal_file}.reject\""
        output "Waiting..."
    fi

    if AUTO_APPROVE="$auto_mode" "$SCRIPT" await-propuesta "$proposal_file"; then
        plan_file=$("$SCRIPT" plan "$proposal_file")

        if [ "$auto_mode" != "true" ]; then
            output ""
            output "═══ Review the plan ═══"
            output "  $plan_file"
            output ""
            output "To APPROVE: touch \"${plan_file}.approve\""
            output "To REJECT:  touch \"${plan_file}.reject\""
            output "Waiting..."
        fi

        if AUTO_APPROVE="$auto_mode" "$SCRIPT" await-plan "$plan_file"; then
            output ""
            output "═══ Executing plan ═══"
            "$SCRIPT" execute "$plan_file"
            output ""
            output "═══ Verifying ═══"
            "$SCRIPT" verify
            output ""
            output "Cycle complete."
        else
            output "Plan rejected. Cycle aborted."
        fi
    else
        output "Proposal rejected. Cycle aborted."
    fi
}

# ============================================================================
# HELP
# ============================================================================
show_help() {
    cat <<-EOF
workflow.sh — Programming Flow Automation Script
=================================================

PURPOSE:
  Automates the software development workflow using AI agents.
  Follows "everything is a file" -- instructions, proposals, plans,
  state, and approvals are all files on disk.

CORE CYCLE:
  Instruction -> Proposal -> Approval -> Plan -> Approval -> Execution -> Verification

FILES:
  .workflow/inbox/*.md           Instructions (drop .md files here)
  .workflow/outbox/*_PROPUESTA_*.md  Generated proposals
  .workflow/outbox/*_PLAN_*.md       Generated plans
  .workflow/outbox/*_RESULTADO_*.md  Execution results
  .workflow/state                 Current workflow state
  .workflow/cycle                 Current cycle number
  touch <file>.approve            Approve a proposal or plan
  touch <file>.reject             Reject a proposal or plan

MODES:
  full [--auto] <instruction>     Complete cycle (propose -> plan -> execute -> verify)
  analyze <text>                  Scan source code, generate context in .workflow/context.md
  ai <text>                       Generate proposal using opencode with project context
  propose <text>                  Step 1-2: Generate proposal from instruction
  plan <proposal-file>            Step 4-5: Generate plan from approved proposal
  execute <plan-file>             Step 7-8: Execute plan step by step
  verify                          Step 9:   Run validations and generate report
  listen                          Watch inbox/ for new instructions (background mode)
  status                          Show current workflow state
  train naming '<pattern>'        Set file naming pattern
  train example <file> [result]   Register training example
  train list                      List all training examples
  train show <id>                 Show a specific training example
  clean                           Reset workflow state
  clean-all                       Reset state and remove all generated files
  help                            Show this help message

ENVIRONMENT FLAGS:
  DRY_RUN=true                 Preview commands without executing
  CONTINUE_ON_ERROR=true       Continue execution after step failure
  AUTO_APPROVE=true            Auto-approve without human intervention

EXAMPLES:
  ./workflow.sh full --auto "Create a notification module in NestJS"
  DRY_RUN=true ./workflow.sh execute <plan-file>
  ./workflow.sh full --auto "Add a GET /health/detailed endpoint"
  ./workflow.sh listen &                       # Start listener in background
  echo 'My idea' > .workflow/inbox/my-idea.md  # Send instruction to listener

FILE NAMING PATTERN:
  Default: {type}_{label}_v1_0_{state}.md
  Custom:  ./workflow.sh train naming '{type}_{module}_{label}_v{version}_{state}.md'
EOF
}

# ============================================================================
# MAIN DISPATCH
# ============================================================================
main() {
    init

    case "${1:-help}" in
        propose)
            shift
            propose "$*"
            ;;
        await-propuesta)
            await_proposal_approval "$2" "$(get_cycle)"
            ;;
        await-plan)
            await_plan_approval "$2" "$(get_cycle)"
            ;;
        plan)
            plan "$2"
            ;;
        execute)
            execute "$2"
            ;;
        verify)
            verify
            ;;
        listen)
            listen
            ;;
        status)
            show_status
            ;;
        train)
            shift
            train "$@"
            ;;
        clean)
            clean
            ;;
        clean-all|cleanall)
            clean_all
            ;;
        analyze)
            shift
            analyze "$*"
            ;;
        ai|ai-propose)
            shift
            ai_propose "$*"
            ;;
        full)
            shift
            run_full_cycle "$@"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            output "Unknown mode: $1"
            output "Usage: $0 help"
            exit 1
            ;;
    esac
}

main "$@"
