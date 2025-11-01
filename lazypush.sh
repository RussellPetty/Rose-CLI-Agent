#!/bin/sh

# lazypush - Interactive git add, commit with AI message, and push
# Part of Terminal Buddy (Rose CLI)
# Usage:
#   lazypush      - Interactive file selection
#   lazypush .    - Auto-select all files, confirm before push
#   lazypush !    - Auto-select all files, auto-push without confirmation

lazypush() {
    local mode="${1:-interactive}"
    local selected_files=()

    # Check if git is initialized
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "Git not initialized. Initializing..."
        git init
        if [ $? -ne 0 ]; then
            echo "Failed to initialize git repository"
            return 1
        fi
        echo "Git repository initialized successfully"
    fi

    # Get all uncommitted files (both staged and unstaged)
    local all_files=$(git status --porcelain 2>/dev/null)

    if [ -z "$all_files" ]; then
        echo "No uncommitted files found"
        return 0
    fi

    # Handle different modes
    case "$mode" in
        ".")
            # Auto-select all files
            echo "Auto-selecting all files..."
            while IFS= read -r line; do
                local file="${line#???}"  # Remove status indicators (first 3 chars)
                if [ -n "$file" ]; then
                    selected_files+=("$file")
                fi
            done <<EOF
$all_files
EOF
            ;;
        "!")
            # Auto-select all files, will skip confirmation later
            echo "Auto-selecting all files for immediate push..."
            while IFS= read -r line; do
                local file="${line#???}"
                if [ -n "$file" ]; then
                    selected_files+=("$file")
                fi
            done <<EOF
$all_files
EOF
            ;;
        *)
            # Interactive mode - use fzf for selection
            if ! command -v fzf >/dev/null 2>&1; then
                echo "Error: fzf is required for interactive mode"
                echo "Install fzf or use 'lazypush .' or 'lazypush !' for auto-selection"
                return 1
            fi

            echo "Select files to commit (use Space to select, Enter to confirm):"
            local selected=$(echo "$all_files" | fzf --multi --height=50% --reverse \
                --prompt="Select files to commit: " \
                --bind='space:toggle+down' \
                --preview='git diff --color=always {2} 2>/dev/null || git diff --cached --color=always {2} 2>/dev/null || cat {2} 2>/dev/null' \
                --preview-window=right:60%:wrap)

            if [ -z "$selected" ]; then
                echo "No files selected. Aborting."
                return 0
            fi

            # Parse selected files
            while IFS= read -r line; do
                local file="${line#???}"
                if [ -n "$file" ]; then
                    selected_files+=("$file")
                fi
            done <<EOF
$selected
EOF
            ;;
    esac

    if [ ${#selected_files[@]} -eq 0 ]; then
        echo "No files to commit"
        return 0
    fi

    # Stage selected files
    echo "Staging files..."
    for file in "${selected_files[@]}"; do
        git add "$file"
        if [ $? -ne 0 ]; then
            echo "Failed to stage: $file"
            return 1
        fi
    done

    # Get the diff for AI commit message generation
    echo "Generating commit message with AI..."
    local diff_output=$(git diff --cached)

    if [ -z "$diff_output" ]; then
        echo "No changes to commit after staging"
        return 0
    fi

    # Determine which rose command to use (rose or tb)
    local rose_cmd="rose"
    if ! command -v rose >/dev/null 2>&1; then
        if command -v tb >/dev/null 2>&1; then
            rose_cmd="tb"
        else
            echo "Error: Terminal Buddy (rose/tb) not found"
            echo "Unstaging files..."
            git reset > /dev/null 2>&1
            return 1
        fi
    fi

    # Generate commit message using rose/tb
    local prompt="Generate a concise git commit message for these changes. Only output the commit message, nothing else:

${diff_output}"

    local commit_msg=$($rose_cmd "$prompt" 2>&1)

    if [ -z "$commit_msg" ]; then
        echo "Failed to generate commit message"
        echo "Unstaging files..."
        git reset > /dev/null 2>&1
        return 1
    fi

    # Clean up commit message (remove any extra output, keep first 10 lines)
    commit_msg=$(echo "$commit_msg" | sed '/^$/d' | head -n 10)

    # Show commit details
    echo ""
    echo "═══════════════════════════════════════════"
    echo "Commit Message:"
    echo "───────────────────────────────────────────"
    echo "$commit_msg"
    echo "═══════════════════════════════════════════"
    echo ""
    echo "Files to be committed:"
    for file in "${selected_files[@]}"; do
        echo "  ✓ $file"
    done
    echo "═══════════════════════════════════════════"
    echo ""

    # Handle confirmation based on mode
    if [ "$mode" = "!" ]; then
        # Auto-push mode - no confirmation needed
        echo "Auto-pushing..."
    else
        # Ask for confirmation
        printf "Proceed with commit and push? [y/N]: "
        read -r confirmation
        case "$confirmation" in
            [Yy]*)
                ;;
            *)
                echo "Aborting. Unstaging files..."
                git reset > /dev/null 2>&1
                return 0
                ;;
        esac
    fi

    # Commit
    echo "Committing..."
    git commit -m "$commit_msg"
    if [ $? -ne 0 ]; then
        echo "Commit failed"
        return 1
    fi

    # Push to remote
    echo "Pushing to remote..."

    # Check if remote exists
    local current_branch=$(git branch --show-current)
    local has_remote=$(git remote | wc -l)

    if [ $has_remote -eq 0 ]; then
        echo "No remote repository configured"
        echo "Commit completed successfully, but nothing to push"
        return 0
    fi

    # Try to push
    git push 2>&1 | tee /tmp/lazypush_output.txt
    local push_exit_code=${PIPESTATUS[0]}

    if [ $push_exit_code -ne 0 ]; then
        # Check if we need to set upstream
        if grep -q "no upstream branch" /tmp/lazypush_output.txt || \
           grep -q "has no upstream branch" /tmp/lazypush_output.txt; then
            echo "Setting upstream branch..."
            git push -u origin "$current_branch"
            push_exit_code=$?
        fi
    fi

    rm -f /tmp/lazypush_output.txt

    if [ $push_exit_code -eq 0 ]; then
        if [ "$mode" = "!" ]; then
            echo "✓ All files pushed successfully!"
        else
            echo "✓ Changes committed and pushed successfully!"
        fi
    else
        echo "✗ Push failed, but commit was successful"
        return 1
    fi
}
