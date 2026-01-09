#!/bin/bash

# GitHub Authentication Test Script for Docker Registry
# 用于测试 GitHub PAT 和 OIDC 认证

set -e

# 配置
REGISTRY_URL="${REGISTRY_URL:-registry.example.com}"
GITHUB_API="${GITHUB_API:-https://api.github.com}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

function print_error() {
    echo -e "${RED}✗ $1${NC}"
}

function print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# 测试 GitHub PAT 认证
function test_github_pat() {
    local token=$1
    
    print_info "Testing GitHub PAT authentication..."
    
    # 测试 token 是否有效
    print_info "Verifying token with GitHub API..."
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: token $token" \
        "$GITHUB_API/user")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        username=$(echo "$body" | jq -r '.login')
        print_success "GitHub token valid for user: $username"
    else
        print_error "GitHub token verification failed (HTTP $http_code)"
        return 1
    fi
    
    # 测试 Registry 认证
    print_info "Testing registry authentication..."
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" \
        "https://$REGISTRY_URL/v2/")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        print_success "Registry authentication successful"
        return 0
    else
        print_error "Registry authentication failed (HTTP $http_code)"
        echo "$response" | head -n-1
        return 1
    fi
}

# 测试 Docker login
function test_docker_login() {
    local token=$1
    local username=$2
    
    print_info "Testing docker login..."
    
    if echo "$token" | docker login "$REGISTRY_URL" -u "$username" --password-stdin 2>&1; then
        print_success "Docker login successful"
        docker logout "$REGISTRY_URL" >/dev/null 2>&1
        return 0
    else
        print_error "Docker login failed"
        return 1
    fi
}

# 解码和验证 OIDC token
function decode_oidc_token() {
    local token=$1
    
    print_info "Decoding OIDC token..."
    
    # 提取 payload（JWT 的第二部分）
    payload=$(echo "$token" | cut -d'.' -f2)
    
    # Base64 URL decode
    # 添加填充
    padding_length=$((4 - ${#payload} % 4))
    if [ $padding_length -ne 4 ]; then
        payload="${payload}$(printf '=%.0s' $(seq 1 $padding_length))"
    fi
    
    # 替换 URL-safe 字符
    payload=$(echo "$payload" | tr '_-' '/+')
    
    # 解码并格式化
    decoded=$(echo "$payload" | base64 -d 2>/dev/null | jq . 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "$decoded"
        
        # 提取关键信息
        actor=$(echo "$decoded" | jq -r '.actor // "N/A"')
        repo=$(echo "$decoded" | jq -r '.repository // "N/A"')
        exp=$(echo "$decoded" | jq -r '.exp // 0')
        
        print_info "Actor: $actor"
        print_info "Repository: $repo"
        
        # 检查过期时间
        current_time=$(date +%s)
        if [ "$exp" -gt "$current_time" ]; then
            remaining=$((exp - current_time))
            print_success "Token valid for $remaining seconds"
        else
            print_error "Token expired"
            return 1
        fi
        
        return 0
    else
        print_error "Failed to decode OIDC token"
        return 1
    fi
}

# 测试 OIDC 认证
function test_oidc_auth() {
    local token=$1
    
    print_info "Testing GitHub Actions OIDC authentication..."
    
    # 解码 token
    decode_oidc_token "$token" || return 1
    
    # 测试 Registry 认证
    print_info "Testing registry authentication with OIDC token..."
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" \
        "https://$REGISTRY_URL/v2/")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        print_success "OIDC authentication successful"
        return 0
    else
        print_error "OIDC authentication failed (HTTP $http_code)"
        echo "$response" | head -n-1
        return 1
    fi
}

# 获取 GitHub Actions OIDC token（仅在 GitHub Actions 中可用）
function get_github_actions_oidc_token() {
    local audience=$1
    
    if [ -z "$ACTIONS_ID_TOKEN_REQUEST_TOKEN" ] || [ -z "$ACTIONS_ID_TOKEN_REQUEST_URL" ]; then
        print_error "Not running in GitHub Actions environment"
        return 1
    fi
    
    print_info "Requesting OIDC token from GitHub Actions..."
    
    token=$(curl -sS -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
        "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=$audience" | jq -r .value)
    
    if [ -n "$token" ] && [ "$token" != "null" ]; then
        print_success "OIDC token obtained"
        echo "$token"
        return 0
    else
        print_error "Failed to obtain OIDC token"
        return 1
    fi
}

# 主函数
function main() {
    echo "=================================="
    echo "GitHub Authentication Test Script"
    echo "=================================="
    echo ""
    
    # 检查依赖
    for cmd in curl jq docker; do
        if ! command -v $cmd &> /dev/null; then
            print_error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # 解析参数
    case "$1" in
        pat)
            if [ -z "$2" ]; then
                print_error "Usage: $0 pat <github-token>"
                exit 1
            fi
            test_github_pat "$2"
            test_docker_login "$2" "$(whoami)"
            ;;
        
        oidc)
            if [ -z "$2" ]; then
                print_error "Usage: $0 oidc <oidc-token>"
                exit 1
            fi
            test_oidc_auth "$2"
            ;;
        
        actions)
            audience="${2:-https://$REGISTRY_URL}"
            token=$(get_github_actions_oidc_token "$audience")
            if [ $? -eq 0 ]; then
                test_oidc_auth "$token"
                test_docker_login "$token" "github-actions"
            fi
            ;;
        
        decode)
            if [ -z "$2" ]; then
                print_error "Usage: $0 decode <oidc-token>"
                exit 1
            fi
            decode_oidc_token "$2"
            ;;
        
        *)
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  pat <token>           Test GitHub Personal Access Token"
            echo "  oidc <token>          Test OIDC token"
            echo "  actions [audience]    Get and test OIDC token from GitHub Actions"
            echo "  decode <token>        Decode and display OIDC token contents"
            echo ""
            echo "Environment Variables:"
            echo "  REGISTRY_URL          Registry URL (default: registry.example.com)"
            echo "  GITHUB_API            GitHub API URL (default: https://api.github.com)"
            echo ""
            echo "Examples:"
            echo "  # Test GitHub PAT"
            echo "  $0 pat ghp_xxxxxxxxxxxx"
            echo ""
            echo "  # Test OIDC token"
            echo "  $0 oidc eyJhbGciOiJSUzI1NiIs..."
            echo ""
            echo "  # Get OIDC token in GitHub Actions"
            echo "  $0 actions https://registry.example.com"
            echo ""
            echo "  # Decode OIDC token"
            echo "  $0 decode eyJhbGciOiJSUzI1NiIs..."
            exit 1
            ;;
    esac
}

main "$@"
