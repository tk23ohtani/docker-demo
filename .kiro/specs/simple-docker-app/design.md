# Design Document

## Overview

シンプルなWebアプリケーションをDockerコンテナとして実行可能にする設計です。Node.jsを使用した軽量なHTTPサーバーを構築し、Dockerfileでコンテナ化します。アプリケーションは単一のエンドポイントを持ち、ヘルスチェック機能を提供します。

## Architecture

アプリケーションは以下の層で構成されます：

1. **Application Layer**: Node.jsベースのHTTPサーバー
2. **Container Layer**: Dockerコンテナ環境
3. **Network Layer**: ホストマシンとコンテナ間のポートマッピング

```
┌─────────────────────────────────┐
│      Host Machine               │
│  ┌───────────────────────────┐  │
│  │   Docker Container        │  │
│  │  ┌─────────────────────┐  │  │
│  │  │  Node.js App        │  │  │
│  │  │  (HTTP Server)      │  │  │
│  │  └─────────────────────┘  │  │
│  │         Port 3000         │  │
│  └───────────────────────────┘  │
│         Port 3000 (mapped)      │
└─────────────────────────────────┘
```

## Components and Interfaces

### HTTP Server Component

- **責任**: HTTPリクエストの受信と処理
- **インターフェース**:
  - `GET /`: ウェルカムメッセージを返す
  - `GET /health`: ヘルスチェックステータスを返す
- **依存関係**: Node.js標準ライブラリ（http module）

### Logger Component

- **責任**: リクエストログの標準出力への記録
- **インターフェース**:
  - `log(message: string)`: メッセージをコンソールに出力

### Docker Configuration

- **Dockerfile**: イメージビルド設定
- **Base Image**: node:18-alpine（軽量版）
- **Exposed Port**: 3000
- **Entry Point**: Node.jsアプリケーションの起動

## Data Models

### HTTP Request

```typescript
interface Request {
  method: string;
  url: string;
  headers: Record<string, string>;
  timestamp: Date;
}
```

### HTTP Response

```typescript
interface Response {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
}
```

### Health Status

```typescript
interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: Date;
  uptime: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: HTTP Response Availability

*For any* valid HTTP request sent to the application, the application should return an HTTP response with a valid status code.

**Validates: Requirements 1.1**

### Property 2: Request Logging

*For any* HTTP request received by the application, a log entry should be written to standard output containing request information.

**Validates: Requirements 1.3**

## Error Handling

### HTTP Server Errors

- **Port Already in Use**: アプリケーション起動時にポートが使用中の場合、エラーメッセージを出力して終了
- **Invalid Request**: 不正なHTTPリクエストを受信した場合、400 Bad Requestを返す
- **Server Error**: 内部エラーが発生した場合、500 Internal Server Errorを返し、エラーをログに記録

### Docker Build Errors

- **Missing Dependencies**: package.jsonに記載された依存関係が解決できない場合、ビルドを失敗させる
- **Invalid Dockerfile Syntax**: Dockerfileに構文エラーがある場合、ビルドを失敗させる

### Container Runtime Errors

- **Port Mapping Conflict**: ホストマシンで指定されたポートが使用中の場合、コンテナ起動を失敗させる
- **Graceful Shutdown**: SIGTERMシグナルを受信した場合、進行中のリクエストを完了してから終了

## Testing Strategy

このプロジェクトでは、ユニットテストとプロパティベーステストの両方を使用して包括的なテストカバレッジを実現します。

### Unit Testing

ユニットテストは以下をカバーします：

- **Specific Examples**: ルートエンドポイントとヘルスチェックエンドポイントの具体的な動作
- **Edge Cases**: 空のリクエスト、不正なHTTPメソッド
- **Integration Points**: HTTPサーバーの起動と停止
- **Docker Integration**: イメージビルド、コンテナ起動、ポートマッピング

**Testing Framework**: Node.jsの標準的なテストフレームワークとしてJestを使用します。

### Property-Based Testing

プロパティベーステストは以下をカバーします：

- **Universal Properties**: すべてのHTTPリクエストに対する応答の存在
- **Logging Behavior**: すべてのリクエストに対するログ出力

**Testing Framework**: JavaScriptのプロパティベーステストライブラリとして**fast-check**を使用します。

**Configuration**:
- 各プロパティベーステストは最低100回の反復を実行します
- 各テストには対応する設計ドキュメントのプロパティ番号を明示的にコメントで記載します
- タグ形式: `**Feature: simple-docker-app, Property {number}: {property_text}**`

### Test Organization

```
project/
├── src/
│   └── server.js          # アプリケーションコード
├── tests/
│   ├── unit/
│   │   ├── server.test.js      # ユニットテスト
│   │   └── docker.test.js      # Docker統合テスト
│   └── property/
│       └── server.property.test.js  # プロパティベーステスト
└── Dockerfile
```

## Implementation Notes

### Technology Stack

- **Runtime**: Node.js 18 (LTS)
- **Base Image**: node:18-alpine（軽量で最小限の依存関係）
- **HTTP Server**: Node.js標準のhttpモジュール（外部依存なし）

### File Structure

```
simple-docker-app/
├── src/
│   └── server.js          # メインアプリケーション
├── tests/                 # テストファイル
├── package.json           # Node.js依存関係
├── Dockerfile             # Dockerイメージ定義
└── README.md              # ドキュメント
```

### Docker Configuration Details

**Dockerfile Strategy**:
- Multi-stage buildは不要（シンプルなアプリケーションのため）
- node:18-alpineを使用してイメージサイズを最小化
- package.jsonとpackage-lock.jsonを先にコピーして依存関係のキャッシュを最適化
- 非rootユーザーでアプリケーションを実行（セキュリティベストプラクティス）

**Port Configuration**:
- Container Port: 3000
- Host Port: 3000（デフォルト、ユーザーが変更可能）

### Logging Format

すべてのログエントリは以下の形式で出力されます：

```
[TIMESTAMP] METHOD URL - STATUS_CODE
```

例：
```
[2024-12-02T10:30:45.123Z] GET / - 200
[2024-12-02T10:30:50.456Z] GET /health - 200
```
