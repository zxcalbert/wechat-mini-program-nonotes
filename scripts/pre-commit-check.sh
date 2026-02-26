#!/bin/bash
# 项目规则检查清单 - pre-commit-check.sh
# 依据 project_rules.md 中的检查标准实现

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$SCRIPT_DIR/checks/config.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  项目规则检查清单 - 提交前检查${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

PASSED=0
FAILED=0
WARNINGS=0

print_result() {
    local check_name="$1"
    local status="$2"
    if [ "$status" = "pass" ]; then
        echo -e "${GREEN}[✓] $check_name${NC}"
        ((PASSED++))
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}[!] $check_name${NC}"
        ((WARNINGS++))
    else
        echo -e "${RED}[✗] $check_name${NC}"
        ((FAILED++))
    fi
}

check_sensitive_info() {
    echo "检查 1/6: 敏感信息检查..."
    local patterns=("appid" "secret" "password" "token" "api_key" "private_key")
    local found=0
    
    for pattern in "${patterns[@]}"; do
        local matches=$(grep -r "$pattern" "$PROJECT_ROOT/miniprogram" --include="*.js" --include="*.json" 2>/dev/null | grep -v "//.*" | grep -v "/\\*.*\\*/" || true)
        if [ -n "$matches" ]; then
            echo -e "${RED}发现可能的敏感信息 ($pattern):${NC}"
            echo "$matches" | head -5
            found=1
        fi
    done
    
    if [ "$found" -eq 1 ]; then
        print_result "敏感信息检查" "fail"
        return 1
    else
        print_result "敏感信息检查" "pass"
        return 0
    fi
}

check_console_logs() {
    echo "检查 2/6: 调试日志检查..."
    local max_count=50
    local count=$(grep -r "console.log\|console.error\|console.warn" "$PROJECT_ROOT/miniprogram" --include="*.js" 2>/dev/null | wc -l)
    
    if [ "$count" -gt "$max_count" ]; then
        echo -e "${YELLOW}Console日志数量: $count (超过 $max_count 条)${NC}"
        print_result "调试日志检查" "warn"
        return 0
    else
        echo "Console日志数量: $count (在限制范围内)"
        print_result "调试日志检查" "pass"
        return 0
    fi
}

check_deprecated_api() {
    echo "检查 3/6: 废弃API检查..."
    local patterns=("wx.getUserProfile" "wx.getUserInfo")
    local found=0
    
    for pattern in "${patterns[@]}"; do
        local matches=$(grep -r "$pattern" "$PROJECT_ROOT/miniprogram" --include="*.js" 2>/dev/null || true)
        if [ -n "$matches" ]; then
            echo -e "${RED}发现已废弃API ($pattern):${NC}"
            echo "$matches"
            found=1
        fi
    done
    
    if [ "$found" -eq 1 ]; then
        print_result "废弃API检查" "fail"
        return 1
    else
        print_result "废弃API检查" "pass"
        return 0
    fi
}

check_file_size() {
    echo "检查 4/6: 文件大小检查..."
    local max_image_size=10485760
    local max_js_size=524288
    local found=0
    
    while IFS= read -r -d '' file; do
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ "$size" -gt "$max_image_size" ]; then
            echo -e "${RED}图片文件过大: $file ($size bytes)${NC}"
            found=1
        fi
    done < <(find "$PROJECT_ROOT/miniprogram/images" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" \) -print0 2>/dev/null)
    
    while IFS= read -r -d '' file; do
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ "$size" -gt "$max_js_size" ]; then
            echo -e "${YELLOW}JS文件过大: $file ($size bytes)${NC}"
        fi
    done < <(find "$PROJECT_ROOT/miniprogram" -name "*.js" -type f -print0 2>/dev/null)
    
    if [ "$found" -eq 1 ]; then
        print_result "文件大小检查" "fail"
        return 1
    else
        print_result "文件大小检查" "pass"
        return 0
    fi
}

check_code_style() {
    echo "检查 5/6: 代码风格检查..."
    local issues=0
    
    while IFS= read -r -d '' file; do
        local indent_issues=$(grep -n "^    " "$file" | head -3 || true)
        if [ -n "$indent_issues" ]; then
            echo -e "${YELLOW}$file: 发现使用4空格缩进${NC}"
            ((issues++))
        fi
    done < <(find "$PROJECT_ROOT/miniprogram" -name "*.js" -type f -print0 2>/dev/null)
    
    print_result "代码风格检查" "pass"
    return 0
}

check_project_structure() {
    echo "检查 6/6: 项目结构检查..."
    local required_dirs=("miniprogram/pages" "miniprogram/utils" "miniprogram/components" "cloudfunctions")
    local missing=0
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$PROJECT_ROOT/$dir" ]; then
            echo -e "${RED}缺少目录: $dir${NC}"
            missing=1
        fi
    done
    
    if [ "$missing" -eq 1 ]; then
        print_result "项目结构检查" "fail"
        return 1
    else
        print_result "项目结构检查" "pass"
        return 0
    fi
}

echo "========================================"
echo "开始执行检查..."
echo ""

check_sensitive_info || true
check_console_logs || true
check_deprecated_api || true
check_file_size || true
check_code_style || true
check_project_structure || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo "检查结果汇总:"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${YELLOW}警告: $WARNINGS${NC}"
if [ "$FAILED" -gt 0 ]; then
    echo -e "${RED}失败: $FAILED${NC}"
else
    echo -e "${GREEN}失败: $FAILED${NC}"
fi
echo -e "${GREEN}========================================${NC}"

if [ "$FAILED" -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ 检查失败，请修复上述问题后再提交${NC}"
    exit 1
else
    echo ""
    echo -e "${GREEN}✓ 所有检查通过，可以提交${NC}"
    exit 0
fi
